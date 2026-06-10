import { Send, X } from "lucide-react";
import { useState } from "react";
import type { Paper, Question } from "../../domain/hscSchemas";
import { submitQuestionFeedback } from "./questionFeedbackService";
import {
  buildQuestionFeedbackSubmission,
  feedbackIssueCategories,
  type FeedbackIssueCategory
} from "./questionFeedbackTypes";

type FeedbackStatus = "idle" | "submitting" | "submitted" | "error";

export function QuestionFeedbackDialog({
  open,
  question,
  paper,
  appVersion,
  onClose
}: {
  open: boolean;
  question: Question;
  paper?: Paper;
  appVersion: string;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<FeedbackIssueCategory>("worked-solution");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) {
    return null;
  }

  const canSubmit = status !== "submitting" && message.trim().length >= 8;
  const closeDialog = () => {
    setCategory("worked-solution");
    setMessage("");
    setContactEmail("");
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      await submitQuestionFeedback(
        buildQuestionFeedbackSubmission({
          question,
          paper,
          category,
          message: message.trim(),
          contactEmail: contactEmail.trim() || undefined,
          appVersion
        })
      );
      setStatus("submitted");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not submit feedback.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-surface-base/80 backdrop-blur-sm" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-feedback-title"
        className="fixed inset-x-3 top-4 z-50 mx-auto max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-md border border-border-default bg-surface-overlay shadow-focus"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-subtle p-4">
          <div>
            <p className="text-caption font-semibold uppercase text-accent-info">Question feedback</p>
            <h2 id="question-feedback-title" className="mt-1 text-h2 font-semibold">
              Report an issue
            </h2>
            <p className="mt-2 text-body-sm text-text-secondary">
              {question.year} {paper?.courseName ?? "Mathematics"} {question.questionNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
            aria-label="Close feedback form"
          >
            <X size={18} />
          </button>
        </header>

        {status === "submitted" ? (
          <div className="p-4">
            <div className="rounded-md border border-accent-success bg-surface-sunken p-4">
              <h3 className="text-h4 font-semibold">Feedback submitted</h3>
              <p className="mt-2 text-body-sm text-text-secondary">
                Thanks. This report has been saved for review.
              </p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="mt-4 inline-flex min-h-10 items-center rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submitFeedback} className="space-y-4 p-4">
            <label className="block text-body-sm font-medium text-text-primary">
              Issue type
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as FeedbackIssueCategory)}
                className="mt-2 w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary outline-none focus:shadow-focus"
              >
                {feedbackIssueCategories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-body-sm font-medium text-text-primary">
              What needs fixing?
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={1200}
                rows={6}
                className="mt-2 w-full resize-y rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary outline-none focus:shadow-focus"
                placeholder="Describe the issue with this question, answer, worked solution, diagram, or syllabus link."
                required
              />
              <span className="mt-1 block text-caption text-text-subtle">
                {message.trim().length < 8
                  ? "At least 8 characters."
                  : `${1200 - message.length} characters left.`}
              </span>
            </label>

            <label className="block text-body-sm font-medium text-text-primary">
              Contact email
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                maxLength={254}
                className="mt-2 w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary outline-none focus:shadow-focus"
                placeholder="Optional"
              />
            </label>

            {status === "error" ? (
              <p className="rounded-md border border-accent-danger bg-surface-sunken p-3 text-body-sm text-text-secondary">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex min-h-10 items-center rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-accent-primary bg-accent-primary px-3 py-2 text-body-sm font-semibold text-text-on-accent disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Send size={16} />
                {status === "submitting" ? "Submitting" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
