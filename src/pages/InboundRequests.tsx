import { useState, useEffect, useRef } from "react";
import { Search, Inbox, Clock, AlertTriangle, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { ReviewModal } from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface InboundEntry {
  id: string;
  deviceId: string;
  lat: number;
  lon: number;
  riskScore: number;
  fraudTypes: string[];
  speed: number | null;
  lastSeen: number;
  detectedAt: number;
  status: "Pending";
  _isStale: true;
}

/** Convert a device event into an inbound request entry */
function toInboundEntry(data: any, index: number): InboundEntry {
  return {
    id: `REQ-${String(index + 1).padStart(3, "0")}`,
    deviceId: data.deviceId,
    lat: data.lat,
    lon: data.lon,
    riskScore: Math.min(100, Math.max(0, data.riskScore || 0)),
    fraudTypes: data.fraudTypes && data.fraudTypes.length > 0 ? data.fraudTypes : [],
    speed: data.speed ?? null,
    lastSeen: data.lastSeen,
    detectedAt: data.detectedAt,
    status: "Pending",
    _isStale: true,
  };
}

const InboundRequests = () => {
  const [reviewRequest, setReviewRequest] = useState<InboundEntry | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<InboundEntry[]>([]);
  const countRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Load existing entries from MongoDB
    fetch("/api/location/stale-devices")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const entries = data.map((s, i) => toInboundEntry(s, i));
          countRef.current = data.length;
          setRequests(entries);

          // Load existing statuses from database
          const statuses: Record<string, string> = {};
          data.forEach((s, i) => {
            if (s.status && s.status !== "Pending") {
              statuses[`REQ-${String(i + 1).padStart(3, "0")}`] = s.status;
            }
          });
          setActionStatuses(statuses);
        }
      })
      .catch((err) => console.error("Failed to load inbound requests:", err));

    // Socket.IO for real-time entries (no restart needed)
    const BACKEND_URL = "http://localhost:3002";
    const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("device_stale", (data: any) => {
      countRef.current += 1;
      const entry = toInboundEntry(data, countRef.current);
      setRequests((prev) => [entry, ...prev]);
    });

    // Listen for refund decisions to update status
    socket.on("refund_decision", (data: any) => {
      console.log("📥 Refund decision received:", data);
      // Find the request and update its status
      setRequests((prev) =>
        prev.map((req) => {
          if (req.deviceId === data.deviceId) {
            return { ...req, status: data.action };
          }
          return req;
        })
      );
      // Also update actionStatuses
      setActionStatuses((prev) => {
        // Find the id for this deviceId
        const req = requests.find((r) => r.deviceId === data.deviceId);
        if (req) {
          return { ...prev, [req.id]: data.action };
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sorted = [...requests].sort((a, b) => b.riskScore - a.riskScore);
  const pending = requests.filter((r) => !actionStatuses[r.id]).length;
  const reviewed = requests.filter((r) => !!actionStatuses[r.id]).length;

  const handleAction = async (id: string, action: string, deviceId: string) => {
    setActionStatuses((prev) => ({ ...prev, [id]: action }));

    // Broadcast decision to Catalyst site via backend
    try {
      const response = await fetch("http://localhost:3002/api/refund-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          requestId: id,
          action,
        }),
      });

      const result = await response.json();
      if (result.ok) {
        console.log(`✅ Refund decision sent:`, result.data);
      } else {
        console.error("❌ Failed to send refund decision:", result.error);
      }
    } catch (err) {
      console.error("❌ Error sending refund decision:", err);
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={item}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Inbound Requests</h1>
          <p className="text-xs text-muted-foreground mt-1">Users who completed their session on FraudX</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          <div className="glass-card glass-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Requests</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{requests.length}</p>
          </div>
          <div className="glass-card glass-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{pending}</p>
          </div>
          <div className="glass-card glass-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-success/10">
                <AlertTriangle className="h-4 w-4 text-success" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Reviewed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{reviewed}</p>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={item}>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Request Completion Queue</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{requests.length} requests total</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">ID</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Device ID</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Last Location</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Fraud Signals</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Speed</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Risk</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Last Seen</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <div className="text-3xl mb-3 opacity-50">📡</div>
                        <p className="text-sm text-muted-foreground">No inbound requests yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Requests will appear here when users complete their sessions</p>
                      </td>
                    </tr>
                  ) : (
                    sorted.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-border/10 hover:bg-accent/30 transition-colors group cursor-pointer"
                        onClick={() => setReviewRequest(req)}
                      >
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-primary">{req.id}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs text-foreground font-semibold">{req.deviceId}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {req.lat.toFixed(4)}, {req.lon.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {req.fraudTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {req.fraudTypes.map((f) => (
                                <span
                                  key={f}
                                  className="inline-block px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 rounded text-[10px] text-destructive font-medium"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {req.speed != null ? `${req.speed.toFixed(1)} km/h` : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <RiskBadge score={req.riskScore} />
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.lastSeen).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {actionStatuses[req.id] ? (
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-1 rounded-md uppercase",
                              actionStatuses[req.id] === "approved"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            )}>
                              {actionStatuses[req.id]}
                            </span>
                          ) : (
                            <StatusBadge status={req.status} />
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); setReviewRequest(req); }}
                            className="gap-1.5 text-[11px] h-7 rounded-lg border-border/40 hover:border-primary/30 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Search className="h-3 w-3" />
                            Analyze
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {reviewRequest && (
          <ReviewModal
            request={reviewRequest as any}
            onClose={() => setReviewRequest(null)}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default InboundRequests;
