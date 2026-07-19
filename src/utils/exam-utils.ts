import type {
  Exam,
  ExamProgress,
  ExamResult,
  FlatQuestion,
  Question,
  Section,
} from "@/types/exam";

/** Fisher-Yates shuffle (pure) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Flatten sections into a numbered list, keeping section metadata & passage refs */
export function flattenExam(exam: Exam): FlatQuestion[] {
  const flat: FlatQuestion[] = [];
  let n = 1;
  exam.sections.forEach((section, sIdx) => {
    const passageMap = new Map((section.passages ?? []).map((p) => [p.id, p]));
    section.questions.forEach((q) => {
      flat.push({
        ...q,
        number: n++,
        sectionIndex: sIdx,
        sectionTitle: section.title,
        sectionPart: section.part,
        passage: q.passageId ? passageMap.get(q.passageId) ?? null : null,
      });
    });
  });
  return flat;
}

/** Compute question-groupings by passageId for label like "Questions 10–12" */
export function passageGroupRange(
  questions: FlatQuestion[],
  passageId: string,
): { start: number; end: number } | null {
  const inGroup = questions.filter((q) => q.passageId === passageId);
  if (inGroup.length === 0) return null;
  return {
    start: Math.min(...inGroup.map((q) => q.number)),
    end: Math.max(...inGroup.map((q) => q.number)),
  };
}

export function initProgress(
  examId: string,
  exam: Exam,
  { randomizeQuestions = true, randomizeChoices = true } = {},
): ExamProgress {
  const flat = flattenExam(exam);
  // Randomize within each section only (keeps section structure intact)
  const orderIds: string[] = [];
  exam.sections.forEach((_, sIdx) => {
    const secQs = flat.filter((q) => q.sectionIndex === sIdx);
    const ids = secQs.map((q) => q.id);
    orderIds.push(...(randomizeQuestions ? shuffle(ids) : ids));
  });

  const choiceOrder: Record<string, string[]> = {};
  flat.forEach((q) => {
    // Never shuffle error-identification choices where order matters (rarely)
    choiceOrder[q.id] = randomizeChoices ? shuffle(q.choices) : [...q.choices];
  });

  return {
    examId,
    order: orderIds,
    choiceOrder,
    answers: {},
    marked: {},
    currentIndex: 0,
    startedAt: Date.now(),
    durationSec: exam.duration * 60,
    submitted: false,
  };
}

export function computeResult(
  exam: Exam,
  progress: ExamProgress,
  timeUsedSec: number,
): ExamResult {
  const flat = flattenExam(exam);
  const byId = new Map(flat.map((q) => [q.id, q]));

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let earned = 0;
  let total = 0;

  const bySection: Record<string, { correct: number; total: number; title: string }> = {};
  const byTopic: Record<string, { correct: number; total: number }> = {};
  const byType: Record<string, { correct: number; total: number }> = {};
  const perQuestion: ExamResult["perQuestion"] = [];

  for (const q of flat) {
    total += q.points;
    const secKey = q.sectionTitle;
    bySection[secKey] ??= { correct: 0, total: 0, title: secKey };
    byTopic[q.topic] ??= { correct: 0, total: 0 };
    byType[q.type] ??= { correct: 0, total: 0 };
    bySection[secKey].total += 1;
    byTopic[q.topic].total += 1;
    byType[q.type].total += 1;

    const userAns = progress.answers[q.id] ?? null;
    if (!userAns) {
      skipped += 1;
      perQuestion.push({ id: q.id, correct: false, userAnswer: null, correctAnswer: q.answer });
      continue;
    }
    const isCorrect = userAns === q.answer;
    if (isCorrect) {
      correct += 1;
      earned += q.points;
      bySection[secKey].correct += 1;
      byTopic[q.topic].correct += 1;
      byType[q.type].correct += 1;
    } else {
      wrong += 1;
    }
    perQuestion.push({ id: q.id, correct: isCorrect, userAnswer: userAns, correctAnswer: q.answer });
  }

  return {
    examId: exam.id,
    submittedAt: Date.now(),
    timeUsedSec,
    totalPoints: total,
    earnedPoints: earned,
    correct,
    wrong,
    skipped,
    bySection: Object.values(bySection).map((s) => ({ title: s.title, correct: s.correct, total: s.total })),
    byTopic: Object.entries(byTopic).map(([topic, v]) => ({ topic, ...v })),
    byType: Object.entries(byType).map(([type, v]) => ({ type, ...v })),
    perQuestion,
  };
}

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

export function questionByOrderIndex(
  exam: Exam,
  progress: ExamProgress,
  idx: number,
): FlatQuestion | null {
  const flat = flattenExam(exam);
  const id = progress.order[idx];
  return flat.find((q) => q.id === id) ?? null;
}
