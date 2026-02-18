const cors = require('cors');
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// I usually keep server/io setup close together so I don’t forget how they’re wired
const server = http.createServer(app);
const io = new socketIO.Server(server, {
    cors: {
        origin: '*', // wide open for now — revisit before prod
        methods: ['GET', 'POST']
    }
});

// ----- middleware stuff -----
app.use(cors()); // probably redundant with socket cors, but leaving it
app.use(express.json());

// serving static files (dashboard assets mostly)
app.use(express.static(path.join(__dirname, 'public')));

// view engine (EJS felt quick for this prototype)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// hacky but useful: make io accessible inside routes
app.set('io', io);

// ----- stale-device tracking -----
// Shared maps so routes can update activeDevices on each ping
const activeDevices = new Map();   // deviceId → { lat, lon, riskScore, fraudTypes, speed, lastPing }
const StaleDevice = require('./models/staleDevice');

app.set('activeDevices', activeDevices);

const STALE_TIMEOUT_MS = 30_000;   // 30 seconds without a ping → stale
const STALE_CHECK_INTERVAL = 15_000; // check every 15 seconds

setInterval(async () => {
    const now = Date.now();
    for (const [deviceId, info] of activeDevices.entries()) {
        if (now - info.lastPing > STALE_TIMEOUT_MS) {
            const staleEntry = {
                deviceId,
                lat: info.lat,
                lon: info.lon,
                riskScore: info.riskScore || 0,
                fraudTypes: info.fraudTypes || [],
                speed: info.speed ?? null,
                lastSeen: info.lastPing,
                detectedAt: now,
                amount: info.amount || 0,           // Refund amount
                orderId: info.orderId || "",        // Order ID
            };

            // Persist to MongoDB
            try {
                await StaleDevice.create(staleEntry);
            } catch (err) {
                console.error('Failed to save stale device:', err);
            }

            activeDevices.delete(deviceId);

            io.emit('device_stale', staleEntry);
            console.log(`⏰ Device went stale: ${deviceId} (last ping ${Math.round((now - info.lastPing) / 1000)}s ago)`);
        }
    }
}, STALE_CHECK_INTERVAL);

// ----- database connection -----
const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/starksLocProto'; // local fallback

mongoose
    .connect(mongoUri)
    .then(() => {
        console.log('✅ MongoDB connected');
    })
    .catch((err) => {
        console.error('❌ MongoDB Error:', err);
    });

// ----- socket.io handlers -----
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // devices join their own rooms so we can target events later
    socket.on('join-device', (deviceId) => {
        if (!deviceId) return; // defensive, just in case
        socket.join(`device:${deviceId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// ----- routes -----
app.use('/api/location', require('./routes/location'));
app.use('/api', require('./routes/refundDecision'));

app.use('/', require('./routes/dashboard')); // default landing

// ----- error handler (last on purpose) -----
app.use((err, req, res, next) => {
    console.error(err.stack); // noisy, but helpful during dev

    res.status(500).json({
        ok: false,
        error:
            process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : err.message
    });
});

// ----- start server -----
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
    console.log(`🚀 FraudX Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);

});

// ----- graceful shutdown -----
// copied + tweaked from another project, but it works
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    io.close(() => {
        console.log('🔌 Socket.IO closed');
    });

    try {
        await mongoose.connection.close();
        console.log('📦 MongoDB connection closed');
    } catch (e) {
        console.error('Mongo shutdown error:', e);
    }

    server.close(() => {
        console.log('🚀 Server closed');
        process.exit(0);
    });
});

// handle container / hosting providers
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    process.emit('SIGINT'); // reuse logic instead of duplicating
});

// TODO: eventually split this file up — it’s getting chunky
