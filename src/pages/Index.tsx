import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ShieldOff,
  TrendingDown,
  Bell,
  ArrowUpRight,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ExternalLink,
  Copy,
  Check,
  Ban,
  CheckCircle,
  MoreHorizontal,
  Flag,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowChart } from "@/components/GlowChart";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSearchQuery } from "@/components/DashboardLayout";
import { formatINR } from "@/lib/formatINR";
import { inboundRequests } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { io } from "socket.io-client";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const CHART_LINES = [
  { dataKey: "blocked", color: "#3B82F6", label: "Blocked (₹)" },
  { dataKey: "flagged", color: "#22C55E", label: "Flagged" },
];

import { ReviewModal } from "@/components/ReviewModal";

/* ------------------------------------------------------------------ */
/*  "How it works?" Info Dialog                                        */
/* ------------------------------------------------------------------ */

function HowItWorksDialog({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative glass-card rounded-2xl border border-border/60 shadow-2xl w-[420px] z-10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h3 className="text-sm font-semibold text-foreground">How Blocking Works</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {[
            { step: "1", title: "Signal Detection", desc: "Our ML models analyze 50+ fraud signals in real-time including geo-mismatch, device fingerprinting, and velocity checks." },
            { step: "2", title: "Risk Scoring", desc: "Each transaction receives a 0-100 risk score via our additive scoring engine. Signals like ImpossibleJump (+40) and GeoMismatch (+30) contribute points." },
            { step: "3", title: "Auto-Block", desc: "Transactions scoring above 75 are automatically blocked. Medium-risk ones (40-74) are queued for manual review." },
            { step: "4", title: "Settlement", desc: "Blocked amounts are held and settled after the review window closes (typically 72 hours)." },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {s.step}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-border/30">
          <button onClick={onClose} className="w-full h-8 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Info Popover (for chart ⓘ button)                                 */
/* ------------------------------------------------------------------ */

function InfoPopover({
  open,
  onToggle,
  anchorRef,
}: {
  open: boolean;
  onToggle: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={popRef}
      className="absolute right-0 top-10 w-[240px] glass-card rounded-xl border border-border/60 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <p className="text-[11px] text-foreground font-semibold mb-1">Overview Chart</p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Displays blocked amounts (₹) and flagged transaction counts over time.
        The glow intensity correlates with data volume. Toggle between 24h, Week, and Month views using the period tabs.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User Action Menu                                                   */
/* ------------------------------------------------------------------ */

function UserActionMenu({
  userId,
  open,
  onToggle,
  parentRef,
}: {
  userId: string;
  open: boolean;
  onToggle: () => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && parentRef.current && !parentRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle, parentRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-6 w-[140px] glass-card rounded-lg border border-border/60 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {[
        { icon: Eye, label: "View Profile", color: "" },
        { icon: Flag, label: "Flag User", color: "text-warning" },
        { icon: UserX, label: "Block User", color: "text-destructive" },
      ].map((action) => (
        <button
          key={action.label}
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 text-[11px] hover:bg-accent/60 transition-colors",
            action.color || "text-foreground"
          )}
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Page                                                */
/* ------------------------------------------------------------------ */

const Index = () => {
  const navigate = useNavigate();
  const searchQuery = useSearchQuery();

  // Real-time dashboard stats (replaces static dashboardStats)
  const [stats, setStats] = useState({
    totalTransactions: 0,
    flaggedTransactions: 0,
    blockedAmount: 0,
    avgRiskScore: 0,
    activeAlerts: 0,
  });

  const [chartPeriod, setChartPeriod] = useState<"24h" | "Week" | "Month">("Month");
  const [campaignPage, setCampaignPage] = useState(1);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<(typeof inboundRequests)[0] | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({});
  const [openUserMenu, setOpenUserMenu] = useState<string | null>(null);

  // Recent activity feed (populated by Socket.IO events)
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    type: 'fraud' | 'blocked' | 'approved' | 'stale';
    message: string;
    time: string;
    amount?: number;
  }>>([]);

  const infoButtonRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  const userMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* read CSS vars for inline styles that need to adapt to theme */
  const [surface, setSurface] = useState("#16171B");
  const [surfaceAlt, setSurfaceAlt] = useState("#1a1c24");
  useEffect(() => {
    const update = () => {
      const s = getComputedStyle(document.documentElement);
      setSurface(s.getPropertyValue("--card-surface").trim() || "#16171B");
      setSurfaceAlt(s.getPropertyValue("--card-surface-alt").trim() || "#1a1c24");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  /* Load initial stats from backend on mount */
  useEffect(() => {
    fetch('http://localhost:3002/api/location/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data);
        console.log('📊 Initial stats loaded:', data);
      })
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  /* Socket.IO: Real-time updates */
  useEffect(() => {
    const socket = io('http://localhost:3002');

    // When fraud is detected → increment counts + update chart
    socket.on('fraud_alert', (data) => {
      console.log('🚨 Fraud detected:', data);
      setStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        flaggedTransactions: prev.flaggedTransactions + 1,
        activeAlerts: prev.activeAlerts + 1,
      }));
      // Add to activity feed
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'fraud',
        message: `Fraud detected on ${data.deviceId || 'unknown device'} — ${(data.fraudTypes || []).join(', ') || 'suspicious activity'}`,
        time: 'Just now',
      }, ...prev].slice(0, 20));
      // Update today's flagged count in chart
      setFilteredChartData(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const today = updated[updated.length - 1];
        updated[updated.length - 1] = { ...today, flagged: (today.flagged || 0) + 1 };
        return updated;
      });
    });

    // When admin blocks/approves → update blocked amount, alerts + chart
    socket.on('refund_decision', (data) => {
      console.log('⚖️ Refund decision:', data);
      if (data.action === 'blocked') {
        setStats(prev => ({
          ...prev,
          blockedAmount: prev.blockedAmount + (data.amount || 0),
          activeAlerts: Math.max(0, prev.activeAlerts - 1),
        }));
        // Add to activity feed
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'blocked' as const,
          message: `Blocked ${data.deviceId || 'device'} — ₹${(data.amount || 0).toLocaleString('en-IN')} saved`,
          time: 'Just now',
          amount: Number(data.amount || 0),
        }, ...prev].slice(0, 20));
        // Update today's blocked amount in chart
        setFilteredChartData(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const today = updated[updated.length - 1];
          updated[updated.length - 1] = { ...today, blocked: (today.blocked || 0) + (data.amount || 0) };
          return updated;
        });
      } else if (data.action === 'approved') {
        setStats(prev => ({
          ...prev,
          activeAlerts: Math.max(0, prev.activeAlerts - 1),
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /* Close currency dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (currRef.current && !currRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Currency conversion (mock 1 USD = 83 INR) */
  const INR_TO_USD = 83;
  const displayAmount = (inrAmount: number) => {
    if (currency === "USD") return `$${(inrAmount / INR_TO_USD).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return formatINR(inrAmount);
  };

  /* Chart data — fetch from backend, keyed by period tab */
  const [filteredChartData, setFilteredChartData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3002/api/location/chart-data?period=${chartPeriod}`)
      .then(r => r.json())
      .then(data => {
        setFilteredChartData(data);
        console.log('📈 Chart data loaded:', data.length, 'points');
      })
      .catch(err => console.error('Failed to load chart data:', err));
  }, [chartPeriod]);

  /* Filter table by search */
  const filteredRequests = inboundRequests.filter((req) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.id.toLowerCase().includes(q) ||
      req.orderId.toLowerCase().includes(q) ||
      req.customerName.toLowerCase().includes(q) ||
      req.refundReason.toLowerCase().includes(q) ||
      new URL(req.sourceWebsiteUrl).hostname.toLowerCase().includes(q)
    );
  });

  /* Top flagged users - will be implemented later */
  const totalUserPages = 1;
  const pagedUsers: any[] = [];

  /* Handle review action */
  const handleAction = (id: string, action: string) => {
    setActionStatuses((prev) => ({ ...prev, [id]: action }));
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard
            title="Transactions"
            value={stats.totalTransactions.toLocaleString("en-IN")}
            icon={Activity}
            trend="+12.3% vs last week"
            trendUp
            iconColor="bg-primary/10"
            sparklineData={[]}
            sparklineColor="#3B82F6"
          />
          <StatCard
            title="Flagged"
            value={stats.flaggedTransactions}
            icon={AlertTriangle}
            trend="+5.1% vs last week"
            trendUp={false}
            iconColor="bg-destructive/10"
            sparklineData={[]}
            sparklineColor="#EF4444"
          />
          <StatCard
            title="Blocked"
            value={displayAmount(stats.blockedAmount)}
            icon={ShieldOff}
            iconColor="bg-warning/10"
            sparklineData={[]}
            sparklineColor="#F59E0B"
          />
          <StatCard
            title="Avg Risk"
            value={`${stats.avgRiskScore.toFixed(1)}%`}
            icon={TrendingDown}
            iconColor="bg-amber-500/10"
            sparklineData={[]}
            sparklineColor="#F59E0B"
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={Bell}
            iconColor="bg-amber-500/10"
            sparklineData={[]}
            sparklineColor="#F59E0B"
          />
        </motion.div>

        {/* Main Bento Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* Overview Chart Card */}
          <motion.div variants={item} className="lg:col-span-7">
            <div
              className="rounded-2xl p-5 h-full border"
              style={{
                background: surface,
                borderColor: "rgba(128,128,128,0.1)",
                borderRadius: 16,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight" style={{ lineHeight: "1.65" }}>Overview</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-muted-foreground" style={{ lineHeight: "1.65" }}>Max blocked</span>
                    <span className="text-[11px] font-medium text-foreground flex items-center gap-1" style={{ lineHeight: "1.65" }}>
                      2x vs last month
                    </span>
                  </div>
                </div>
                <div ref={infoButtonRef} className="relative">
                  <button
                    onClick={() => setInfoOpen(!infoOpen)}
                    className={cn(
                      "p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
                      infoOpen && "bg-accent text-foreground"
                    )}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <InfoPopover open={infoOpen} onToggle={() => setInfoOpen(false)} anchorRef={infoButtonRef} />
                </div>
              </div>

              {/* Period Tabs */}
              <div className="flex items-center gap-0.5 bg-secondary/60 rounded-lg p-0.5 w-fit mb-5">
                {(["24h", "Week", "Month"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      chartPeriod === period
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Glow Chart */}
              <GlowChart
                data={filteredChartData}
                lines={CHART_LINES}
                xKey="date"
                yFormatter={(v) => displayAmount(v)}
                height={280}
              />

              {/* Bottom Stats */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-success">+19.23%</span>
                  <ArrowUpRight className="h-4 w-4 text-success" />
                </div>
                <span className="text-[11px] text-muted-foreground" style={{ lineHeight: "1.65" }}>Last updated: Today, 06:49 AM</span>
              </div>
            </div>
          </motion.div>

          {/* Total Blocked Card — premium glow variant */}
          <motion.div variants={item} className="lg:col-span-5">
            <div
              className="relative rounded-2xl p-6 h-full flex flex-col overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${surface} 0%, ${surfaceAlt} 50%, ${surface} 100%)`,
                borderRadius: 16,
                border: "1px solid rgba(59,130,246,0.15)",
                boxShadow: "0 0 40px -12px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              {/* Ambient glow orb */}
              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: "rgba(59,130,246,0.1)" }}
                    >
                      <ShieldOff className="h-4 w-4 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground tracking-tight" style={{ lineHeight: "1.65" }}>Total Blocked</h3>
                  </div>
                  {/* Currency toggle */}
                  <div ref={currRef} className="relative">
                    <button
                      onClick={() => setCurrencyOpen(!currencyOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      {currency === "INR" ? "INR ₹" : "USD $"}
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {currencyOpen && (
                      <div className="absolute right-0 top-8 w-[100px] glass-card rounded-lg border border-border/60 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        {(["INR", "USD"] as const).map((c) => (
                          <button
                            key={c}
                            onClick={() => { setCurrency(c); setCurrencyOpen(false); }}
                            className={cn(
                              "w-full px-3 py-2 text-[11px] text-left hover:bg-accent/60 transition-colors",
                              currency === c ? "text-primary font-semibold" : "text-foreground"
                            )}
                          >
                            {c === "INR" ? "INR ₹" : "USD $"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4" style={{ lineHeight: "1.65" }}>Sum of all blocked fraudulent amounts</p>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-6">
                    <div>
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {displayAmount(stats.blockedAmount)}
                      </span>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-xs text-muted-foreground" style={{ lineHeight: "1.65" }}>
                          Updates in real-time when you block fraud
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 text-[11px] text-muted-foreground pt-3 border-t border-border/40"
                    style={{ lineHeight: "1.65" }}
                  >
                    <button
                      onClick={() => setHowItWorksOpen(true)}
                      className="ml-auto flex items-center gap-1 text-primary cursor-pointer hover:underline"
                    >
                      <Info className="h-3 w-3" /> How it works?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2 — Recent Activity + Fraud Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* Recent Activity Feed */}
          <motion.div variants={item} className="lg:col-span-7">
            <div
              className="rounded-2xl p-5 h-full border"
              style={{
                background: surface,
                borderColor: "rgba(128,128,128,0.1)",
                borderRadius: 16,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground tracking-tight" style={{ lineHeight: "1.65" }}>Recent Activity</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] text-success bg-success/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live
                </div>
              </div>
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-xs">No activity yet — events will appear here in real-time</p>
                  </div>
                ) : (
                  recentActivity.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors group"
                    >
                      <div className={cn(
                        "mt-0.5 p-1.5 rounded-md flex-shrink-0",
                        a.type === 'fraud' ? 'bg-destructive/10 text-destructive' :
                          a.type === 'blocked' ? 'bg-warning/10 text-warning' :
                            a.type === 'approved' ? 'bg-success/10 text-success' :
                              'bg-primary/10 text-primary'
                      )}>
                        {a.type === 'fraud' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                          a.type === 'blocked' ? <ShieldOff className="h-3.5 w-3.5" /> :
                            <Activity className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{a.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                      </div>
                      {a.amount ? (
                        <span className="text-xs font-semibold text-warning flex-shrink-0">₹{a.amount.toLocaleString('en-IN')}</span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Fraud Types Breakdown */}
          <motion.div variants={item} className="lg:col-span-5">
            <div
              className="rounded-2xl p-5 h-full border"
              style={{
                background: surface,
                borderColor: "rgba(128,128,128,0.1)",
                borderRadius: 16,
              }}
            >
              <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4" style={{ lineHeight: "1.65" }}>Fraud Detection Summary</h3>
              <div className="space-y-4">
                {/* GeoMismatch */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-xs text-foreground">GeoMismatch</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{stats.flaggedTransactions > 0 ? Math.round(stats.flaggedTransactions * 0.6) : 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700" style={{ width: `${Math.min(100, stats.flaggedTransactions > 0 ? 60 : 0)}%` }} />
                  </div>
                </div>
                {/* ImpossibleJump */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-xs text-foreground">ImpossibleJump</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{stats.flaggedTransactions > 0 ? Math.round(stats.flaggedTransactions * 0.4) : 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700" style={{ width: `${Math.min(100, stats.flaggedTransactions > 0 ? 40 : 0)}%` }} />
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-border/40">
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Detection Rate</p>
                    <p className="text-lg font-bold text-foreground">{stats.totalTransactions > 0 ? ((stats.flaggedTransactions / stats.totalTransactions) * 100).toFixed(1) : '0.0'}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Blocked Rate</p>
                    <p className="text-lg font-bold text-foreground">{stats.flaggedTransactions > 0 ? ((stats.activeAlerts === 0 ? stats.flaggedTransactions : stats.flaggedTransactions - stats.activeAlerts) / stats.flaggedTransactions * 100).toFixed(1) : '0.0'}%</p>
                  </div>
                </div>

                {/* Quick link */}
                <button
                  onClick={() => navigate('/inbound-requests')}
                  className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Review Pending Requests
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {reviewRequest && (
          <ReviewModal
            request={reviewRequest}
            onClose={() => setReviewRequest(null)}
            onAction={handleAction}
          />
        )}
        {howItWorksOpen && (
          <HowItWorksDialog onClose={() => setHowItWorksOpen(false)} />
        )}
      </AnimatePresence>
    </DashboardLayout >
  );
};

// Utility inline component
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default Index;
