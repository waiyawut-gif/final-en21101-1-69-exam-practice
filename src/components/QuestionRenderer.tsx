import { cn } from "@/lib/utils";
import type { FlatQuestion } from "@/types/exam";
import { Check } from "lucide-react";

interface Props {
  question: FlatQuestion;
  choices: string[];
  selected?: string;
  onSelect: (choice: string) => void;
  disabled?: boolean;
  correctAnswer?: string; // only shown in review mode
  reviewMode?: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionRenderer({
  question,
  choices,
  selected,
  onSelect,
  disabled,
  correctAnswer,
  reviewMode,
}: Props) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
          Question {question.number}
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
          {question.topic}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground capitalize">
          {question.difficulty}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground capitalize">
          {question.type.replace(/-/g, " ")}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line font-serif text-lg leading-relaxed text-foreground">
        {question.question}
      </p>

      <div className="mt-5 space-y-2.5">
        {choices.map((choice, i) => {
          const letter = LETTERS[i];
          const isSelected = selected === choice;
          const isCorrect = reviewMode && correctAnswer === choice;
          const isWrongPick = reviewMode && isSelected && choice !== correctAnswer;

          return (
            <button
              key={choice + i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(choice)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected && !reviewMode && "border-primary bg-primary/10",
                isCorrect && "border-green-500 bg-green-500/10",
                isWrongPick && "border-destructive bg-destructive/10",
                !isSelected && !isCorrect && !isWrongPick && "border-border bg-background",
                disabled && "cursor-not-allowed opacity-90",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                  isSelected && !reviewMode && "border-primary bg-primary text-primary-foreground",
                  isCorrect && "border-green-500 bg-green-500 text-white",
                  isWrongPick && "border-destructive bg-destructive text-white",
                  !isSelected && !isCorrect && !isWrongPick && "border-border text-muted-foreground group-hover:border-primary group-hover:text-primary",
                )}
              >
                {isCorrect ? <Check className="h-4 w-4" /> : letter}
              </span>
              <span className="flex-1 pt-0.5 font-serif text-[15px] text-foreground">
                {choice}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
