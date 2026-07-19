import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, Home, MinusCircle, XCircle } from "lucide-react";
import type { Exam } from "@/types/exam";
import { flattenExam } from "@/utils/exam-utils";
import { loadProgress, loadResult } from "@/utils/storage";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { ReadingPassageView } from "@/components/ReadingPassageView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useMemo, useState } from "react";
import type { ExamProgress, ExamResult } from "@/types/exam";

export const Route = createFileRoute("/review/$examId")({
  component: ReviewPage,
});

async function fetchExam(examId: string): Promise<Exam> {
  const r = await fetch(`/exams/${examId}.json`);
  if (!r.ok) throw new Error("Failed to load exam");
  return r.json();
}

type Filter = "all" | "correct" | "wrong" | "skipped";

function ReviewPage() {
  const { examId } = Route.useParams();
  const { data: exam } = useQuery({ queryKey: ["exam", examId], queryFn: () => fetchExam(examId) });
  const [result, setResult] = useState<ExamResult | null>(null);
  const [progress, setProgress] = useState<ExamProgress | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setResult(loadResult(examId));
    setProgress(loadProgress(examId));
    setReady(true);
  }, [examId]);
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    if (!exam || !result) return [];
    const flat = flattenExam(exam);
    const byId = new Map(flat.map((q) => [q.id, q]));
    const order = progress?.order?.length ? progress.order : flat.map((q) => q.id);
    return order
      .map((id) => {
        const q = byId.get(id);
        if (!q) return null;
        const r = result.perQuestion.find((p) => p.id === id);
        const status: "correct" | "wrong" | "skipped" = !r?.userAnswer
          ? "skipped"
          : r.correct
          ? "correct"
          : "wrong";
        const choices = progress?.choiceOrder?.[id] ?? q.choices;
        return { q, r, status, choices };
      })
      .filter(Boolean) as Array<{
      q: ReturnType<typeof flattenExam>[number];
      r: (typeof result.perQuestion)[number] | undefined;
      status: "correct" | "wrong" | "skipped";
      choices: string[];
    }>;
  }, [exam, result, progress]);

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  if (!exam || !result) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <p className="text-muted-foreground">No result to review.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    all: items.length,
    correct: items.filter((i) => i.status === "correct").length,
    wrong: items.filter((i) => i.status === "wrong").length,
    skipped: items.filter((i) => i.status === "skipped").length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/result/$examId"
            params={{ examId }}
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Result
          </Link>
          <div className="truncate text-sm text-muted-foreground">{exam.title}</div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">Review Answers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review every question with the correct answer and explanation.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "correct", "wrong", "skipped"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {f} <span className="opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {filtered.map(({ q, r, status, choices }) => (
            <article
              key={q.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {q.sectionPart ? `${q.sectionPart} · ` : ""}
                  {q.sectionTitle}
                </div>
                <StatusBadge status={status} />
              </div>

              {q.passage && <ReadingPassageView passage={q.passage} />}

              <div className={q.passage ? "mt-4" : ""}>
                <QuestionRenderer
                  question={q}
                  choices={choices}
                  selected={r?.userAnswer ?? undefined}
                  onSelect={() => {}}
                  disabled
                  reviewMode
                  correctAnswer={q.answer}
                />
              </div>

              <div className="mt-5 grid gap-3 rounded-xl bg-secondary/50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Your Answer
                  </div>
                  <div className="mt-0.5 font-medium">
                    {r?.userAnswer ?? <span className="italic text-muted-foreground">Skipped</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Correct Answer
                  </div>
                  <div className="mt-0.5 font-medium text-green-700 dark:text-green-400">
                    {q.answer}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Explanation
                  </div>
                  <div className="mt-0.5">{q.explanation || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Grammar Topic
                  </div>
                  <div className="mt-0.5">{q.topic}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Difficulty
                  </div>
                  <div className="mt-0.5 capitalize">{q.difficulty}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-accent"
          >
            <Home className="h-4 w-4" /> Back Home
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: "correct" | "wrong" | "skipped" }) {
  if (status === "correct")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Correct
      </span>
    );
  if (status === "wrong")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Wrong
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <MinusCircle className="h-3.5 w-3.5" /> Skipped
    </span>
  );
}
