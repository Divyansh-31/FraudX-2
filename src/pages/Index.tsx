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
import {
  inboundRequests,
  dashboardStats,
  chartData,
  topFlaggedUsers,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";

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

  const [chartPeriod, setChartPeriod] = useState<"24h" | "Week" | "Month">("Month");
  const [campaignPage, setCampaignPage] = useState(1);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<(typeof inboundRequests)[0] | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({});
  const [openUserMenu, setOpenUserMenu] = useState<string | null>(null);

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

  /* Chart data filtered by period */
  const filteredChartData = (() => {
    if (chartPeriod === "24h") return chartData.slice(-3);
    if (chartPeriod === "Week") return chartData.slice(-7);
    return chartData;
  })();

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

  /* Top flagged users — paginate */
  const totalUserPages = Math.ceil(topFlaggedUsers.length / 2);
  const pagedUsers = topFlaggedUsers.slice((campaignPage - 1) * 2, campaignPage * 2);

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
            value={dashboardStats.totalTransactions.toLocaleString("en-IN")}
            icon={Activity}
            trend="+12.3% vs last week"
            trendUp
            iconColor="bg-primary/10"
            sparklineData={dashboardStats.sparklines.transactions}
            sparklineColor="#3B82F6"
          />
          <StatCard
            title="Flagged"
            value={dashboardStats.flaggedTransactions}
            icon={AlertTriangle}
            trend="+5.1% vs last week"
            trendUp={false}
            iconColor="bg-destructive/10"
            sparklineData={dashboardStats.sparklines.flagged}
            sparklineColor="#EF4444"
          />
          <StatCard
            title="Blocked"
            value={displayAmount(dashboardStats.blockedAmount)}
            icon={ShieldOff}
            iconColor="bg-warning/10"
            sparklineData={dashboardStats.sparklines.blocked}
            sparklineColor="#F59E0B"
          />
          <StatCard
            title="Avg Risk"
            value={`${dashboardStats.avgRiskScore}%`}
            icon={TrendingDown}
            iconColor="bg-amber-500/10"
            sparklineData={dashboardStats.sparklines.avgRisk}
            sparklineColor="#F59E0B"
          />
          <StatCard
            title="Active Alerts"
            value={dashboardStats.activeAlerts}
            icon={Bell}
            iconColor="bg-amber-500/10"
            sparklineData={dashboardStats.sparklines.alerts}
            sparklineColor="#F59E0B"
          />
        </motion.div>

        {/* Main Bento Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                height={180}
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
                        {displayAmount(4523000)}
                      </span>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground" style={{ lineHeight: "1.65" }}>
                          Compared to last month
                        </span>
                        <span className="text-xs font-semibold text-destructive">
                          -37.16%
                        </span>
                      </div>
                    </div>

                    {/* Top Block Reasons Breakdown */}
                    <div className="w-full mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Top Block Reasons</p>
                        <p className="text-[10px] text-muted-foreground">Last 30 days</p>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { label: "Geo Location Mismatch", percent: 42, color: "bg-blue-500", shadowColor: "#3b82f6" },
                          { label: "Velocity Checks", percent: 35, color: "bg-blue-500", shadowColor: "#3b82f6" },
                          { label: "Blacklisted Device", percent: 23, color: "bg-blue-500", shadowColor: "#3b82f6" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-foreground/90">{item.label}</span>
                              <span className="font-mono text-muted-foreground">{item.percent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percent}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className={cn("h-full rounded-full", item.color)}
                                style={{ boxShadow: `0 0 8px ${item.shadowColor}` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 text-[11px] text-muted-foreground pt-3 border-t border-border/40"
                    style={{ lineHeight: "1.65" }}
                  >
                    <span>Yearly avg: {displayAmount(3450219)}</span>
                    <ArrowUpRight className="h-3 w-3 text-success" />
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

        {/* Row 2: Table + Top Flagged */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Recent Refund Requests */}
          <motion.div variants={item} className="lg:col-span-8">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Recent Refund Requests
                    {searchQuery && (
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                        ({filteredRequests.length} result{filteredRequests.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Inbound refund queue from partner sites</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/inbound")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    View All
                    <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/20">
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Req ID</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Source</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Order</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Reason</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Amount</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Risk</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-xs text-muted-foreground">
                          No requests match "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.slice(0, 6).map((req) => (
                        <tr
                          key={req.id}
                          className="border-b border-border/10 hover:bg-accent/30 transition-colors group cursor-pointer"
                          onClick={() => setReviewRequest(req)}
                        >
                          <td className="px-5 py-3">
                            <span className="text-xs font-mono text-primary">{req.id}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-foreground">{new URL(req.sourceWebsiteUrl).hostname}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-mono text-muted-foreground">{req.orderId}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-muted-foreground truncate block max-w-[140px]">{req.refundReason}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-mono text-foreground">{displayAmount(req.amount)}</span>
                          </td>
                          <td className="px-3 py-3">
                            <RiskBadge score={req.riskScore} />
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
                            <button
                              onClick={(e) => { e.stopPropagation(); setReviewRequest(req); }}
                              className="px-2.5 py-1 rounded-lg border border-primary/30 text-[11px] font-medium text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Top Flagged Users */}
          <motion.div variants={item} className="lg:col-span-4">
            <div className="glass-card rounded-2xl p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Top Flagged Users</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{String(campaignPage).padStart(2, "0")} of {String(totalUserPages).padStart(2, "0")}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                      disabled={campaignPage <= 1}
                      className={cn(
                        "p-1 rounded hover:bg-accent transition-colors",
                        campaignPage <= 1 ? "opacity-30 cursor-not-allowed" : ""
                      )}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setCampaignPage((p) => Math.min(totalUserPages, p + 1))}
                      disabled={campaignPage >= totalUserPages}
                      className={cn(
                        "p-1 rounded hover:bg-accent transition-colors",
                        campaignPage >= totalUserPages ? "opacity-30 cursor-not-allowed" : ""
                      )}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {pagedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl bg-secondary/40 border border-border/30 p-3.5 hover:border-primary/20 transition-all group relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[90px]">{user.name}</span>
                      <div
                        ref={(el) => { userMenuRefs.current[user.id] = el; }}
                        className="relative"
                      >
                        <button
                          onClick={() => setOpenUserMenu(openUserMenu === user.id ? null : user.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        <UserActionMenu
                          userId={user.id}
                          open={openUserMenu === user.id}
                          onToggle={() => setOpenUserMenu(null)}
                          parentRef={{ current: userMenuRefs.current[user.id] }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-[11px] text-muted-foreground">
                          {user.flaggedCount} Flags
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Risk: <span className={cn(
                          "font-semibold",
                          user.riskScore >= 75 ? "text-destructive" : user.riskScore >= 40 ? "text-warning" : "text-success"
                        )}>{user.riskScore}%</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-auto">
                      {/* Avatar stack */}
                      <div className="flex -space-x-1.5">
                        {[0, 1, 2].map((j) => (
                          <div
                            key={j}
                            className={cn(
                              "h-5 w-5 rounded-full border-2 border-card bg-gradient-to-br",
                              user.color
                            )}
                          />
                        ))}
                      </div>
                      <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:bg-accent/80 transition-colors"
                        title={`View all linked accounts for ${user.name}`}
                      >
                        <span className="text-[8px] font-bold text-muted-foreground">+</span>
                      </div>
                    </div>
                  </div>
                ))}
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
    </DashboardLayout>
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
