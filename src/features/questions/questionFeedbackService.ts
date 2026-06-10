import type { QuestionFeedbackSubmission } from "./questionFeedbackTypes";

export type QuestionFeedbackResponse = {
  ok: boolean;
  id?: number;
  status?: string;
};

export async function submitQuestionFeedback(
  submission: QuestionFeedbackSubmission
): Promise<QuestionFeedbackResponse> {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(submission)
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const errorMessage =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Could not submit feedback.";
    throw new Error(errorMessage);
  }

  return body as QuestionFeedbackResponse;
}
