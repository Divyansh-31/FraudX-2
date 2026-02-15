import { cn } from "@/lib/utils";
import { getRiskColor } from "@/lib/riskScoreEngine";
import { useEffect, useState } from "react";

interface RiskBadgeProps {
  score: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RiskBadge({ score, className, size = "sm", showLabel = false }: RiskBadgeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { text, bg, ring, level } = getRiskColor(score);

  // Animate the score on mount
  useEffect(() => {
    setAnimatedScore(0);
    const duration = 800;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(score, Math.round(increment * step));
      setAnimatedScore(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // SVG gauge dimensions
  const dims = {
    sm: { size: 36, stroke: 3, radius: 14, fontSize: 10 },
    md: { size: 48, stroke: 3.5, radius: 19, fontSize: 13 },
    lg: { size: 64, stroke: 4, radius: 26, fontSize: 16 },
  }[size];

  const circumference = 2 * Math.PI * dims.radius;
  const progress = (animatedScore / 100) * circumference;

  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Radial gauge */}
      <div className="relative" style={{ width: dims.size, height: dims.size }}>
        <svg
          width={dims.size}
          height={dims.size}
          viewBox={`0 0 ${dims.size} ${dims.size}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={dims.size / 2}
            cy={dims.size / 2}
            r={dims.radius}
            stroke="currentColor"
            strokeWidth={dims.stroke}
            fill="none"
            className="text-border/30"
          />
          {/* Progress ring */}
          <circle
            cx={dims.size / 2}
            cy={dims.size / 2}
            r={dims.radius}
            stroke="currentColor"
            strokeWidth={dims.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={cn(ring, "transition-all duration-700 ease-out")}
          />
        </svg>
        {/* Score number */}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-bold font-mono tabular-nums",
            text
          )}
          style={{ fontSize: dims.fontSize }}
        >
          {animatedScore}
        </span>
      </div>

      {/* Optional label */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", text)}>
            {labels[level]}
          </span>
          <span className="text-[9px] text-muted-foreground">Risk</span>
        </div>
      )}
    </div>
  );
}
