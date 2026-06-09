import type { Paper, Question, SyllabusNode, WorkedSolution } from "../../domain/hscSchemas";

export type PdfExportAnswerMode = "inline" | "booklet";

export type PdfExportOptions = {
  includeAnswer: boolean;
  includeWorkedSolution: boolean;
  includeSyllabusLinks: boolean;
  answerMode: PdfExportAnswerMode;
};

export type PdfExportQuestion = {
  question: Question;
  paper?: Paper;
  syllabusNodes: SyllabusNode[];
  workedSolution?: WorkedSolution;
};

export const defaultPdfExportOptions: PdfExportOptions = {
  includeAnswer: true,
  includeWorkedSolution: true,
  includeSyllabusLinks: true,
  answerMode: "booklet"
};
