const express = require('express');
const router = express.Router();
const LocationLog = require('../models/locationLogs');
const cityMapper = require('../utils/cityMapper');
const haversineDistance = require("../utils/haversine");
const { isFar, isImpossibleJump } = require("../utils/fraud");
const { getLastPing, saveLastPing } = require('../utils/redisHelper');

// GET /api/location - Health check
router.get('/', (req, res) => {
  res.send('Location Logging Service is up and running!');
});

// POST /api/location/ping - Main fraud detection endpoint
router.post("/ping", async (req, res) => {
  const {
    deviceId,
    userCoords,
    deliveryCoords,
    timestamp,
    amount = 0,        // Refund amount in ₹ (from Catalyst)
    orderId = ""       // Order ID (from Catalyst)
  } = req.body;

  if (!deviceId) {
    return res.status(400).json({ ok: false, error: "deviceId is required" });
  }

  if (!userCoords || !timestamp) {
    return res.status(400).json({ ok: false, error: "userCoords and timestamp are required" });
  }

  console.log("Incoming Ping:", req.body);

  let fraudTypes = [];
  let riskScore = 0;   // 0–100 additive scale
  let speed = null;

  // Fraud signal weights (synced with frontend riskScoreEngine.ts)
  const FRAUD_WEIGHTS = {
    GeoMismatch: 60,
    ImpossibleJump: 80,
  };

  const lastPing = await getLastPing(deviceId);
  console.log("Last ping from Redis:", lastPing);

  // Distance fraud check
  // Use provided deliveryCoords, or auto-lookup from last saved delivery point
  let effectiveDeliveryCoords = deliveryCoords;
  if (!effectiveDeliveryCoords) {
    const lastDelivery = await LocationLog.findOne({
      deviceId,
      fraudFlag: "DeliveryPoint"
    }).sort({ _id: -1 });

    if (lastDelivery) {
      effectiveDeliveryCoords = { lat: lastDelivery.lat, lon: lastDelivery.lon };
      console.log(`Auto-loaded delivery point for ${deviceId}: ${lastDelivery.lat}, ${lastDelivery.lon}`);
    }
  }

  if (effectiveDeliveryCoords) {
    const distanceCheck = isFar(effectiveDeliveryCoords, userCoords);
    if (distanceCheck.flag) {
      fraudTypes.push("GeoMismatch");
      riskScore += FRAUD_WEIGHTS.GeoMismatch;
      console.log(`GeoMismatch detected: ${distanceCheck.distance} km from delivery point`);
    }
  }

  // Speed fraud check
  if (lastPing && lastPing.lat && lastPing.lon && lastPing.timestamp) {
    const jumpCheck = isImpossibleJump(
      { lat: lastPing.lat, lon: lastPing.lon },
      lastPing.timestamp,
      userCoords,
      timestamp
    );

    speed = jumpCheck.speed;

    if (jumpCheck.flag) {
      fraudTypes.push("ImpossibleJump");
      riskScore += FRAUD_WEIGHTS.ImpossibleJump;
    }

    console.log(`Speed check: ${speed} km/h`);
  } else {
    console.log("No previous ping - skipping speed check");
  }

  // Clamp to 0–100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Save to Redis
  await saveLastPing(deviceId, {
    lat: userCoords.lat,
    lon: userCoords.lon,
    timestamp: timestamp
  });

  // Save to MongoDB
  await LocationLog.create({
    deviceId,
    lat: userCoords.lat,
    lon: userCoords.lon,
    timestamp,
    fraudFlag: fraudTypes.length > 0 ? fraudTypes.join(", ") : null,
    riskScore,
    amount,      // Store refund amount
    orderId      // Store order ID
  });

  // Update active-device tracking for stale detection
  const activeDevices = req.app.get('activeDevices');
  if (activeDevices) {
    activeDevices.set(deviceId, {
      lat: userCoords.lat,
      lon: userCoords.lon,
      riskScore,
      fraudTypes: fraudTypes.length > 0 ? fraudTypes : null,
      speed,
      lastPing: Date.now(),
      amount,      // Store for stale device record
      orderId      // Store for stale device record
    });
  }

  console.log("Fraud Types:", fraudTypes);
  console.log("Risk Score:", riskScore);

  // Socket.IO emits
  const io = req.app.get('io');

  io.emit('location_update', {
    deviceId,
    lat: userCoords.lat,
    lon: userCoords.lon,
    fraudTypes: fraudTypes.length > 0 ? fraudTypes : null,
    riskScore,
    speed,
    timestamp
  });

  if (fraudTypes.length > 0) {
    io.emit('fraud_alert', {
      deviceId,
      fraudTypes,
      riskScore,
      speed,
      lat: userCoords.lat,
      lon: userCoords.lon,
      timestamp,
      amount,      // Refund amount - so dashboard knows ₹ value
      orderId      // Order ID - for tracking
    });
  }

  res.json({
    ok: true,
    fraudTypes: fraudTypes.length > 0 ? fraudTypes : null,
    riskScore,
    speed,
    deviceId
  });
});

