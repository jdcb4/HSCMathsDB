import type {
  HscDatabase,
  SyllabusConversion,
  WorkedSolution,
  WorkedSolutionsDatabase
} from "../domain/hscSchemas";
import { validateSyllabusConversionAgainstDatabase } from "./hscDataValidation";

export type WorkedSolutionCoverageSummary = {
  totalQuestions: number;
  workedSolutionCount: number;
  missingCount: number;
};

export type HscRuntimeData = {
  database: HscDatabase;
  syllabusConversion: SyllabusConversion;
  workedSolutionCoverage: WorkedSolutionCoverageSummary;
  loadWorkedSolution: (paperId: string, questionId: string) => Promise<WorkedSolution | undefined>;
};

const publicDataBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/data`;
const workedSolutionPaperCache = new Map<string, Promise<WorkedSolutionsDatabase>>();

export async function loadHscRuntimeData(): Promise<HscRuntimeData> {
  const [
    {
      HscDatabaseSchema,
      SyllabusConversionSchema,
      WorkedSolutionsDatabaseSchema,
      WorkedSolutionsIndexSchema
    },
    rawDatabase,
    rawSyllabusConversion,
    rawWorkedSolutionsIndex
  ] = await Promise.all([
    import("../domain/hscSchemas"),
    fetchRuntimeJson("hsc-math-advanced.json"),
    fetchRuntimeJson("syllabus-conversion.json"),
    fetchRuntimeJson("worked-solutions/index.json")
  ]);

  const database = HscDatabaseSchema.parse(rawDatabase);
  const syllabusConversion = validateSyllabusConversionAgainstDatabase(
    SyllabusConversionSchema.parse(rawSyllabusConversion),
    database
  );
  const workedSolutionsIndex = WorkedSolutionsIndexSchema.parse(rawWorkedSolutionsIndex);

  return {
    database,
    syllabusConversion,
    workedSolutionCoverage: {
      totalQuestions: database.questions.length,
      workedSolutionCount: workedSolutionsIndex.workedSolutionCount,
      missingCount: Math.max(0, database.questions.length - workedSolutionsIndex.workedSolutionCount)
    },
    loadWorkedSolution: async (paperId, questionId) => {
      const paperEntry = workedSolutionsIndex.byPaper[paperId];
      if (!paperEntry) {
        return undefined;
      }

      const paperDatabase = await loadWorkedSolutionsForPaper(paperEntry.path, WorkedSolutionsDatabaseSchema);

      return paperDatabase.workedSolutions.find(
        (workedSolution) =>
          workedSolution.questionId === questionId && workedSolution.reviewStatus !== "rejected"
      );
    }
  };
}

async function loadWorkedSolutionsForPaper(
  path: string,
  schema: typeof import("../domain/hscSchemas").WorkedSolutionsDatabaseSchema
): Promise<WorkedSolutionsDatabase> {
  const cached = workedSolutionPaperCache.get(path);
  if (cached) {
    return cached;
  }

  const promise = fetchRuntimeJson(`worked-solutions/${path}`).then((rawData) => schema.parse(rawData));
  workedSolutionPaperCache.set(path, promise);
  return promise;
}

async function fetchRuntimeJson(path: string): Promise<unknown> {
  const response = await fetch(`${publicDataBase}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
