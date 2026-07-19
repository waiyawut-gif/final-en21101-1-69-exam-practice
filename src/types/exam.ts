export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType =
  | "multiple-choice"
  | "reading-comprehension"
  | "grammar-in-context"
  | "error-identification"
  | "vocabulary";

export interface Passage {
  id: string;
  title: string;
  passage: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  topic: string;
  difficulty: Difficulty;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  passageId?: string | null;
  points: number;
}

export interface Section {
  title: string;
  part?: string;
  instructions?: string;
  passages?: Passage[];
  questions: Question[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  totalQuestions: number;
  difficulty: string;
  sections: Section[];
}

export interface ExamManifestEntry {
  id: string;
  file: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  difficulty: string;
}

/** In-memory / persisted flat question with numbering + section metadata */
export interface FlatQuestion extends Question {
  number: number;
  sectionIndex: number;
  sectionTitle: string;
  sectionPart?: string;
  passage?: Passage | null;
}

/** Persisted exam progress */
export interface ExamProgress {
  examId: string;
  order: string[]; // question ids in play order
  choiceOrder: Record<string, string[]>;
  answers: Record<string, string>;
  marked: Record<string, boolean>;
  currentIndex: number;
  startedAt: number;
  durationSec: number;
  submitted: boolean;
}

export interface ExamResult {
  examId: string;
  submittedAt: number;
  timeUsedSec: number;
  totalPoints: number;
  earnedPoints: number;
  correct: number;
  wrong: number;
  skipped: number;
  bySection: { title: string; correct: number; total: number }[];
  byTopic: { topic: string; correct: number; total: number }[];
  byType: { type: string; correct: number; total: number }[];
  perQuestion: {
    id: string;
    correct: boolean;
    userAnswer: string | null;
    correctAnswer: string;
  }[];
}
