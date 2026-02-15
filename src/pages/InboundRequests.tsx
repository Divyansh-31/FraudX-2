import { useState } from "react";
import { ExternalLink, Search, Inbox, Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { ReviewModal } from "@/components/ReviewModal";
import { formatINR } from "@/lib/formatINR";
import { inboundRequests } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const InboundRequests = () => {
  const [reviewRequest, setReviewRequest] = useState<(typeof inboundRequests)[0] | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({});

  const sorted = [...inboundRequests].sort((a, b) => b.riskScore - a.riskScore);
  const pending = inboundRequests.filter((r) => r.status === "Pending").length;
  const flagged = inboundRequests.filter((r) => r.status === "Flagged").length;

  const handleAction = (id: string, action: string) => {
    setActionStatuses((prev) => ({ ...prev, [id]: action }));
  };

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={item}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Inbound Requests</h1>
          <p className="text-xs text-muted-foreground mt-1">External refund requests from partner websites</p>
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
            <p className="text-2xl font-bold text-foreground">{inboundRequests.length}</p>
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
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Flagged</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{flagged}</p>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={item}>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Request Queue</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{inboundRequests.length} requests total</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">ID</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Source</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Order ID</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">User ID</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Reason</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Amount</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Risk</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-border/10 hover:bg-accent/30 transition-colors group cursor-pointer"
                      onClick={() => setReviewRequest(req)}
                    >
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-primary">{req.id}</span>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={req.sourceWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {new URL(req.sourceWebsiteUrl).hostname}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-foreground">{req.orderId}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{req.userId}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-muted-foreground max-w-[160px] truncate block">{req.refundReason}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-foreground">{formatINR(req.amount)}</span>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {reviewRequest && (
          <ReviewModal
            request={reviewRequest}
            onClose={() => setReviewRequest(null)}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default InboundRequests;
