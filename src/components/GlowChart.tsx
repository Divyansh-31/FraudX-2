import { useState, useCallback } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/formatINR";

/* Helper: read a CSS custom property at runtime */
const cssVar = (name: string) =>
    typeof document !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        : "";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GlowChartProps {
    data: Array<Record<string, any>>;
    lines: {
        dataKey: string;
        color: string;       // hex, e.g. "#3B82F6"
        glowColor?: string;  // defaults to color
        label: string;
    }[];
    xKey?: string;
    yFormatter?: (v: number) => string;
    className?: string;
    height?: number;
    showLegend?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Concentric‐circle glow active dot                                  */
/* ------------------------------------------------------------------ */

const GlowActiveDot = ({ cx, cy, fill }: any) => {
    if (cx == null || cy == null) return null;
    return (
        <g>
            {/* Outer glow ring */}
            <circle
                cx={cx}
                cy={cy}
                r={12}
                fill={fill}
                fillOpacity={0.15}
                filter="url(#dotGlow)"
            />
            {/* Middle ring */}
            <circle
                cx={cx}
                cy={cy}
                r={7}
                fill={fill}
                fillOpacity={0.3}
            />
            {/* Inner solid dot */}
            <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="#ffffff"
                stroke={fill}
                strokeWidth={2}
            />
        </g>
    );
};

/* ------------------------------------------------------------------ */
/*  Glassmorphic Tooltip                                               */
/* ------------------------------------------------------------------ */

interface GlowTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    lines: GlowChartProps["lines"];
    yFormatter?: (v: number) => string;
    previousData?: Record<string, number>;
}

