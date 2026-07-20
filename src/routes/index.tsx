import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, GraduationCap, ListChecks, Sparkles, PlayCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ExamManifestEntry } from "@/types/exam";
import { loadProgress, loadResult } from "@/utils/storage";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

async function fetchManifest(): Promise<ExamManifestEntry[]> {
  const r = await fetch("/exams/manifest.json");
  if (!r.ok) throw new Error("Failed to load exam list");
  return r.json();
}

function HomePage() {
  const { data: exams, isLoading, error } = useQuery({
    queryKey: ["exam-manifest"],
    queryFn: fetchManifest,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">M.1 English Exam Practice</div>
              <div className="text-[11px] text-muted-foreground">
                อ21101 ภาษาอังกฤษ 1
              </div>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="border-b border-border/70 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Official Practice Examination
          </div>
          <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            English Grammar Examination
            <br />
            <span className="text-primary">for Mathayom 1 (Grade 7)</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A professional online examination platform. Choose a test below to begin. Your
            progress is saved automatically — you can safely refresh the page.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">Available Examinations</h2>
          <p className="text-sm text-muted-foreground">
            {exams ? `${exams.length} exam${exams.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>

        {isLoading && <div className="text-muted-foreground">Loading exams…</div>}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            Could not load the exam list.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {exams?.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 font-serif text-lg font-bold">Examination Instructions</h3>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>• You cannot pause the timer once the exam has started.</li>
            <li>• Answers are saved automatically after each response.</li>
            <li>• The exam will submit automatically when time runs out.</li>
            <li>• A warning appears when less than 5 minutes remain.</li>
            <li>• Use the navigator panel to jump between questions.</li>
            <li>• You may mark questions for review before submitting.</li>
          </ul>
        </div>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
        M.1 English Grammar Examination Platform · Practice Only
      </footer>
    </div>
  );
}

function ExamCard({ exam }: { exam: ExamManifestEntry }) {
  const [state, setState] = useState<"new" | "in-progress" | "completed">("new");
  useEffect(() => {
    if (loadResult(exam.id)) setState("completed");
    else if (loadProgress(exam.id)) setState("in-progress");
  }, [exam.id]);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        {state === "in-progress" && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            In progress
          </span>
        )}
        {state === "completed" && (
          <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:text-green-400">
            Completed
          </span>
        )}
      </div>

      <h3 className="font-serif text-xl font-bold leading-tight">{exam.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{exam.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <Meta icon={<ListChecks className="h-3.5 w-3.5" />} label="Questions" value={String(exam.totalQuestions)} />
        <Meta icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={`${exam.duration} min`} />
        <Meta icon={<Sparkles className="h-3.5 w-3.5" />} label="Level" value={exam.difficulty} />
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          to="/exam/$examId"
          params={{ examId: exam.id }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <PlayCircle className="h-4 w-4" />
          {state === "in-progress" ? "Resume Exam" : state === "completed" ? "Retake Exam" : "Start Exam"}
        </Link>
        {state === "completed" && (
          <Link
            to="/result/$examId"
            params={{ examId: exam.id }}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            View Result
          </Link>
        )}
      </div>
    </article>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}
