import type { Passage } from "@/types/exam";
import { BookOpen } from "lucide-react";

export function ReadingPassageView({
  passage,
  rangeLabel,
}: {
  passage: Passage;
  rangeLabel?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-5 shadow-inner">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <BookOpen className="h-3.5 w-3.5" />
        Reading Passage
        {rangeLabel && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">
            {rangeLabel}
          </span>
        )}
      </div>
      <h3 className="mb-2 font-serif text-lg font-bold text-foreground">{passage.title}</h3>
      <div className="max-h-[420px] overflow-y-auto whitespace-pre-line font-serif text-[15px] leading-relaxed text-foreground/90">
        {passage.passage}
      </div>
    </div>
  );
}
