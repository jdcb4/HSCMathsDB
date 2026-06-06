import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MathText } from "../math/MathText";

type ExplanationContent = {
  needsReview: boolean;
  reviewNote: string;
  summaryLatex: string;
  approachLatex: string;
  steps: Array<{
    title: string;
    bodyLatex: string;
  }>;
  finalAnswerLatex: string;
  commonMistakesLatex: string[];
  checkLatex?: string;
};

type SampleExplanation =
  | {
      model: string;
      status: "ok";
      generatedAt: string;
      promptVersion: string;
      sourceQuestionHash: string;
      latencyMs: number;
      rawPath: string;
      content: ExplanationContent;
    }
  | {
      model: string;
      status: "error";
      generatedAt: string;
      promptVersion: string;
      sourceQuestionHash: string;
      latencyMs: number;
      rawPath?: string;
      error: string;
    };

type SampleQuestion = {
  question: {
    id: string;
    year: number;
    courseName: string;
    questionNumber: string;
    marks: number;
    style: string;
    topic: string;
    subtopic: string;
    promptLatex: string;
    answerLatex: string;
    workingLatex: string[];
    syllabus: Array<{
      code: string;
      title: string;
      content: string;
    }>;
    assets: Array<{
      label: string;
      alt: string;
    }>;
  };
  explanations: SampleExplanation[];
};

type SampleData = {
  generatedAt: string;
  promptVersion: string;
  models: string[];
  samples: SampleQuestion[];
};

