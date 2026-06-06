import { ExternalLink, Image as ImageIcon } from "lucide-react";
import type { Paper, Question, SyllabusNode } from "../../domain/hscSchemas";
import { MathText } from "../math/MathText";

export function QuestionDetail({
  question,
  paper,
  syllabusNodes,
  onOpenSyllabusNode
}: {
  question: Question;
  paper?: Paper;
  syllabusNodes: SyllabusNode[];
  onOpenSyllabusNode: (nodeId: string) => void;
}) {
  return (
    <article className="space-y-4 rounded-md border border-border-default bg-surface-raised p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-caption font-medium text-text-subtle">
            <span>{question.year}</span>
            <span>{paper?.courseName ?? "Mathematics Advanced"}</span>
            <span>{question.questionNumber}</span>
            <span>{question.marks} marks</span>
            <span>{question.style}</span>
          </div>
          <h2 className="mt-2 text-h2 font-semibold">{question.title}</h2>
        </div>
        <a
          href={question.source.examPackUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
        >
          <ExternalLink size={16} />
          Exam pack
        </a>
      </div>

      <section className="rounded-md border border-border-subtle bg-surface-sunken p-4">
        <h3 className="mb-3 text-h4 font-semibold">Question</h3>
        <div className="text-body text-text-primary">
          <MathText block>{question.promptLatex}</MathText>
        </div>
        {question.assets.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {question.assets.map((asset) => (
              <figure
                key={asset.id}
                className="rounded-md border border-border-default bg-surface-raised p-3"
              >
                <img src={asset.path} alt={asset.alt} className="h-auto w-full rounded-sm" />
                <figcaption className="mt-2 flex items-center gap-2 text-caption text-text-secondary">
                  <ImageIcon size={14} />
                  {asset.label}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-md border border-border-subtle bg-surface-sunken p-4">
          <h3 className="mb-3 text-h4 font-semibold">Answer</h3>
          <div className="text-body text-text-primary">
            <MathText block>{question.answerLatex}</MathText>
          </div>
          {question.workingLatex.length > 0 ? (
            <ol className="mt-4 space-y-2 text-body-sm text-text-secondary">
              {question.workingLatex.map((step, index) => (
                <li
                  key={`${question.id}-step-${index}`}
                  className="rounded-md border border-border-subtle bg-surface-raised p-3"
                >
                  <MathText block>{step}</MathText>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <div className="rounded-md border border-border-subtle bg-surface-sunken p-4">
          <h3 className="mb-3 text-h4 font-semibold">Syllabus links</h3>
          <div className="space-y-2">
            {syllabusNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onOpenSyllabusNode(node.id)}
                className="w-full rounded-md border border-border-default bg-surface-raised p-3 text-left hover:border-accent-info"
              >
                <p className="text-caption font-semibold uppercase text-accent-info">{node.code}</p>
                <p className="text-body-sm font-medium">{node.title}</p>
                <p className="mt-1 text-caption text-text-secondary">{node.topic}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
        <span>Transcription: {question.source.transcriptionStatus}</span>
        {question.source.pageRef ? <span>Paper: {question.source.pageRef}</span> : null}
        {question.source.markingGuideRef ? <span>Guide: {question.source.markingGuideRef}</span> : null}
      </footer>
    </article>
  );
}
