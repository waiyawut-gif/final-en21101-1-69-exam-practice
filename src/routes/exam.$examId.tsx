import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  GraduationCap,
  RotateCcw,
  Send,
  Home,
} from "lucide-react";
import type { Exam, ExamProgress, FlatQuestion } from "@/types/exam";
import {
  computeResult,
  flattenExam,
  initProgress,
  passageGroupRange,
} from "@/utils/exam-utils";
import { clearProgress, loadProgress, saveProgress, saveResult } from "@/utils/storage";
import { ExamTimer } from "@/components/ExamTimer";
import { QuestionNavigator } from "@/components/QuestionNavigator";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { ReadingPassageView } from "@/components/ReadingPassageView";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/exam/$examId")({
  component: ExamPage,
});

async function fetchExam(examId: string): Promise<Exam> {
  const r = await fetch(`/exams/${examId}.json`);
  if (!r.ok) throw new Error("Failed to load exam");
  return r.json();
}

function ExamPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();

  const { data: exam, isLoading, error } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => fetchExam(examId),
  });

  const [progress, setProgress] = useState<ExamProgress | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const autoSubmittedRef = useRef(false);

  // init / resume
  useEffect(() => {
    if (!exam) return;
    const existing = loadProgress(exam.id);
    if (existing && !existing.submitted) {
      setProgress(existing);
    } else {
      const p = initProgress(exam.id, exam);
      saveProgress(p);
      setProgress(p);
    }
  }, [exam]);

  // build ordered flat questions
  const orderedQuestions: FlatQuestion[] = useMemo(() => {
    if (!exam || !progress) return [];
    const flat = flattenExam(exam);
    const byId = new Map(flat.map((q) => [q.id, q]));
    return progress.order.map((id) => byId.get(id)!).filter(Boolean);
  }, [exam, progress]);

  const current = progress ? orderedQuestions[progress.currentIndex] : null;

  /* -------- timer -------- */
  useEffect(() => {
    if (!progress) return;
    const tick = () => {
      const elapsed = (Date.now() - progress.startedAt) / 1000;
      const rem = Math.max(0, progress.durationSec - elapsed);
      setRemaining(rem);
      if (rem <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmit(true);
      }
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.startedAt, progress?.durationSec]);

  /* -------- persist -------- */
  const updateProgress = useCallback((mut: (p: ExamProgress) => ExamProgress) => {
    setProgress((prev) => {
      if (!prev) return prev;
      const next = mut(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  const selectAnswer = (qid: string, choice: string) =>
    updateProgress((p) => ({ ...p, answers: { ...p.answers, [qid]: choice } }));
  const clearAnswer = (qid: string) =>
    updateProgress((p) => {
      const next = { ...p.answers };
      delete next[qid];
      return { ...p, answers: next };
    });
  const toggleMark = (qid: string) =>
    updateProgress((p) => ({
      ...p,
      marked: { ...p.marked, [qid]: !p.marked[qid] },
    }));
  const jump = (idx: number) => updateProgress((p) => ({ ...p, currentIndex: idx }));

  const goPrev = () =>
    progress && progress.currentIndex > 0 && jump(progress.currentIndex - 1);
  const goNext = () =>
    progress &&
    progress.currentIndex < orderedQuestions.length - 1 &&
    jump(progress.currentIndex + 1);

  /* -------- keyboard nav -------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!progress || !current) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "m" || e.key === "M") toggleMark(current.id);
      else if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const choices = progress.choiceOrder[current.id];
        if (choices && choices[idx] !== undefined) selectAnswer(current.id, choices[idx]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, current]);

  /* -------- submit -------- */
  function handleSubmit(auto = false) {
    if (!exam || !progress) return;
    const timeUsed = Math.min(
      progress.durationSec,
      Math.floor((Date.now() - progress.startedAt) / 1000),
    );
    const result = computeResult(exam, progress, timeUsed);
    saveResult(result);
    saveProgress({ ...progress, submitted: true });
    // Keep progress so review page can reconstruct order/choices
    navigate({ to: "/result/$examId", params: { examId: exam.id } });
    void auto;
  }

  function handleRestart() {
    if (!exam) return;
    clearProgress(exam.id);
    const p = initProgress(exam.id, exam);
    saveProgress(p);
    setProgress(p);
    autoSubmittedRef.current = false;
  }

  if (isLoading || !exam || !progress || !current) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        {error ? "Could not load exam." : "Preparing your exam…"}
      </div>
    );
  }

  const answered = Object.values(progress.answers).filter(Boolean).length;
  const total = orderedQuestions.length;
  const pct = (answered / total) * 100;

  const sectionQuestions = orderedQuestions.filter(
    (q) => q.sectionIndex === current.sectionIndex,
  );
  const passageRange =
    current.passage &&
    passageGroupRange(sectionQuestions, current.passage.id) &&
    (() => {
      const r = passageGroupRange(sectionQuestions, current.passage!.id)!;
      const inGroup = orderedQuestions.filter((q) => q.passageId === current.passage!.id);
      const nums = inGroup.map((q) => q.number).sort((a, b) => a - b);
      return `Questions ${nums[0]}–${nums[nums.length - 1]}`;
    })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{exam.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {current.sectionPart ? `${current.sectionPart} · ` : ""}
                  {current.sectionTitle}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ExamTimer remainingSec={remaining} />
              <ThemeToggle />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {answered}/{total} answered · Q{current.number}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {/* Section header */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-primary px-2.5 py-1 font-bold text-primary-foreground">
                {current.sectionPart ?? "Section"}
              </span>
              <span className="font-serif text-base font-bold">
                {current.sectionTitle}
              </span>
            </div>
            {exam.sections[current.sectionIndex].instructions && (
              <p className="mt-2 text-sm italic text-muted-foreground">
                {exam.sections[current.sectionIndex].instructions}
              </p>
            )}
          </div>

          {/* Passage + Question */}
          {current.passage && (
            <ReadingPassageView
              passage={current.passage}
              rangeLabel={passageRange || undefined}
            />
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <QuestionRenderer
              question={current}
              choices={progress.choiceOrder[current.id] ?? current.choices}
              selected={progress.answers[current.id]}
              onSelect={(c) => selectAnswer(current.id, c)}
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleMark(current.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    progress.marked[current.id]
                      ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <Flag className="h-4 w-4" />
                  {progress.marked[current.id] ? "Marked" : "Mark for review"}
                </button>
                <button
                  onClick={() => clearAnswer(current.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear answer
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  disabled={progress.currentIndex === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                {progress.currentIndex < total - 1 ? (
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmSubmit(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" /> Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <div>Tip: Use ← → to navigate, 1–4 to answer, M to mark.</div>
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="underline hover:text-foreground"
              >
                Restart exam
              </button>
              <Link to="/" className="inline-flex items-center gap-1 underline hover:text-foreground">
                <Home className="h-3 w-3" /> Home
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-[128px] lg:self-start">
          <QuestionNavigator
            questions={orderedQuestions}
            progress={progress}
            onJump={jump}
          />
          <button
            onClick={() => setConfirmSubmit(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Send className="h-4 w-4" /> Submit Exam
          </button>
        </div>
      </main>

      {confirmSubmit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-in fade-in-0 duration-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="font-serif text-xl font-bold">Submit your exam?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You have answered <b>{answered}</b> of <b>{total}</b> questions.{" "}
              {answered < total && (
                <span className="text-amber-600 dark:text-amber-400">
                  {total - answered} unanswered will be marked as skipped.
                </span>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Keep working
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
