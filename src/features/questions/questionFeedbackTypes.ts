import type { Paper, Question } from "../../domain/hscSchemas";

export const feedbackIssueCategories = [
  { id: "question-text", label: "Question text" },
  { id: "answer", label: "Answer" },
  { id: "worked-solution", label: "Worked solution" },
  { id: "diagram", label: "Diagram" },
  { id: "syllabus-link", label: "Syllabus link" },
  { id: "other", label: "Other" }
] as const;

export type FeedbackIssueCategory = (typeof feedbackIssueCategories)[number]["id"];

export type QuestionFeedbackSubmission = {
  questionId: string;
  paperId: string;
  courseName: string;
  year: number;
  questionNumber: string;
  category: FeedbackIssueCategory;
  message: string;
  contactEmail?: string;
  pageUrl?: string;
  appVersion?: string;
};

export function buildQuestionFeedbackSubmission({
  question,
  paper,
  category,
  message,
  contactEmail,
  appVersion
}: {
  question: Question;
  paper?: Paper;
  category: FeedbackIssueCategory;
  message: string;
  contactEmail?: string;
  appVersion: string;
}): QuestionFeedbackSubmission {
  return {
    questionId: question.id,
    paperId: question.paperId,
    courseName: paper?.courseName ?? "Mathematics",
    year: question.year,
    questionNumber: question.questionNumber,
    category,
    message,
    contactEmail,
    pageUrl: typeof window === "undefined" ? undefined : window.location.href,
    appVersion
  };
}
