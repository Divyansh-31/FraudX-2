/**
 * FraudX Risk Score Engine
 * 
 * Computes a 0–100 risk score by summing weighted fraud signals.
 * Each fraud type contributes a fixed number of points.
 */

// ── Fraud signal weights ───────────────────────────────────────────
export const FRAUD_WEIGHTS: Record<string, number> = {
    // Location-based
    GeoMismatch: 60,
    ImpossibleJump: 80,
    RegionFraud: 50,

    // ML / Image analysis
    "AI-Generated": 100, // Critical fraud
    Tampered: 30,
    Suspicious: 15,

    // Behavioral / transactional
    HighReturnRate: 80, // New signal for >30-40% returns
    UnauthorizedPurchase: 20,
    HighAmount: 10,
    RepeatOffender: 15,
};

// ── Risk level thresholds ──────────────────────────────────────────
export type RiskLevel = "critical" | "high" | "medium" | "low";

export function getRiskLevel(score: number): RiskLevel {
    if (score >= 75) return "critical";
    if (score >= 50) return "high";
    if (score >= 25) return "medium";
    return "low";
}

// ── Color mapping ──────────────────────────────────────────────────
const RISK_COLORS: Record<RiskLevel, string> = {
    critical: "text-destructive",
    high: "text-orange-500",
    medium: "text-warning",
    low: "text-success",
};

const RISK_BG_COLORS: Record<RiskLevel, string> = {
    critical: "bg-destructive/15",
    high: "bg-orange-500/15",
    medium: "bg-warning/15",
    low: "bg-success/15",
};

const RISK_RING_COLORS: Record<RiskLevel, string> = {
    critical: "stroke-destructive",
    high: "stroke-orange-500",
    medium: "stroke-warning",
    low: "stroke-success",
};

export function getRiskColor(score: number) {
    const level = getRiskLevel(score);
    return {
        text: RISK_COLORS[level],
        bg: RISK_BG_COLORS[level],
        ring: RISK_RING_COLORS[level],
        level,
    };
}

// ── Core scoring function ──────────────────────────────────────────
/**
 * Calculate a 0–100 risk score from an array of fraud signal names.
 * Unknown signals contribute 0 points.
 */
export function calculateRiskScore(signals: string[]): number {
    if (!signals || signals.length === 0) return 0;

    const raw = signals.reduce((sum, signal) => {
        return sum + (FRAUD_WEIGHTS[signal] ?? 0);
    }, 0);

    return Math.min(100, Math.max(0, raw));
}

// ── Helper: derive fraud signals from InboundRequest context ──────
export function deriveInboundSignals(opts: {
    refundReason: string;
    amount: number;
    flaggedCount?: number;
    status?: string;
    returnRate?: number; // 0.0 to 1.0
}): string[] {
    const signals: string[] = [];

    const reason = opts.refundReason.toLowerCase();
    if (reason.includes("unauthorized") || reason.includes("hacked")) {
        signals.push("UnauthorizedPurchase");
    }
    if (reason.includes("never ordered")) {
        signals.push("UnauthorizedPurchase");
    }
    if (reason.includes("not received")) {
        signals.push("GeoMismatch");
    }

    if (opts.amount > 50000) {
        signals.push("HighAmount");
    }

    if (opts.flaggedCount && opts.flaggedCount > 3) {
        signals.push("RepeatOffender");
    }

    if (opts.returnRate && opts.returnRate > 0.35) {
        signals.push("HighReturnRate");
    }

    if (opts.status === "Flagged") {
        // Flagged requests always start with a baseline
        if (signals.length === 0) {
            signals.push("Suspicious");
        }
    }

    return [...new Set(signals)]; // deduplicate
}
