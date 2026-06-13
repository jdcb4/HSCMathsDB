import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { HscDatabaseSchema, WorkedSolutionsDatabaseSchema } from "../src/domain/hscSchemas";
import type {
  HscDatabase,
  Paper,
  Question,
  SourcePack,
  WorkedSolutionsDatabase
} from "../src/domain/hscSchemas";

type ProcessedPaperFile = {
  sourcePacks: ProcessedSourcePack[];
  papers: ProcessedPaper[];
  questions: ProcessedQuestion[];
};

type ProcessedSourcePack = SourcePack & {
  collectionId: string;
  assets?: Array<{
    id: string;
    role: SourcePack["assets"][number]["role"];
    label: string;
    url?: string;
    status: SourcePack["assets"][number]["status"];
  }>;
};

type ProcessedPaper = Paper & {
  sourcePackId?: string;
  expectedQuestionCount?: number;
  sections?: unknown[];
};

type ProcessedQuestion = Question & {
  section?: string;
  review?: unknown;
  syllabusMappingEvidence?: unknown;
};

type ProcessedExtrasFile = {
  paperId: string;
  questions: Record<
    string,
    {
      guidePages?: number[];
      markingCriteria?: Array<{
        part?: string;
        marks?: string | number;
        criterion?: string;
      }>;
    }
  >;
};

const processedRoot = process.argv[2] ?? "InputProcessedExams";
const corpusPath = "src/data/hsc-math-advanced.json";
const workedSolutionsPath = "src/data/hsc-math-advanced-worked-solutions.json";
const publicDiagramDir = "public/assets/diagrams";

const currentDatabase = readJson<HscDatabase>(corpusPath);
const processedFiles = readdirSync(join(processedRoot, "papers"))
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();
const extrasByQuestionId = readExtrasByQuestionId(join(processedRoot, "extras"));
const incomingSourcePacks: SourcePack[] = [];
const incomingPapers: Paper[] = [];
const incomingQuestions: Question[] = [];

for (const fileName of processedFiles) {
  const processed = readJson<ProcessedPaperFile>(join(processedRoot, "papers", fileName));

  processed.sourcePacks.forEach((sourcePack) => {
    incomingSourcePacks.push(normaliseSourcePack(sourcePack));
  });

  processed.papers.forEach((paper) => {
    incomingPapers.push(normalisePaper(paper));
  });

  processed.questions.forEach((question) => {
    incomingQuestions.push(normaliseQuestion(question, extrasByQuestionId[question.id]));
  });
}

const incomingPaperIds = new Set(incomingPapers.map((paper) => paper.id));
const incomingSourcePackIds = new Set(incomingSourcePacks.map((pack) => pack.id));

const database: HscDatabase = {
  ...currentDatabase,
  meta: {
    ...currentDatabase.meta,
    updatedAt: new Date().toISOString(),
    sourceSummary:
      "NSW HSC mathematics corpus imported from reviewed processed exam JSON, diagram assets, worked-solution sidecars, and marking-criteria sidecars."
  },
  sourcePacks: [
    ...currentDatabase.sourcePacks.filter(
      (pack) => !incomingSourcePackIds.has(pack.id) && !packReferencesAnyPaper(pack, incomingPaperIds)
    ),
    ...incomingSourcePacks
  ].sort(compareSourcePacks),
  papers: [
    ...currentDatabase.papers.filter((paper) => !incomingPaperIds.has(paper.id)),
    ...incomingPapers
  ].sort(comparePapers),
  questions: [
    ...currentDatabase.questions.filter((question) => !incomingPaperIds.has(question.paperId)),
    ...incomingQuestions
  ].sort(compareQuestions)
};

const workedSolutions = readJson<WorkedSolutionsDatabase>(
  join(processedRoot, "solutions", "all-solutions.json")
);
const normalisedWorkedSolutions = normaliseWorkedSolutions(workedSolutions);
const validatedDatabase = HscDatabaseSchema.parse(database);
const validatedWorkedSolutions = WorkedSolutionsDatabaseSchema.parse(normalisedWorkedSolutions);

