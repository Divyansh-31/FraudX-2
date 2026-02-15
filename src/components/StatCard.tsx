import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Sparkline } from "./GlowChart";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  iconColor?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
  iconColor,
  sparklineData,
  sparklineColor = "#3B82F6",
}: StatCardProps) {
  return (
    <div className={cn(
      "glass-card glass-card-hover rounded-xl p-4 space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider" style={{ lineHeight: "1.65" }}>{title}</p>
        <div className={cn(
          "p-2 rounded-lg",
          iconColor || "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            iconColor ? "text-foreground" : "text-primary"
          )} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          {trend && (
            <p className={cn(
              "text-xs font-medium mt-1.5 flex items-center gap-1",
              trendUp ? "text-success" : "text-destructive"
            )}>
              <span className={cn(
                "inline-block h-0 w-0 border-x-[3px] border-x-transparent",
                trendUp ? "border-b-[5px] border-b-success" : "border-t-[5px] border-t-destructive"
              )} />
              {trend}
            </p>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline
            data={sparklineData}
            color={sparklineColor}
            width={72}
            height={28}
          />
        )}
      </div>
    </div>
  );
}
