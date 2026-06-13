import { FileText, Printer, X } from "lucide-react";
import { MathText } from "../math/MathText";
import { resolvePublicAssetPath, resolvePublicWebpAssetPath } from "./questionAssetPaths";
import type { PdfExportOptions, PdfExportQuestion } from "./pdfExportTypes";

export function PdfExportPanel({
  open,
  exportQuestions,
  options,
  workedSolutionsLoading,
  onOptionsChange,
  onClose,
  onPrint
}: {
  open: boolean;
  exportQuestions: PdfExportQuestion[];
  options: PdfExportOptions;
  workedSolutionsLoading: boolean;
  onOptionsChange: (options: PdfExportOptions) => void;
  onClose: () => void;
  onPrint: () => void;
}) {
  if (!open) {
    return null;
  }

  const optionalComponentsSelected =
    options.includeAnswer || options.includeWorkedSolution || options.includeSyllabusLinks;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-surface-base/80 backdrop-blur-sm print:hidden" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-export-title"
        className="fixed inset-x-3 top-3 z-50 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-md border border-border-default bg-surface-overlay shadow-focus print:hidden sm:inset-x-5 sm:top-5 lg:inset-x-8"
      >
        <header className="flex flex-col gap-3 border-b border-border-subtle p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-caption font-semibold uppercase text-accent-info">PDF export</p>
            <h2 id="pdf-export-title" className="mt-1 text-h2 font-semibold">
              Export selected questions
            </h2>
            <p className="mt-2 text-body-sm text-text-secondary">
              {exportQuestions.length} question{exportQuestions.length === 1 ? "" : "s"} selected. Use your
              browser's print dialog and choose Save as PDF.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              disabled={exportQuestions.length === 0 || workedSolutionsLoading}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-accent-primary bg-accent-primary px-3 py-2 text-body-sm font-semibold text-text-on-accent disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Printer size={16} />
              {workedSolutionsLoading ? "Loading solutions" : "Print / Save PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
              aria-label="Close PDF export"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="border-b border-border-subtle p-4 lg:border-b-0 lg:border-r">
            <div className="space-y-4">
              <section>
                <h3 className="text-h4 font-semibold">Components</h3>
                <div className="mt-3 space-y-2">
                  <PdfExportCheckbox checked disabled label="Question" hint="Mandatory" />
                  <PdfExportCheckbox
                    checked={options.includeAnswer}
                    label="Answer"
                    onChange={(checked) => onOptionsChange({ ...options, includeAnswer: checked })}
                  />
                  <PdfExportCheckbox
                    checked={options.includeWorkedSolution}
                    label="Worked solution"
                    onChange={(checked) => onOptionsChange({ ...options, includeWorkedSolution: checked })}
                  />
                  <PdfExportCheckbox
                    checked={options.includeSyllabusLinks}
                    label="Syllabus links"
                    onChange={(checked) => onOptionsChange({ ...options, includeSyllabusLinks: checked })}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-h4 font-semibold">Answer placement</h3>
                <div className="mt-3 grid grid-cols-2 rounded-md border border-border-default bg-surface-sunken p-1">
                  <PdfExportModeButton
                    active={options.answerMode === "inline"}
                    label="With questions"
                    disabled={!optionalComponentsSelected}
                    onClick={() => onOptionsChange({ ...options, answerMode: "inline" })}
                  />
                  <PdfExportModeButton
                    active={options.answerMode === "booklet"}
                    label="Booklet"
                    disabled={!optionalComponentsSelected}
                    onClick={() => onOptionsChange({ ...options, answerMode: "booklet" })}
                  />
                </div>
              </section>

              <section className="rounded-md border border-border-subtle bg-surface-sunken p-3">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="mt-0.5 shrink-0 text-accent-info" />
                  <p className="text-body-sm text-text-secondary">
                    Print styling keeps question, answer, worked-solution step, figure, and syllabus-link
                    blocks together when they fit on a page.
                  </p>
                </div>
              </section>
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto bg-surface-sunken p-4">
            <PdfExportDocument exportQuestions={exportQuestions} options={options} preview />
          </div>
        </div>
      </section>
      <PdfExportPrintMount exportQuestions={exportQuestions} options={options} />
    </>
  );
}

