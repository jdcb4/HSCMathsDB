import { Download } from "lucide-react";
import type { Question } from "../../domain/hscSchemas";

export function QuestionList({
  questions,
  selectedQuestionId,
  selectedExportQuestionIds,
  syllabusSummariesByQuestionId,
  onSelectQuestion,
  onToggleExportQuestion,
  onToggleVisibleExportQuestions,
  onClearExportSelection,
  onOpenPdfExport
}: {
  questions: Question[];
  selectedQuestionId: string;
  selectedExportQuestionIds: Set<string>;
  syllabusSummariesByQuestionId: Record<string, string>;
  onSelectQuestion: (questionId: string) => void;
  onToggleExportQuestion: (questionId: string) => void;
  onToggleVisibleExportQuestions: () => void;
  onClearExportSelection: () => void;
  onOpenPdfExport: () => void;
}) {
  const allVisibleSelected =
    questions.length > 0 && questions.every((question) => selectedExportQuestionIds.has(question.id));

  return (
    <details className="rounded-md border border-border-default bg-surface-raised">
      <summary className="cursor-pointer border-b border-border-subtle px-3 py-2 sm:px-4 sm:py-3">
        <span className="block text-h4 font-semibold">{questions.length} questions</span>
        <span className="mt-1 block text-body-sm text-text-secondary">
          Select from here, or use the Previous and Next buttons to move through questions.
        </span>
      </summary>
      <div className="border-b border-border-subtle bg-surface-sunken p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleVisibleExportQuestions}
            disabled={questions.length === 0}
            className="inline-flex min-h-9 items-center rounded-md border border-border-default px-3 py-1.5 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>
          <button
            type="button"
            onClick={onClearExportSelection}
            disabled={selectedExportQuestionIds.size === 0}
            className="inline-flex min-h-9 items-center rounded-md border border-border-default px-3 py-1.5 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onOpenPdfExport}
            disabled={selectedExportQuestionIds.size === 0}
            className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-md border border-accent-primary bg-accent-primary px-3 py-1.5 text-body-sm font-semibold text-text-on-accent disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Download size={15} />
            Export PDF
          </button>
        </div>
        <p className="mt-2 text-caption text-text-secondary">
          {selectedExportQuestionIds.size} selected for export
        </p>
      </div>
      <div className="max-h-56 overflow-y-auto sm:max-h-72 lg:max-h-[calc(100dvh-245px)]">
        {questions.map((question) => {
          const selected = question.id === selectedQuestionId;
          const selectedForExport = selectedExportQuestionIds.has(question.id);

          return (
            <div
              key={question.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-border-subtle px-3 py-2 last:border-b-0 sm:px-4 sm:py-3 ${
                selected ? "bg-surface-sunken" : "hover:bg-surface-sunken"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedForExport}
                onChange={() => onToggleExportQuestion(question.id)}
                className="mt-1 h-4 w-4 accent-accent-primary"
                aria-label={`Select ${question.year} ${question.questionNumber} ${question.title} for PDF export`}
              />
              <button
                type="button"
                onClick={() => onSelectQuestion(question.id)}
                className="min-w-0 text-left"
              >
                <div className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
                  <span>{question.year}</span>
                  <span>{question.questionNumber}</span>
                  <span>{question.marks} marks</span>
                </div>
                <p className="mt-1 overflow-hidden text-body-sm font-semibold text-text-primary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {question.title}
                </p>
                <p className="mt-1 hidden text-caption text-text-secondary sm:block">
                  {syllabusSummariesByQuestionId[question.id] ?? `${question.topic} / ${question.subtopic}`}
                </p>
              </button>
            </div>
          );
        })}
        {questions.length === 0 ? (
          <p className="px-4 py-6 text-body-sm text-text-secondary">No matches.</p>
        ) : null}
      </div>
    </details>
  );
}