// GET /api/location/logs
router.get("/logs", async (req, res) => {
  const logs = await LocationLog.find().sort({ timestamp: -1 }).limit(100);
  res.json(logs);
});

// GET /api/location/stats - Dashboard stats (initial load)
router.get("/stats", async (req, res) => {
  const StaleDevice = require('../models/staleDevice');

  // Get all location logs
  const logs = await LocationLog.find();

  // Get all stale devices (fraud attempts)
  const staleDevices = await StaleDevice.find();

  // Total Transactions = all pings received
  const totalTransactions = logs.length;

  // Flagged Transactions = logs with fraud detected
  const flaggedTransactions = logs.filter(l => l.fraudFlag).length;

  // Blocked Amount = sum of amounts from blocked devices
  const blockedDevices = staleDevices.filter(d => d.status === 'blocked');
  const blockedAmount = blockedDevices.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Average Risk Score = average of all fraudulent pings
  const fraudLogs = logs.filter(l => l.riskScore > 0);
  const avgRiskScore = fraudLogs.length > 0
    ? fraudLogs.reduce((sum, l) => sum + l.riskScore, 0) / fraudLogs.length
    : 0;

  // Active Alerts = devices awaiting review (status = "Pending")
  const activeAlerts = staleDevices.filter(d => d.status === 'Pending').length;

  res.json({
    totalTransactions,
    flaggedTransactions,
    blockedAmount,
    avgRiskScore,
    activeAlerts
  });
});

// POST /api/location/set-delivery
router.post("/set-delivery", async (req, res) => {
  const { deviceId, Lat, Lon, city } = req.body;

  const saveData = await LocationLog.create({
    deviceId,
    lat: Lat,
    lon: Lon,
    gpsCity: city,
    fraudFlag: "DeliveryPoint",
    timestamp: Date.now()
  });

  console.log("Delivery point saved:", saveData);
  res.json({ ok: true, storedID: saveData._id });
});

// POST /api/location/check-fraud
router.post("/check-fraud", async (req, res) => {
  try {
    const { deviceId, lat, lon, ipCity } = req.body;

    if (!deviceId || !lat || !lon || !ipCity) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const gpsCity = cityMapper(lat, lon);
    const regionFraud = ipCity !== gpsCity;

    const delivery = await LocationLog.findOne({
      deviceId: deviceId,
      fraudFlag: "DeliveryPoint"
    }).sort({ _id: -1 });

    let geoFraud = false;
    let distance = null;

    if (delivery) {
      distance = haversineDistance(
        { lat, lon },
        { lat: delivery.lat, lon: delivery.lon }
      );

      geoFraud = distance > 0.5;
    }

    console.log("Mapped GPS city:", gpsCity);
    console.log("Region mismatch:", regionFraud);
    console.log("Delivery distance:", distance, "km");
    console.log("Geo fraud:", geoFraud);

    res.json({
      ok: true,
      gpsCity,
      regionFraud,
      geoFraud,
      distance
    });

  } catch (err) {
    console.log("Error in fraud check:", err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
});

// GET /api/location/delivery/:deviceId
router.get("/delivery/:deviceId", async (req, res) => {
  const log = await LocationLog.findOne({
    deviceId: req.params.deviceId,
    fraudFlag: "DeliveryPoint"
  });
  res.json(log);
});

// GET /api/location/stale-devices
router.get("/stale-devices", async (req, res) => {
  try {
    const StaleDevice = require('../models/staleDevice');
    const staleDevices = await StaleDevice.find().sort({ detectedAt: -1 }).limit(100);
    res.json(staleDevices);
  } catch (err) {
    console.error('Error fetching stale devices:', err);
    res.json([]);
  }
});

// GET /api/location/chart-data — daily aggregated data for dashboard chart
router.get("/chart-data", async (req, res) => {
  try {
    const StaleDevice = require('../models/staleDevice');
    const period = req.query.period || 'Month'; // '24h', 'Week', 'Month'

    // Determine cutoff date
    const now = new Date();
    let cutoff = new Date();
    if (period === '24h') {
      cutoff.setHours(cutoff.getHours() - 24);
    } else if (period === 'Week') {
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff.setDate(cutoff.getDate() - 30);
    }

    const devices = await StaleDevice.find({
      detectedAt: { $gte: cutoff.getTime() }
    }).sort({ detectedAt: 1 });

    // Group by day
    const dailyMap = {};
    devices.forEach(d => {
      const day = new Date(d.detectedAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short'
      });
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, blocked: 0, flagged: 0 };
      }
      if (d.status === 'blocked') {
        dailyMap[day].blocked += (d.amount || 0);
      }
      if (d.riskScore > 0) {
        dailyMap[day].flagged += 1;
      }
    });

    // Fill missing days so chart looks continuous
    const result = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = period === '24h' ? 1 : period === 'Week' ? 7 : 30;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      result.push(dailyMap[label] || { date: label, blocked: 0, flagged: 0 });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    res.json([]);
  }
});

module.exports = router;