function PdfExportPrintMount({
  exportQuestions,
  options
}: {
  exportQuestions: PdfExportQuestion[];
  options: PdfExportOptions;
}) {
  if (exportQuestions.length === 0) {
    return null;
  }

  return (
    <div className="hidden print:block">
      <PdfExportDocument exportQuestions={exportQuestions} options={options} />
    </div>
  );
}

function PdfExportCheckbox({
  checked,
  disabled = false,
  label,
  hint,
  onChange
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  hint?: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body-sm">
      <span>
        <span className="font-medium text-text-primary">{label}</span>
        {hint ? <span className="ml-2 text-caption text-text-subtle">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 accent-accent-primary"
      />
    </label>
  );
}

function PdfExportModeButton({
  active,
  disabled,
  label,
  onClick
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-9 rounded-md px-2 text-body-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "bg-surface-raised text-text-primary shadow-focus" : "text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function PdfExportDocument({
  exportQuestions,
  options,
  preview = false
}: {
  exportQuestions: PdfExportQuestion[];
  options: PdfExportOptions;
  preview?: boolean;
}) {
  const optionalComponentsSelected =
    options.includeAnswer || options.includeWorkedSolution || options.includeSyllabusLinks;
  const inlineComponents = optionalComponentsSelected && options.answerMode === "inline";
  const bookletComponents = optionalComponentsSelected && options.answerMode === "booklet";

  return (
    <article className={preview ? "pdf-export-document pdf-export-preview" : "pdf-export-document"}>
      <PdfExportHeader
        title="Selected HSC mathematics questions"
        subtitle={`${exportQuestions.length} selected question${exportQuestions.length === 1 ? "" : "s"}`}
        modeLabel={inlineComponents ? "Q, A, Q, A" : bookletComponents ? "QQQ, AAA" : "Questions only"}
      />

      <section className="pdf-export-section">
        {bookletComponents ? (
          <div className="pdf-export-section-heading">
            <div>
              <p>Question booklet</p>
              <h2>Questions</h2>
            </div>
            <span>{exportQuestions.length} selected</span>
          </div>
        ) : null}
        {exportQuestions.map((item, index) => (
          <PdfQuestionCard
            key={item.question.id}
            item={item}
            index={index}
            options={options}
            includeOptionalComponents={inlineComponents}
          />
        ))}
      </section>

      {bookletComponents ? (
        <section className="pdf-export-section pdf-export-answer-booklet">
          <PdfExportHeader
            title="Answer booklet"
            subtitle="Answers use the same order and question numbering."
            modeLabel="AAA"
            compact
          />
          {exportQuestions.map((item, index) => (
            <PdfAnswerCard key={`${item.question.id}-answer`} item={item} index={index} options={options} />
          ))}
        </section>
      ) : null}
    </article>
  );
}

function PdfExportHeader({
  title,
  subtitle,
  modeLabel,
  compact = false
}: {
  title: string;
  subtitle: string;
  modeLabel: string;
  compact?: boolean;
}) {
  return (
    <header className={compact ? "pdf-export-header compact" : "pdf-export-header"}>
      <div>
        <p className="pdf-export-eyebrow">HSCMathsDB export</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <aside>{modeLabel}</aside>
    </header>
  );
}

function PdfQuestionCard({
  item,
  index,
  options,
  includeOptionalComponents
}: {
  item: PdfExportQuestion;
  index: number;
  options: PdfExportOptions;
  includeOptionalComponents: boolean;
}) {
  const { question, paper } = item;

  return (
    <section className="pdf-export-card">
      <header className="pdf-export-question-header">
        <div>
          <p className="pdf-export-eyebrow">Question {index + 1}</p>
          <h2>{question.title}</h2>
          <p>{formatQuestionMeta(item)}</p>
        </div>
        <strong>
          {question.marks}
          <span>{question.marks === 1 ? "mark" : "marks"}</span>
        </strong>
      </header>

      <PdfComponentBlock title="Question" className="pdf-export-question-block">
        <MathText block>{question.promptLatex}</MathText>
        <PdfQuestionAssets item={item} />
      </PdfComponentBlock>

      {includeOptionalComponents ? <PdfAnswerContent item={item} options={options} /> : null}

      <footer>
        <span>{paper?.courseName ?? "Mathematics"}</span>
        {question.source.pageRef ? <span>Paper: {question.source.pageRef}</span> : null}
        {question.source.markingGuideRef ? <span>Guide: {question.source.markingGuideRef}</span> : null}
      </footer>
    </section>
  );
}

function PdfAnswerCard({
  item,
  index,
  options
}: {
  item: PdfExportQuestion;
  index: number;
  options: PdfExportOptions;
}) {
  return (
    <section className="pdf-export-card pdf-export-answer-card">
      <header className="pdf-export-question-header compact">
        <div>
          <p className="pdf-export-eyebrow">Answer {index + 1}</p>
          <h2>
            {item.question.questionNumber} - {item.question.title}
          </h2>
          <p>{formatQuestionMeta(item)}</p>
        </div>
      </header>
      <PdfAnswerContent item={item} options={options} />
    </section>
  );
}

function PdfAnswerContent({ item, options }: { item: PdfExportQuestion; options: PdfExportOptions }) {
  return (
    <div className="pdf-export-answer-content">
      {options.includeAnswer ? (
        <PdfComponentBlock title="Answer" className="pdf-export-answer-block">
          <MathText block>{item.question.answerLatex}</MathText>
        </PdfComponentBlock>
      ) : null}
      {options.includeWorkedSolution ? <PdfWorkedSolution item={item} /> : null}
      {options.includeSyllabusLinks ? <PdfSyllabusLinks item={item} /> : null}
    </div>
  );
}

function PdfWorkedSolution({ item }: { item: PdfExportQuestion }) {
  const workedSolution = item.workedSolution;

  if (!workedSolution) {
    return (
      <PdfComponentBlock title="Worked solution">
        <p>No worked solution is available for this question.</p>
      </PdfComponentBlock>
    );
  }

  return (
    <PdfComponentBlock title="Worked solution">
      <MathText block>{workedSolution.summaryLatex}</MathText>
      <ol className="pdf-export-worked-steps">
        {workedSolution.steps.map((step, index) => (
          <li key={`${workedSolution.questionId}-step-${index}`}>
            <strong>
              Step {index + 1}: {step.title}
            </strong>
            <MathText block>{step.bodyLatex}</MathText>
          </li>
        ))}
      </ol>
      <div className="pdf-export-final-answer">
        <strong>Final answer</strong>
        <MathText block>{workedSolution.finalAnswerLatex}</MathText>
      </div>
    </PdfComponentBlock>
  );
}

function PdfSyllabusLinks({ item }: { item: PdfExportQuestion }) {
  return (
    <PdfComponentBlock title="Syllabus links">
      <div className="pdf-export-syllabus-grid">
        {item.syllabusNodes.map((node) => (
          <a key={node.id} href={node.sourceUrl} className="pdf-export-syllabus-link">
            <strong>{node.code}</strong>
            <span>{node.title}</span>
            <small>{node.topic}</small>
          </a>
        ))}
        {item.syllabusNodes.length === 0 ? <p>No mapped syllabus link.</p> : null}
      </div>
    </PdfComponentBlock>
  );
}

function PdfQuestionAssets({ item }: { item: PdfExportQuestion }) {
  const displayableAssets = item.question.assets.filter((asset) => asset.sourceStatus !== "pending");

  if (displayableAssets.length === 0) {
    return null;
  }

  return (
    <div className="pdf-export-asset-grid">
      {displayableAssets.map((asset) => {
        const webpPath = resolvePublicWebpAssetPath(asset.path);

        return (
          <figure key={asset.id}>
            <picture>
              {webpPath ? <source srcSet={webpPath} type="image/webp" /> : null}
              <img src={resolvePublicAssetPath(asset.path)} alt={asset.alt} />
            </picture>
            <figcaption>{asset.label}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function PdfComponentBlock({
  title,
  className = "",
  children
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`pdf-export-component ${className}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function formatQuestionMeta({ question, paper }: PdfExportQuestion) {
  return `${question.year} - ${paper?.courseName ?? "Mathematics"} - ${question.questionNumber} - ${
    question.marks
  } mark${question.marks === 1 ? "" : "s"} - ${question.style}`;
}
