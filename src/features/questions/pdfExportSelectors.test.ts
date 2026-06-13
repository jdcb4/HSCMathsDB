import { describe, expect, it } from "vitest";
import { database, syllabusConversion, workedSolutionsDatabase } from "../../services/hscDatabase";
import { getWorkedSolutionForQuestion } from "../../domain/hscSelectors";
import { buildPdfExportQuestions } from "./pdfExportSelectors";

describe("PDF export selectors", () => {
  it("builds selected export questions in visible question order", () => {
    const orderedQuestions = database.questions.filter((question) =>
      ["adv-2025-q02-exponential-graph", "adv-2025-q12-tangent-equation"].includes(question.id)
    );
    const questionIds = new Set(["adv-2025-q12-tangent-equation", "adv-2025-q02-exponential-graph"]);

    const exportQuestions = buildPdfExportQuestions({
      database,
      questionIds,
      orderedQuestions,
      syllabusEra: "advanced-2017",
      syllabusConversion,
      workedSolutionsByQuestionId: {}
    });

    expect(exportQuestions.map((item) => item.question.id)).toEqual(orderedQuestions.map((item) => item.id));
    expect(exportQuestions[0]?.paper?.courseName).toBe("Mathematics Advanced");
    expect(exportQuestions[0]?.syllabusNodes.map((node) => node.code)).toEqual(["MA-E1", "MA-F2"]);
  });

  it("attaches available worked solutions and tolerates missing ones", () => {
    const question = database.questions.find((candidate) => candidate.id === "adv-2025-q12-tangent-equation");
    expect(question).toBeDefined();
    const workedSolution = getWorkedSolutionForQuestion(workedSolutionsDatabase, question!.id);
    expect(workedSolution).toBeDefined();

    const exportQuestions = buildPdfExportQuestions({
      database,
      questionIds: new Set([question!.id]),
      orderedQuestions: [question!],
      syllabusEra: "advanced-2017",
      syllabusConversion,
      workedSolutionsByQuestionId: {
        [question!.id]: workedSolution!
      }
    });

    expect(exportQuestions[0]?.workedSolution?.questionId).toBe(question!.id);

    const withoutWorkedSolution = buildPdfExportQuestions({
      database,
      questionIds: new Set([question!.id]),
      orderedQuestions: [question!],
      syllabusEra: "advanced-2017",
      syllabusConversion,
      workedSolutionsByQuestionId: {
        [question!.id]: null
      }
    });

    expect(withoutWorkedSolution[0]?.workedSolution).toBeUndefined();
  });
});
