import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  HscDatabaseSchema,
  SyllabusConversionSchema,
  WorkedSolutionsDatabaseSchema
} from "../src/domain/hscSchemas";
import { validateSyllabusConversionAgainstDatabase } from "../src/services/hscDataValidation";

const sourceDataDir = "src/data";
const publicDataDir = "public/data";
const publicWorkedSolutionsDir = join(publicDataDir, "worked-solutions");

const database = HscDatabaseSchema.parse(readJson(join(sourceDataDir, "hsc-math-advanced.json")));
const syllabusConversion = validateSyllabusConversionAgainstDatabase(
  SyllabusConversionSchema.parse(readJson(join(sourceDataDir, "syllabus-conversion.json"))),
  database
);
const workedSolutionsDatabase = WorkedSolutionsDatabaseSchema.parse(
  readJson(join(sourceDataDir, "hsc-math-advanced-worked-solutions.json"))
);

const paperIdByQuestionId = new Map(database.questions.map((question) => [question.id, question.paperId]));
const workedSolutionsByPaper = new Map<string, typeof workedSolutionsDatabase.workedSolutions>();

workedSolutionsDatabase.workedSolutions.forEach((workedSolution) => {
  if (workedSolution.reviewStatus === "rejected") {
    return;
  }

  const paperId = paperIdByQuestionId.get(workedSolution.questionId);
  if (!paperId) {
    return;
  }

  const paperSolutions = workedSolutionsByPaper.get(paperId) ?? [];
  paperSolutions.push(workedSolution);
  workedSolutionsByPaper.set(paperId, paperSolutions);
});

rmSync(publicDataDir, { recursive: true, force: true });
mkdirSync(publicWorkedSolutionsDir, { recursive: true });

writeJson(join(publicDataDir, "hsc-math-advanced.json"), database);
writeJson(join(publicDataDir, "syllabus-conversion.json"), syllabusConversion);

const byPaper = Object.fromEntries(
  [...workedSolutionsByPaper.entries()]
    .sort(([leftPaperId], [rightPaperId]) => leftPaperId.localeCompare(rightPaperId))
    .map(([paperId, workedSolutions]) => {
      const path = `${paperId}.json`;
      writeJson(join(publicWorkedSolutionsDir, path), {
        meta: workedSolutionsDatabase.meta,
        workedSolutions
      });

      return [
        paperId,
        {
          paperId,
          count: workedSolutions.length,
          path
        }
      ];
    })
);

writeJson(join(publicWorkedSolutionsDir, "index.json"), {
  meta: workedSolutionsDatabase.meta,
  totalQuestions: database.questions.length,
  workedSolutionCount: workedSolutionsDatabase.workedSolutions.filter(
    (workedSolution) =>
      workedSolution.reviewStatus !== "rejected" && paperIdByQuestionId.has(workedSolution.questionId)
  ).length,
  byPaper
});

console.log(
  `Synced runtime data for ${database.questions.length} questions and ${Object.keys(byPaper).length} worked-solution paper files.`
);

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}
