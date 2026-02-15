import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
      status === 'Verified' && "bg-success/12 text-success border border-success/20",
      status === 'Blocked' && "bg-destructive/12 text-destructive border border-destructive/20",
      status === 'Pending' && "bg-warning/12 text-warning border border-warning/20",
      status === 'Analyzing' && "bg-primary/12 text-primary border border-primary/20",
      status === 'Flagged' && "bg-destructive/12 text-destructive border border-destructive/20",
      status === 'Resolved' && "bg-success/12 text-success border border-success/20",
      className
    )}>
      <div className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === 'Verified' && "bg-success",
        status === 'Blocked' && "bg-destructive",
        status === 'Pending' && "bg-warning animate-pulse",
        status === 'Analyzing' && "bg-primary animate-pulse",
        status === 'Flagged' && "bg-destructive animate-pulse",
        status === 'Resolved' && "bg-success",
      )} />
      {status}
    </div>
  );
}
