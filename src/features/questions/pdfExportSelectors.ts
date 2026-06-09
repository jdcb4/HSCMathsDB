import { getDisplaySyllabusNodesForQuestion, type SyllabusEraView } from "../../domain/hscSelectors";
import type { HscDatabase, SyllabusConversion, WorkedSolution } from "../../domain/hscSchemas";
import type { PdfExportQuestion } from "./pdfExportTypes";

export function buildPdfExportQuestions({
  database,
  questionIds,
  orderedQuestions,
  syllabusEra,
  syllabusConversion,
  workedSolutionsByQuestionId
}: {
  database: HscDatabase;
  questionIds: Set<string>;
  orderedQuestions: HscDatabase["questions"];
  syllabusEra: SyllabusEraView;
  syllabusConversion: SyllabusConversion;
  workedSolutionsByQuestionId: Record<string, WorkedSolution | null>;
}): PdfExportQuestion[] {
  const papersById = new Map(database.papers.map((paper) => [paper.id, paper]));

  return orderedQuestions
    .filter((question) => questionIds.has(question.id))
    .map((question) => ({
      question,
      paper: papersById.get(question.paperId),
      syllabusNodes: getDisplaySyllabusNodesForQuestion(database, question, syllabusEra, syllabusConversion),
      workedSolution: workedSolutionsByQuestionId[question.id] ?? undefined
    }));
}
