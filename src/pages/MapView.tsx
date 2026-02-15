import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Radio, ShieldAlert, Wifi, WifiOff, Zap, X, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { io, Socket } from "socket.io-client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { calculateRiskScore } from "@/lib/riskScoreEngine";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DeviceData {
  deviceId: string;
  lat: number;
  lon: number;
  speed: number | null;
  hasFraud: boolean;
  fraudTypes: string[] | null;
  riskScore: number;
  lastUpdate: number;
}

interface FraudAlert {
  id: string;
  deviceId: string;
  fraudTypes: string[];
  speed: number | null;
  lat: number;
  lon: number;
  riskScore: number;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Marker Icons                                                       */
/* ------------------------------------------------------------------ */

const createIcon = (isFraud: boolean) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: 20px; height: 20px;
      ">
        <div style="
          width: 20px; height: 20px;
          background: ${isFraud ? "#ef4444" : "#10b981"};
          border: 3px solid rgba(255,255,255,0.9);
          border-radius: 50%;
          box-shadow: 0 2px 8px ${isFraud ? "rgba(239,68,68,0.5)" : "rgba(16,185,129,0.4)"};
        "></div>
        <div style="
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 2px solid ${isFraud ? "rgba(239,68,68,0.35)" : "rgba(16,185,129,0.25)"};
          animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const safeIcon = createIcon(false);
const fraudIcon = createIcon(true);

/* ------------------------------------------------------------------ */
/*  Helper: fly-to on device click                                     */
/* ------------------------------------------------------------------ */

function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 15, { duration: 1 });
  }, [lat, lon, map]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const MapView = () => {
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<Record<string, DeviceData>>({});
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [totalPings, setTotalPings] = useState(0);
  const [fraudCount, setFraudCount] = useState(0);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  /* ---- Socket.IO ---- */
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("location_update", (data: any) => {
      setTotalPings((p) => p + 1);

      setDevices((prev) => ({
        ...prev,
        [data.deviceId]: {
          deviceId: data.deviceId,
          lat: data.lat,
          lon: data.lon,
          speed: data.speed ?? null,
          hasFraud:
            prev[data.deviceId]?.hasFraud || (data.fraudTypes ? true : false),
          fraudTypes: data.fraudTypes ?? prev[data.deviceId]?.fraudTypes ?? null,
          riskScore: data.fraudTypes
            ? calculateRiskScore(data.fraudTypes)
            : (prev[data.deviceId]?.riskScore ?? 0),
          lastUpdate: Date.now(),
        },
      }));
    });

    socket.on("fraud_alert", (data: any) => {
      setFraudCount((c) => c + 1);

      const alert: FraudAlert = {
        id: `${data.deviceId}-${Date.now()}`,
        deviceId: data.deviceId,
        fraudTypes: data.fraudTypes,
        speed: data.speed,
        lat: data.lat,
        lon: data.lon,
        riskScore: calculateRiskScore(data.fraudTypes),
        timestamp: Date.now(),
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 8));

      // Mark device as fraud
      setDevices((prev) => {
        if (!prev[data.deviceId]) return prev;
        return {
          ...prev,
          [data.deviceId]: {
            ...prev[data.deviceId],
            hasFraud: true,
            fraudTypes: data.fraudTypes,
            riskScore: calculateRiskScore(data.fraudTypes),
          },
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /* ---- Auto-dismiss alerts after 10s ---- */
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => {
      setAlerts((prev) => prev.slice(0, -1));
    }, 10000);
    return () => clearTimeout(timer);
  }, [alerts]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* ---- Derived stats ---- */
  const deviceList = Object.values(devices);
  const activeDevices = deviceList.length;
  const safeDevices = deviceList.filter((d) => !d.hasFraud).length;

  /* ---- Stats config for the top bar ---- */
  const stats = [
    { label: "Active Devices", value: activeDevices, icon: Radio, color: "text-primary" },
    { label: "Fraud Alerts", value: fraudCount, icon: ShieldAlert, color: "text-destructive" },
    { label: "Total Pings", value: totalPings, icon: Zap, color: "text-warning" },
    { label: "Avg Risk", value: deviceList.length > 0 ? Math.round(deviceList.reduce((s, d) => s + d.riskScore, 0) / deviceList.length) : 0, icon: Gauge, color: "text-orange-500", suffix: "%" },
    { label: "Safe Devices", value: safeDevices, icon: MapPin, color: "text-success" },
  ];

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {/* Header + Connection */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Live Location Map
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time device tracking with fraud detection
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
              connected
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {connected ? "Connected to FraudX Server" : "Disconnected"}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-card rounded-xl p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-secondary/40">
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {s.value}{(s as any).suffix || ""}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Map + Device Sidebar */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
        >
          {/* Leaflet Map */}
          <div className="lg:col-span-9 glass-card rounded-2xl overflow-hidden relative" style={{ minHeight: 460 }}>
            <MapContainer
              center={[18.5204, 73.8567]}
              zoom={12}
              scrollWheelZoom={true}
              className="h-full w-full"
              style={{ height: "100%", minHeight: 460, background: "#0d1117" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {flyTarget && (
                <FlyTo lat={flyTarget.lat} lon={flyTarget.lon} />
              )}

              {deviceList.map((d) => (
                <Marker
                  key={d.deviceId}
                  position={[d.lat, d.lon]}
                  icon={d.hasFraud ? fraudIcon : safeIcon}
                >
                  <Popup>
                    <div className="text-sm space-y-1 min-w-[160px]">
                      <p className="font-bold text-base">{d.deviceId}</p>
                      <p>
                        <span className="text-gray-500">Lat:</span>{" "}
                        {d.lat.toFixed(6)}
                      </p>
                      <p>
                        <span className="text-gray-500">Lon:</span>{" "}
                        {d.lon.toFixed(6)}
                      </p>
                      <p>
                        <span className="text-gray-500">Speed:</span>{" "}
                        {d.speed !== null ? `${d.speed.toFixed(1)} km/h` : "N/A"}
                      </p>
                      <p>
                        <span className="text-gray-500">Status:</span>{" "}
                        {d.hasFraud ? "🚨 Fraud" : "✅ Safe"}
                      </p>
                      {d.hasFraud && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-gray-500">Risk:</span>
                          <RiskBadge score={d.riskScore} size="sm" />
                        </div>
                      )}
                      {d.fraudTypes && (
                        <p className="text-red-600 font-medium">
                          ⚠ {d.fraudTypes.join(", ")}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Fraud Alert Toast */}
            <div className="absolute top-3 right-3 z-[1000] space-y-2 pointer-events-none">
              <AnimatePresence>
                {alerts.slice(0, 3).map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="pointer-events-auto bg-destructive/95 backdrop-blur-sm text-white rounded-xl p-4 max-w-[300px] shadow-2xl border border-red-400/20"
                  >
                    <button
                      onClick={() => dismissAlert(a.id)}
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-sm font-bold mb-1.5">🚨 Fraud Detected!</p>
                    <div className="text-xs space-y-0.5 opacity-90">
                      <p>
                        <strong>Device:</strong> {a.deviceId}
                      </p>
                      <p>
                        <strong>Type:</strong> {a.fraudTypes.join(", ")}
                      </p>
                      <p>
                        <strong>Risk:</strong> {a.riskScore}%
                      </p>
                      <p>
                        <strong>Speed:</strong>{" "}
                        {a.speed !== null
                          ? `${a.speed.toFixed(1)} km/h`
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Loc:</strong> {a.lat.toFixed(4)},{" "}
                        {a.lon.toFixed(4)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 right-3 z-[999] glass-card rounded-lg px-3 py-2.5 text-xs space-y-1.5">
              <p className="font-semibold text-foreground text-[11px]">Device Status</p>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Fraud</span>
              </div>
            </div>

            {/* No devices fallback */}
            {activeDevices === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-[800]">
                <div className="text-center space-y-3">
                  <div className="p-4 rounded-2xl bg-secondary/60 border border-border/30 mx-auto w-fit">
                    <Radio className="h-7 w-7 text-muted-foreground animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {connected
                        ? "Waiting for device pings…"
                        : "Connecting to FraudX server…"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {connected
                        ? "Start the simulator to see live markers"
                        : "Ensure the backend is running on port 3000"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Device Sidebar */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-4 flex flex-col" style={{ maxHeight: 460 }}>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-primary" />
              Tracked Devices
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                {activeDevices}
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {deviceList.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No devices yet
                </p>
              )}
              {deviceList.map((d) => (
                <button
                  key={d.deviceId}
                  onClick={() => setFlyTarget({ lat: d.lat, lon: d.lon })}
                  className={cn(
                    "w-full text-left rounded-xl p-3 border transition-all hover:translate-x-0.5",
                    d.hasFraud
                      ? "bg-destructive/10 border-destructive/30 hover:border-destructive/50"
                      : "bg-secondary/30 border-border/30 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {d.deviceId}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        d.hasFraud
                          ? "bg-destructive/20 text-destructive"
                          : "bg-success/20 text-success"
                      )}
                    >
                      {d.hasFraud ? "FRAUD" : "SAFE"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>
                      📍 {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
                    </p>
                    <p>
                      🚗{" "}
                      {d.speed !== null
                        ? `${d.speed.toFixed(1)} km/h`
                        : "No speed data"}
                    </p>
                    {d.fraudTypes && (
                      <p className="text-destructive font-medium">
                        ⚠ {d.fraudTypes.join(", ")}
                      </p>
                    )}
                    {d.hasFraud && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-muted-foreground">Risk:</span>
                        <RiskBadge score={d.riskScore} size="sm" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MapView;
