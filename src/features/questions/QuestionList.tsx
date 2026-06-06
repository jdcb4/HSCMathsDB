import type { Question } from "../../domain/hscSchemas";

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion
}: {
  questions: Question[];
  selectedQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
}) {
  return (
    <div className="rounded-md border border-border-default bg-surface-raised">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-h4 font-semibold">{questions.length} questions</h2>
      </div>
      <div className="max-h-[calc(100dvh-285px)] overflow-y-auto">
        {questions.map((question) => {
          const selected = question.id === selectedQuestionId;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelectQuestion(question.id)}
              className={`block w-full border-b border-border-subtle px-4 py-3 text-left last:border-b-0 ${
                selected ? "bg-surface-sunken" : "hover:bg-surface-sunken"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
                <span>{question.year}</span>
                <span>{question.questionNumber}</span>
                <span>{question.marks} marks</span>
              </div>
              <p className="mt-1 text-body-sm font-semibold text-text-primary">{question.title}</p>
              <p className="mt-1 text-caption text-text-secondary">
                {question.topic} / {question.subtopic}
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