const GlowTooltip = ({ active, payload, label, lines, yFormatter, previousData }: GlowTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const defaultFormatter = (v: number) => v.toLocaleString("en-IN");
    const fmt = yFormatter || defaultFormatter;

    return (
        <div
            className="rounded-xl px-4 py-3 shadow-2xl border pointer-events-none"
            style={{
                background: cssVar("--tooltip-bg") || "rgba(22, 23, 27, 0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderColor: cssVar("--tooltip-border") || "rgba(255,255,255,0.08)",
                minWidth: 160,
            }}
        >
            <p className="text-[11px] font-semibold mb-2 tracking-tight" style={{ lineHeight: "1.65", color: cssVar("--tooltip-text") || "rgba(255,255,255,0.9)" }}>
                {label}
            </p>

            {/* Values */}
            <div className="space-y-1.5">
                {payload.map((entry: any, idx: number) => {
                    const lineCfg = lines.find(l => l.dataKey === entry.dataKey);
                    const color = lineCfg?.color || entry.stroke;
                    const currentVal = entry.value;
                    const prevVal = previousData?.[entry.dataKey];
                    let pctChange: string | null = null;
                    if (prevVal && prevVal > 0) {
                        const pct = ((currentVal - prevVal) / prevVal) * 100;
                        pctChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
                    }

                    return (
                        <div key={idx} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        background: color,
                                        boxShadow: `0 0 6px ${color}`,
                                    }}
                                />
                                <span className="text-[10px] uppercase tracking-wider" style={{ lineHeight: "1.65", color: cssVar("--tooltip-muted") || "rgba(255,255,255,0.5)" }}>
                                    {lineCfg?.label || entry.dataKey}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold font-mono tabular-nums" style={{ color: cssVar("--tooltip-text") || "rgba(255,255,255,0.9)" }}>
                                    {fmt(currentVal)}
                                </span>
                                {pctChange && (
                                    <span
                                        className={cn(
                                            "text-[9px] font-semibold px-1.5 py-0.5 rounded-md",
                                            pctChange.startsWith("+")
                                                ? "text-emerald-400 bg-emerald-400/10"
                                                : "text-red-400 bg-red-400/10"
                                        )}
                                    >
                                        {pctChange}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function GlowChart({
    data,
    lines,
    xKey = "date",
    yFormatter,
    className,
    height = 220,
    showLegend = true,
}: GlowChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Build previous data for % change calculation
    const getPreviousData = useCallback(
        (index: number | null) => {
            if (index == null || index <= 0) return undefined;
            const prev = data[index - 1];
            if (!prev) return undefined;
            const result: Record<string, number> = {};
            lines.forEach(l => {
                result[l.dataKey] = prev[l.dataKey] ?? 0;
            });
            return result;
        },
        [data, lines]
    );

    return (
        <div className={cn("w-full", className)}>
            {/* Legend */}
            {showLegend && (
                <div className="flex items-center gap-4 mb-3 px-1">
                    {lines.map((line) => (
                        <div key={line.dataKey} className="flex items-center gap-1.5">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{
                                    background: line.color,
                                    boxShadow: `0 0 6px ${line.color}`,
                                }}
                            />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium" style={{ lineHeight: "1.65" }}>
                                {line.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        onMouseMove={(state: any) => {
                            if (state?.activeTooltipIndex != null) {
                                setActiveIndex(state.activeTooltipIndex);
                            }
                        }}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <defs>
                            {/* Glow filter for active dots */}
                            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Per-line gradients + glow filters */}
                            {lines.map((line) => (
                                <linearGradient
                                    key={`grad-${line.dataKey}`}
                                    id={`glowGrad-${line.dataKey}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor={line.color} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                                </linearGradient>
                            ))}

                            {lines.map((line) => (
                                <filter
                                    key={`glow-${line.dataKey}`}
                                    id={`lineGlow-${line.dataKey}`}
                                    x="-10%"
                                    y="-10%"
                                    width="120%"
                                    height="120%"
                                >
                                    <feGaussianBlur
                                        in="SourceGraphic"
                                        stdDeviation="4"
                                        result="blur"
                                    />
                                    <feFlood floodColor={line.glowColor || line.color} floodOpacity="0.6" result="color" />
                                    <feComposite in="color" in2="blur" operator="in" result="glowColor" />
                                    <feMerge>
                                        <feMergeNode in="glowColor" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            ))}
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={cssVar("--chart-grid") || "rgba(255,255,255,0.04)"}
                            vertical={false}
                        />

                        <XAxis
                            dataKey={xKey}
                            tick={{
                                fontSize: 10,
                                fill: cssVar("--chart-text") || "rgba(255,255,255,0.35)",
                                fontFamily: "Inter, sans-serif",
                            }}
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                            style={{ lineHeight: "1.65" } as any}
                        />

                        <YAxis
                            tick={{
                                fontSize: 10,
                                fill: cssVar("--chart-text") || "rgba(255,255,255,0.35)",
                                fontFamily: "Inter, sans-serif",
                            }}
                            tickLine={false}
                            axisLine={false}
                            dx={-4}
                            tickFormatter={yFormatter || ((v) => `${(v / 1000).toFixed(0)}k`)}
                            style={{ lineHeight: "1.65" } as any}
                        />

                        <Tooltip
                            content={
                                <GlowTooltip
                                    lines={lines}
                                    yFormatter={yFormatter}
                                    previousData={getPreviousData(activeIndex)}
                                />
                            }
                            cursor={{
                                stroke: cssVar("--cursor-color") || "rgba(255,255,255,0.06)",
                                strokeWidth: 1,
                                strokeDasharray: "4 4",
                            }}
                        />

                        {lines.map((line) => (
                            <Area
                                key={line.dataKey}
                                type="monotone"
                                dataKey={line.dataKey}
                                stroke={line.color}
                                strokeWidth={1.5}
                                fill={`url(#glowGrad-${line.dataKey})`}
                                filter={`url(#lineGlow-${line.dataKey})`}
                                dot={false}
                                activeDot={<GlowActiveDot fill={line.color} />}
                                animationDuration={1200}
                                animationEasing="ease-out"
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Mini Sparkline — for stat cards                                    */
/* ------------------------------------------------------------------ */

interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    className?: string;
}

export function Sparkline({
    data,
    color = "#3B82F6",
    width = 80,
    height = 28,
    className,
}: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((v, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((v - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    });

    const pathD = `M${points.join(" L")}`;
    const areaD = `${pathD} L${width - padding},${height} L${padding},${height} Z`;

    return (
        <svg width={width} height={height} className={cn("overflow-visible", className)}>
            <defs>
                <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <filter id={`sparkGlow-${color.replace("#", "")}`}>
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feFlood floodColor={color} floodOpacity="0.5" result="glowColor" />
                    <feComposite in="glowColor" in2="blur" operator="in" result="colored" />
                    <feMerge>
                        <feMergeNode in="colored" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Area fill */}
            <path
                d={areaD}
                fill={`url(#sparkGrad-${color.replace("#", "")})`}
            />
            {/* Glow line */}
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#sparkGlow-${color.replace("#", "")})`}
            />
            {/* End dot */}
            <circle
                cx={parseFloat(points[points.length - 1].split(",")[0])}
                cy={parseFloat(points[points.length - 1].split(",")[1])}
                r={2}
                fill="#fff"
                stroke={color}
                strokeWidth={1}
            />
        </svg>
    );
}
