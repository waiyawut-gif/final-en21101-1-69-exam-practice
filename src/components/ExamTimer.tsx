import { Clock, AlertTriangle } from "lucide-react";
import { formatTime } from "@/utils/exam-utils";
import { cn } from "@/lib/utils";

export function ExamTimer({ remainingSec }: { remainingSec: number }) {
  const warn = remainingSec <= 5 * 60;
  const critical = remainingSec <= 60;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-sm font-semibold tabular-nums",
        critical
          ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
          : warn
          ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {warn ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      <span>{formatTime(remainingSec)}</span>
    </div>
  );
}
