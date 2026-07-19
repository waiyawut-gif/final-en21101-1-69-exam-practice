import type { ExamProgress, ExamResult } from "@/types/exam";

const isBrowser = typeof window !== "undefined";

const progressKey = (examId: string) => `exam-progress:${examId}`;
const resultKey = (examId: string) => `exam-result:${examId}`;

export function loadProgress(examId: string): ExamProgress | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(progressKey(examId));
    return raw ? (JSON.parse(raw) as ExamProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(p: ExamProgress): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(progressKey(p.examId), JSON.stringify(p));
  } catch {
    /* quota */
  }
}

export function clearProgress(examId: string): void {
  if (!isBrowser) return;
  localStorage.removeItem(progressKey(examId));
}

export function saveResult(r: ExamResult): void {
  if (!isBrowser) return;
  localStorage.setItem(resultKey(r.examId), JSON.stringify(r));
}

export function loadResult(examId: string): ExamResult | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(resultKey(examId));
    return raw ? (JSON.parse(raw) as ExamResult) : null;
  } catch {
    return null;
  }
}

/* --- theme --- */
export function getStoredTheme(): "dark" | "light" | null {
  if (!isBrowser) return null;
  const v = localStorage.getItem("theme");
  return v === "dark" || v === "light" ? v : null;
}
export function setStoredTheme(v: "dark" | "light") {
  if (!isBrowser) return;
  localStorage.setItem("theme", v);
}
