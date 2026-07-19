import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Home,
  ListChecks,
  RotateCcw,
  XCircle,
  MinusCircle,
  FileSearch,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Exam, ExamResult } from "@/types/exam";
import { formatTime } from "@/utils/exam-utils";
import { loadResult } from "@/utils/storage";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/result/$examId")({
  component: ResultPage,
});

async function fetchExam(examId: string): Promise<Exam> {
  const r = await fetch(`/exams/${examId}.json`);
  if (!r.ok) throw new Error("Failed to load exam");
  return r.json();
}

function ResultPage() {
  const { examId } = Route.useParams();
  const { data: exam } = useQuery({ queryKey: ["exam", examId], queryFn: () => fetchExam(examId) });
  const [result, setResult] = useState<ExamResult | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setResult(loadResult(examId));
    setReady(true);
  }, [examId]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-background" />;

  if (!result || !exam) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <p className="text-muted-foreground">No result found for this exam.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const total = exam.totalQuestions;
  const percent = total > 0 ? Math.round((result.correct / total) * 100) : 0;
  const passed = percent >= 60;

  const pieData = [
    { name: "Correct", value: result.correct, color: "hsl(142 71% 45%)" },
    { name: "Wrong", value: result.wrong, color: "hsl(0 84% 60%)" },
    { name: "Skipped", value: result.skipped, color: "hsl(220 9% 60%)" },
  ];

  const topicData = result.byTopic
    .map((t) => ({
      topic: t.topic,
      score: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      correct: t.correct,
      total: t.total,
    }))
    .sort((a, b) => b.score - a.score);

  const sectionData = result.bySection.map((s) => ({
    section: s.title.length > 22 ? s.title.slice(0, 20) + "…" : s.title,
    score: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    correct: s.correct,
    total: s.total,
  }));

  const weak = [...topicData].sort((a, b) => a.score - b.score).slice(0, 3);
  const strong = [...topicData].filter((t) => t.score >= 70).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <Home className="h-4 w-4" /> M.1 English Exam
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Score hero */}
        <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Award className="h-3.5 w-3.5" /> Examination Result
              </div>
              <h1 className="font-serif text-3xl font-bold sm:text-4xl">{exam.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted {new Date(result.submittedAt).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Score"
                value={`${result.correct}/${total}`}
                tone="primary"
              />
              <Stat
                label="Percentage"
                value={`${percent}%`}
                tone={passed ? "success" : "danger"}
              />
              <Stat
                label="Result"
                value={passed ? "PASS" : "FAIL"}
                tone={passed ? "success" : "danger"}
              />
              <Stat
                label="Time Used"
                value={formatTime(result.timeUsedSec)}
                tone="muted"
              />
            </div>
          </div>
        </section>

        {/* Breakdown cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <BreakdownCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="success"
            label="Correct"
            value={result.correct}
          />
          <BreakdownCard
            icon={<XCircle className="h-5 w-5" />}
            tone="danger"
            label="Wrong"
            value={result.wrong}
          />
          <BreakdownCard
            icon={<MinusCircle className="h-5 w-5" />}
            tone="muted"
            label="Skipped"
            value={result.skipped}
          />
        </section>

        {/* Charts */}
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Answer Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}: <b>{d.value}</b>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Performance by Section">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="section" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip
                  formatter={(v: number, _n, p) => [
                    `${v}% (${p.payload.correct}/${p.payload.total})`,
                    "Score",
                  ]}
                />
                <Bar dataKey="score" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="mt-4">
          <ChartCard title="Performance by Grammar Topic">
            <ResponsiveContainer width="100%" height={Math.max(240, topicData.length * 32)}>
              <BarChart data={topicData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} fontSize={11} />
                <YAxis dataKey="topic" type="category" fontSize={11} width={140} />
                <Tooltip
                  formatter={(v: number, _n, p) => [
                    `${v}% (${p.payload.correct}/${p.payload.total})`,
                    "Score",
                  ]}
                />
                <Bar dataKey="score" fill="var(--primary)" radius={[0, 6, 6, 0]}>
                  {topicData.map((d) => (
                    <Cell
                      key={d.topic}
                      fill={
                        d.score >= 70
                          ? "hsl(142 71% 45%)"
                          : d.score >= 40
                          ? "hsl(38 92% 50%)"
                          : "hsl(0 84% 60%)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Insights */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <InsightCard title="Strong Topics" tone="success" items={strong.map((t) => `${t.topic} — ${t.score}%`)} empty="Keep practising to build strong topics." />
          <InsightCard title="Topics to Improve" tone="warn" items={weak.map((t) => `${t.topic} — ${t.score}%`)} empty="You're doing well across all topics!" />
        </section>

        {/* Actions */}
        <section className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/review/$examId"
            params={{ examId }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <FileSearch className="h-4 w-4" /> Review Answers
          </Link>
          <Link
            to="/exam/$examId"
            params={{ examId }}
            onClick={() => {
              // clear previous progress before restarting
              try {
                localStorage.removeItem(`exam-progress:${examId}`);
              } catch {}
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" /> Retake Exam
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-accent"
          >
            <Home className="h-4 w-4" /> Back Home
          </Link>
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "danger" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-green-600 dark:text-green-400"
      : tone === "danger"
      ? "text-destructive"
      : tone === "muted"
      ? "text-muted-foreground"
      : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-serif text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function BreakdownCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "success" | "danger" | "muted";
}) {
  const cls =
    tone === "success"
      ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
      : tone === "danger"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-border bg-secondary text-muted-foreground";
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="rounded-xl bg-background/60 p-2">{icon}</div>
      <div>
        <div className="text-xs font-semibold uppercase">{label}</div>
        <div className="font-serif text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold">
        <ListChecks className="h-4 w-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function InsightCard({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "success" | "warn";
  items: string[];
  empty: string;
}) {
  const cls =
    tone === "success"
      ? "border-green-500/40 bg-green-500/5"
      : "border-amber-500/40 bg-amber-500/5";
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${cls}`}>
      <h4 className="mb-2 font-serif text-base font-bold">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