export function LlmExplanationReview() {
  const [data, setData] = useState<SampleData | null>(null);
  const [error, setError] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/__dev/llm-explanation-samples", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Could not load sample data (${response.status}).`);
        }

        const nextData = (await response.json()) as SampleData;

        if (!cancelled) {
          setData(nextData);
          setSelectedQuestionId((current) => current || nextData.samples[0]?.question.id || "");
          setSelectedModel((current) => current || nextData.models[0] || "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSample = useMemo(
    () => data?.samples.find((sample) => sample.question.id === selectedQuestionId) ?? data?.samples[0],
    [data, selectedQuestionId]
  );

  const selectedExplanation = useMemo(
    () => selectedSample?.explanations.find((explanation) => explanation.model === selectedModel),
    [selectedModel, selectedSample]
  );

  const modelCounts = useMemo(() => {
    const counts = new Map<string, { ok: number; error: number; totalLatencyMs: number }>();

    data?.models.forEach((model) => counts.set(model, { ok: 0, error: 0, totalLatencyMs: 0 }));
    data?.samples.forEach((sample) => {
      sample.explanations.forEach((explanation) => {
        const count = counts.get(explanation.model) ?? { ok: 0, error: 0, totalLatencyMs: 0 };
        count[explanation.status] += 1;
        if (explanation.status === "ok") {
          count.totalLatencyMs += explanation.latencyMs;
        }
        counts.set(explanation.model, count);
      });
    });

    return counts;
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-md border border-border-default bg-surface-raised p-5 text-body text-text-secondary">
        Loading explanation samples...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-3 rounded-md border border-border-default bg-surface-raised p-5">
        <div className="flex items-center gap-2 text-accent-warning">
          <AlertTriangle size={18} />
          <h2 className="text-h3 font-semibold">Explanation samples unavailable</h2>
        </div>
        <p className="text-body-sm text-text-secondary">{error || "No sample data was returned."}</p>
        <p className="text-body-sm text-text-secondary">
          Run{" "}
          <code className="rounded-sm bg-surface-sunken px-1 text-text-primary">
            pnpm run data:generate-explanation-samples
          </code>{" "}
          and keep the Vite dev server running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-border-default bg-surface-raised p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-caption font-semibold uppercase text-accent-info">Dev-only review</p>
            <h2 className="text-h2 font-semibold">LLM worked solution samples</h2>
            <p className="mt-2 max-w-3xl text-body-sm text-text-secondary">
              {data.samples.length} questions, {data.models.length} models, prompt {data.promptVersion}.
              Generated {new Date(data.generatedAt).toLocaleString()}.
            </p>
          </div>
          <a
            href="/__dev/llm-explanation-samples"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
          >
            <RefreshCw size={16} />
            Raw JSON
          </a>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {data.models.map((model) => {
            const counts = modelCounts.get(model) ?? { ok: 0, error: 0, totalLatencyMs: 0 };
            const averageSeconds =
              counts.ok > 0 ? Math.round((counts.totalLatencyMs / counts.ok / 1000) * 10) / 10 : 0;

            return (
              <button
                key={model}
                type="button"
                onClick={() => setSelectedModel(model)}
                className={`rounded-md border p-3 text-left ${
                  selectedModel === model
                    ? "border-accent-info bg-surface-sunken"
                    : "border-border-default bg-surface-raised hover:border-border-strong"
                }`}
              >
                <p className="break-words text-body-sm font-semibold">{model}</p>
                <p className="mt-1 text-caption text-text-secondary">
                  {counts.ok} generated, {counts.error} failed
                </p>
                <p className="mt-1 text-caption text-text-secondary">Avg {averageSeconds}s per response</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-md border border-border-default bg-surface-raised p-3">
          <h3 className="px-2 pb-2 text-h4 font-semibold">Sample questions</h3>
          <div className="space-y-2">
            {data.samples.map((sample) => (
              <button
                key={sample.question.id}
                type="button"
                onClick={() => setSelectedQuestionId(sample.question.id)}
                className={`w-full rounded-md border p-3 text-left ${
                  selectedSample?.question.id === sample.question.id
                    ? "border-accent-info bg-surface-sunken"
                    : "border-border-subtle bg-surface-raised hover:border-border-strong"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
                  <span>{sample.question.year}</span>
                  <span>{sample.question.questionNumber}</span>
                  <span>{sample.question.marks} marks</span>
                </div>
                <p className="mt-1 text-body-sm font-semibold">{sample.question.topic}</p>
                <p className="text-caption text-text-secondary">{sample.question.subtopic}</p>
              </button>
            ))}
          </div>
        </aside>

        {selectedSample ? (
          <main className="space-y-4">
            <section className="rounded-md border border-border-default bg-surface-raised p-5">
              <div className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
                <span>{selectedSample.question.year}</span>
                <span>{selectedSample.question.courseName}</span>
                <span>{selectedSample.question.questionNumber}</span>
                <span>{selectedSample.question.style}</span>
              </div>
              <h3 className="mt-2 text-h3 font-semibold">{selectedSample.question.topic}</h3>
              <div className="mt-4 rounded-md border border-border-subtle bg-surface-sunken p-4">
                <MathText block>{selectedSample.question.promptLatex}</MathText>
              </div>
              {selectedSample.question.assets.length > 0 ? (
                <div className="mt-3 space-y-2 text-body-sm text-text-secondary">
                  {selectedSample.question.assets.map((asset) => (
                    <p key={`${selectedSample.question.id}-${asset.label}`}>
                      <span className="font-medium text-text-primary">{asset.label}:</span> {asset.alt}
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 rounded-md border border-border-subtle bg-surface-sunken p-4">
                <h4 className="mb-2 text-h4 font-semibold">Stored answer</h4>
                <MathText block>{selectedSample.question.answerLatex}</MathText>
              </div>
            </section>

            <section className="rounded-md border border-border-default bg-surface-raised p-5">
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-caption font-semibold uppercase text-accent-info">Model output</p>
                  <h3 className="break-words text-h3 font-semibold">{selectedModel}</h3>
                </div>
                {selectedExplanation ? <StatusPill explanation={selectedExplanation} /> : null}
              </div>
              {selectedExplanation ? <ExplanationOutput explanation={selectedExplanation} /> : null}
            </section>
          </main>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({ explanation }: { explanation: SampleExplanation }) {
  if (explanation.status === "error") {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-accent-danger px-3 py-1 text-caption font-medium text-accent-danger">
        <XCircle size={14} />
        Failed
      </span>
    );
  }

  if (explanation.content.needsReview) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-accent-warning px-3 py-1 text-caption font-medium text-accent-warning">
        <AlertTriangle size={14} />
        Needs review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-accent-success px-3 py-1 text-caption font-medium text-accent-success">
      <CheckCircle2 size={14} />
      Generated
    </span>
  );
}

function ExplanationOutput({ explanation }: { explanation: SampleExplanation }) {
  if (explanation.status === "error") {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-sunken p-4 text-body-sm text-text-secondary">
        {explanation.error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {explanation.content.needsReview ? (
        <div className="rounded-md border border-accent-warning bg-surface-sunken p-4 text-body-sm text-text-secondary">
          {explanation.content.reviewNote}
        </div>
      ) : null}
      <Panel title="Summary">
        <MathText block>{explanation.content.summaryLatex}</MathText>
      </Panel>
      <Panel title="How to think about it">
        <MathText block>{explanation.content.approachLatex}</MathText>
      </Panel>
      <Panel title="Worked steps">
        <ol className="space-y-3">
          {explanation.content.steps.map((step, index) => (
            <li
              key={`${explanation.model}-step-${index}`}
              className="rounded-md border border-border-subtle p-3"
            >
              <p className="mb-2 text-body-sm font-semibold">{step.title}</p>
              <MathText block>{step.bodyLatex}</MathText>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Final answer">
        <MathText block>{explanation.content.finalAnswerLatex}</MathText>
      </Panel>
      {explanation.content.commonMistakesLatex.length > 0 ? (
        <Panel title="Common mistakes">
          <ul className="space-y-2">
            {explanation.content.commonMistakesLatex.map((mistake, index) => (
              <li key={`${explanation.model}-mistake-${index}`} className="text-body-sm text-text-secondary">
                <MathText block>{mistake}</MathText>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {explanation.content.checkLatex ? (
        <Panel title="Quick check">
          <MathText block>{explanation.content.checkLatex}</MathText>
        </Panel>
      ) : null}
      <p className="text-caption text-text-subtle">
        Latency: {Math.round(explanation.latencyMs / 100) / 10}s
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-sunken p-4 text-body text-text-primary">
      <h4 className="mb-2 text-h4 font-semibold">{title}</h4>
      {children}
    </div>
  );
}
