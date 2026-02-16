import { useState } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, CheckCircle, Ban } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR } from "@/lib/formatINR";
import { inboundRequests } from "@/lib/mockData";
import { FRAUD_WEIGHTS } from "@/lib/riskScoreEngine";

type RequestType = typeof inboundRequests[0];

interface ReviewModalProps {
    request: RequestType;
    onClose: () => void;
    onAction: (id: string, action: string) => void;
}

export function ReviewModal({ request, onClose, onAction }: ReviewModalProps) {
    const [copied, setCopied] = useState(false);
    const copyId = () => {
        navigator.clipboard.writeText(request.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

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
                className="relative bg-card rounded-2xl border border-border/60 shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Review Request</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-primary">{request.id}</span>
                            <button onClick={copyId} className="text-muted-foreground hover:text-foreground transition-colors">
                                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Source", value: new URL(request.sourceWebsiteUrl).hostname },
                            { label: "Order", value: request.orderId },
                            { label: "Amount", value: formatINR(request.amount) },
                            { label: "Reason", value: request.refundReason },
                            { label: "Customer", value: request.customerName },
                            { label: "Email", value: request.customerEmail },
                        ].map((field) => (
                            <div key={field.label}>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{field.label}</p>
                                <p className="text-xs font-medium text-foreground truncate">{field.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border/30 pt-4">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Risk Assessment</p>
                        <div className="flex items-center gap-3">
                            <RiskBadge score={request.riskScore} size="lg" />
                            <div>
                                <p className="text-sm font-bold text-foreground">{request.riskScore}/100</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {request.riskScore >= 75 ? "Critical Risk" : request.riskScore >= 50 ? "High Risk" : request.riskScore >= 25 ? "Medium Risk" : "Low Risk"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {request.fraudSignals && request.fraudSignals.length > 0 && (
                        <div className="border-t border-border/30 pt-4">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Risk Assessment Breakdown</p>
                            <div className="space-y-2">
                                {request.fraudSignals.map((signal: string) => {
                                    const weight = FRAUD_WEIGHTS[signal] || 0;
                                    return (
                                        <div key={signal} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                                <span className="text-xs font-medium text-foreground">{signal}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-destructive"
                                                        style={{ width: `${Math.min(100, (weight / 50) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-destructive">+{weight} pts</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-border/30 pt-4">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Status</p>
                        <StatusBadge status={request.status} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-6 py-4 border-t border-border/30">
                    <button
                        onClick={() => { onAction(request.id, "approved"); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-success text-white text-xs font-medium hover:bg-success/90 transition-colors"
                    >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve Refund
                    </button>
                    <button
                        onClick={() => { onAction(request.id, "blocked"); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors"
                    >
                        <Ban className="h-3.5 w-3.5" />
                        Block
                    </button>
                    <button
                        onClick={onClose}
                        className="h-9 px-3 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