writeJson(corpusPath, validatedDatabase);
writeJson(workedSolutionsPath, validatedWorkedSolutions);
copyDiagramAssets(join(processedRoot, "assets", "diagrams"), publicDiagramDir);

console.log(
  [
    `Imported ${incomingPapers.length} papers`,
    `${incomingQuestions.length} questions`,
    `${validatedWorkedSolutions.workedSolutions.length} worked solutions`,
    `${Object.keys(extrasByQuestionId).length} marking-criteria sidecars`,
    `copied diagrams into ${publicDiagramDir}`
  ].join(", ")
);

function normaliseSourcePack(sourcePack: ProcessedSourcePack): SourcePack {
  return {
    id: sourcePack.id,
    courseId: sourcePack.courseId,
    paperId: sourcePack.paperId,
    paperIds: sourcePack.paperIds,
    collectionId: collectionIdForCourse(sourcePack.courseId),
    year: sourcePack.year,
    courseName: sourcePack.courseName,
    title: sourcePack.title,
    packPageUrl: sourcePack.packPageUrl,
    syllabusEra: sourcePack.syllabusEra,
    officialListStatus: sourcePack.officialListStatus,
    importStatus: sourcePack.importStatus,
    expectedQuestionCount: sourcePack.expectedQuestionCount,
    importedQuestionCount: sourcePack.importedQuestionCount,
    assetStatus: sourcePack.assetStatus,
    notes: sourcePack.notes,
    assets: (sourcePack.assets ?? []).map((asset) => ({
      id: asset.id,
      role: asset.role,
      label: asset.label,
      url: asset.url,
      status: asset.status
    }))
  };
}

function normalisePaper(paper: ProcessedPaper): Paper {
  return {
    id: paper.id,
    courseId: paper.courseId,
    year: paper.year,
    courseName: paper.courseName,
    syllabusEra: paper.syllabusEra,
    examPackUrl: paper.examPackUrl,
    paperUrl: paper.paperUrl,
    markingGuideUrl: paper.markingGuideUrl,
    sourceStatus: paper.sourceStatus
  };
}

function normaliseQuestion(
  question: ProcessedQuestion,
  criteriaSource: ProcessedExtrasFile["questions"][string] | undefined
): Question {
  const assets =
    question.assets?.length || !hasVisualPlaceholder(question.promptLatex)
      ? (question.assets ?? [])
      : [
          {
            id: `${question.id}-pending-visual`,
            type: "diagram" as const,
            label: "Pending source visual",
            alt: `Pending source visual for ${question.title}`,
            path: `/assets/diagrams/${question.id}-pending.png`,
            sourceStatus: "pending" as const
          }
        ];
  const markingCriteria = criteriaSource?.markingCriteria?.length
    ? {
        sourceRef: `${question.year} HSC ${courseNameForPaperId(question.paperId)} marking criteria`,
        guidePages: criteriaSource.guidePages ?? [],
        criteria: criteriaSource.markingCriteria
          .filter((criterion) => criterion.criterion && criterion.marks !== undefined)
          .map((criterion) => ({
            part: criterion.part?.trim() || undefined,
            marks: String(criterion.marks),
            criterion: criterion.criterion ?? ""
          }))
      }
    : undefined;

  return {
    id: question.id,
    paperId: question.paperId,
    year: question.year,
    questionNumber: question.questionNumber,
    title: question.title,
    marks: question.marks,
    style: question.style,
    topic: question.topic,
    subtopic: question.subtopic,
    syllabusNodeIds: question.syllabusNodeIds,
    promptLatex: question.promptLatex,
    answerLatex: question.answerLatex,
    workingLatex: question.workingLatex ?? [],
    markingFeedback: question.markingFeedback,
    markingCriteria,
    tags: unique([...(question.tags ?? []), "official-draft", "processed-import", String(question.year)]),
    assets,
    source: question.source
  };
}

