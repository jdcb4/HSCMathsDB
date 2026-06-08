import type { Question } from "../../domain/hscSchemas";

export function QuestionList({
  questions,
  selectedQuestionId,
  syllabusSummariesByQuestionId,
  onSelectQuestion
}: {
  questions: Question[];
  selectedQuestionId: string;
  syllabusSummariesByQuestionId: Record<string, string>;
  onSelectQuestion: (questionId: string) => void;
}) {
  return (
    <div className="rounded-md border border-border-default bg-surface-raised">
      <div className="border-b border-border-subtle px-3 py-2 sm:px-4 sm:py-3">
        <h2 className="text-h4 font-semibold">{questions.length} questions</h2>
      </div>
      <div className="max-h-56 overflow-y-auto sm:max-h-72 lg:max-h-[calc(100dvh-245px)]">
        {questions.map((question) => {
          const selected = question.id === selectedQuestionId;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelectQuestion(question.id)}
              className={`block w-full border-b border-border-subtle px-3 py-2 text-left last:border-b-0 sm:px-4 sm:py-3 ${
                selected ? "bg-surface-sunken" : "hover:bg-surface-sunken"
              }`}
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
          );
        })}
        {questions.length === 0 ? (
          <p className="px-4 py-6 text-body-sm text-text-secondary">No matches.</p>
        ) : null}
      </div>
    </div>
  );
}
