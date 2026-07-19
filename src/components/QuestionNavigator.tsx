import { cn } from "@/lib/utils";
import type { ExamProgress, FlatQuestion } from "@/types/exam";
import { Flag } from "lucide-react";

interface Props {
  questions: FlatQuestion[]; // in play order
  progress: ExamProgress;
  onJump: (index: number) => void;
}

export function QuestionNavigator({ questions, progress, onJump }: Props) {
  const answeredCount = Object.values(progress.answers).filter(Boolean).length;
  const markedCount = Object.values(progress.marked).filter(Boolean).length;

  return (
    <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Question Navigator
      </h3>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-primary/10 px-2 py-1.5 text-primary">
          Answered: <span className="font-bold">{answeredCount}</span>
        </div>
        <div className="rounded-lg bg-muted px-2 py-1.5 text-muted-foreground">
          Left: <span className="font-bold">{questions.length - answeredCount}</span>
        </div>
        <div className="col-span-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-amber-700 dark:text-amber-400">
          <Flag className="mr-1 inline h-3 w-3" /> Marked: <span className="font-bold">{markedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const answered = !!progress.answers[q.id];
          const marked = !!progress.marked[q.id];
          const current = i === progress.currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={cn(
                "relative aspect-square rounded-lg border text-sm font-semibold transition-all",
                current
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/40"
                  : answered
                  ? "border-primary/30 bg-primary/15 text-primary hover:bg-primary/25"
                  : "border-border bg-background text-foreground hover:bg-accent",
              )}
              aria-label={`Question ${q.number}${answered ? ", answered" : ""}${marked ? ", marked for review" : ""}${current ? ", current" : ""}`}
            >
              {q.number}
              {marked && (
                <Flag className="absolute -right-1 -top-1 h-3 w-3 fill-amber-500 stroke-amber-600" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
        <Legend swatch="bg-primary" label="Current" />
        <Legend swatch="bg-primary/15 border border-primary/30" label="Answered" />
        <Legend swatch="bg-background border border-border" label="Not answered" />
        <Legend swatch="bg-amber-500" label="Marked for review" />
      </div>
    </aside>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-block h-3 w-3 rounded", swatch)} />
      <span>{label}</span>
    </div>
  );
}