function readExtrasByQuestionId(extrasDir: string): Record<string, ProcessedExtrasFile["questions"][string]> {
  const extrasByQuestionId: Record<string, ProcessedExtrasFile["questions"][string]> = {};

  readdirSync(extrasDir)
    .filter((fileName) => fileName.endsWith(".extras.json"))
    .sort()
    .forEach((fileName) => {
      const extras = readJson<ProcessedExtrasFile>(join(extrasDir, fileName));
      Object.assign(extrasByQuestionId, extras.questions);
    });

  return extrasByQuestionId;
}

function copyDiagramAssets(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });

  readdirSync(sourceDir)
    .filter((fileName) => fileName.endsWith(".png"))
    .forEach((fileName) => {
      copyFileSync(join(sourceDir, fileName), join(targetDir, fileName));
    });
}

function hasVisualPlaceholder(promptLatex: string): boolean {
  return /\[(?:diagram|graph|figure)\b/i.test(promptLatex);
}

function normaliseWorkedSolutions(workedSolutions: WorkedSolutionsDatabase): WorkedSolutionsDatabase {
  return {
    ...workedSolutions,
    workedSolutions: workedSolutions.workedSolutions.map((solution) => {
      const steps = solution.steps.filter((step) => step.bodyLatex.trim().length > 0);
      const droppedStepCount = solution.steps.length - steps.length;
      const checkLatex = solution.checkLatex?.trim() ? solution.checkLatex : undefined;
      const reviewNotes = [
        solution.reviewNote,
        droppedStepCount > 0 ? `Importer removed ${droppedStepCount} empty worked-solution step(s).` : ""
      ].filter(Boolean);

      return {
        ...solution,
        steps,
        checkLatex,
        needsReview: solution.needsReview || droppedStepCount > 0,
        reviewStatus: droppedStepCount > 0 ? "needs-review" : solution.reviewStatus,
        reviewNote: reviewNotes.join(" ")
      };
    })
  };
}

function packReferencesAnyPaper(pack: SourcePack, paperIds: Set<string>): boolean {
  if (pack.paperId && paperIds.has(pack.paperId)) {
    return true;
  }

  return (pack.paperIds ?? []).some((paperId) => paperIds.has(paperId));
}

function collectionIdForCourse(courseId: string): string {
  switch (courseId) {
    case "advanced":
      return "nesa-math-advanced-papers";
    case "standard":
      return "nesa-math-standard-papers";
    case "extension-1":
      return "nesa-math-extension-1-papers";
    case "extension-2":
      return "nesa-math-extension-2-papers";
    default:
      return "nesa-mathematics-archive";
  }
}

function courseNameForPaperId(paperId: string): string {
  if (paperId.startsWith("adv-")) {
    return "Mathematics Advanced";
  }

  if (paperId.startsWith("ext1-")) {
    return "Mathematics Extension 1";
  }

  if (paperId.startsWith("ext2-")) {
    return "Mathematics Extension 2";
  }

  if (paperId.startsWith("std1-")) {
    return "Mathematics Standard 1";
  }

  if (paperId.startsWith("std2-")) {
    return "Mathematics Standard 2";
  }

  if (paperId.startsWith("gen-")) {
    return "Mathematics Standard";
  }

  return "Mathematics";
}

function compareSourcePacks(left: SourcePack, right: SourcePack): number {
  return (
    right.year - left.year || left.courseId.localeCompare(right.courseId) || left.id.localeCompare(right.id)
  );
}

function comparePapers(left: Paper, right: Paper): number {
  return (
    right.year - left.year || left.courseId.localeCompare(right.courseId) || left.id.localeCompare(right.id)
  );
}

function compareQuestions(left: Question, right: Question): number {
  return (
    right.year - left.year ||
    left.paperId.localeCompare(right.paperId) ||
    compareQuestionNumbers(left.questionNumber, right.questionNumber)
  );
}

function compareQuestionNumbers(left: string, right: string): number {
  const leftNumber = Number(left.replace(/^Q/i, ""));
  const rightNumber = Number(right.replace(/^Q/i, ""));

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  const parent = dirname(path);
  if (parent && !existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }

  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
