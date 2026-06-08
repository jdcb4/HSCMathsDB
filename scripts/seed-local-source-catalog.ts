import { readFile, writeFile } from "node:fs/promises";

import type { SourcePack } from "../src/domain/hscSchemas";
import { listLocalSourceExams, type LocalSourceExam } from "./local-source-exams";

type Database = {
  meta: { version: string; updatedAt: string };
  papers: PaperRecord[];
  sourcePacks: SourcePackRecord[];
};

type PaperRecord = {
  id: string;
  courseId: string;
  year: number;
  courseName: string;
  syllabusEra: string;
  examPackUrl: string;
  paperUrl?: string;
  markingGuideUrl?: string;
  sourceStatus: "source-linked" | "partially-transcribed" | "complete";
};

type SourcePackRecord = SourcePack & {
  assets: Array<{
    id: string;
    role: SourcePack["assets"][number]["role"];
    label: string;
    status: "linked" | "pending" | "not-applicable";
  }>;
};

const databasePath = "src/data/hsc-math-advanced.json";
const minYear = Number(process.argv[2] ?? "2020");
const sourceFiles = await listLocalSourceExams();
const database = JSON.parse(await readFile(databasePath, "utf8")) as Database;

for (const year of yearsFromSourceFiles(sourceFiles).filter((year) => year >= minYear)) {
  seedSinglePaperPack(year, "Mathematics_Advanced");
  seedSinglePaperPack(year, "Mathematics_Extension_1");
  seedSinglePaperPack(year, "Mathematics_Extension_2");
  seedStandardPack(year);
}

database.papers.sort(comparePapers);
database.sourcePacks.sort(compareSourcePacks);
database.meta.updatedAt = "2026-06-08";

await writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");

function seedSinglePaperPack(year: number, subject: LocalSourceExam["subject"]) {
  const files = filesFor(year, subject);
  if (files.length === 0) {
    return;
  }

  const config = configForSubject(subject);
  const paperId = `${config.paperPrefix}-${year}`;
  const packId = `source-${config.sourcePrefix}-${year}`;
  upsertPaper({
    id: paperId,
    courseId: config.courseId,
    year,
    courseName: config.courseName,
    syllabusEra: config.syllabusEra,
    examPackUrl: localPackUrl(packId),
    sourceStatus: "source-linked"
  });
  upsertSourcePack({
    id: packId,
    courseId: config.courseId,
    paperId,
    collectionId: config.collectionId,
    year,
    courseName: config.courseName,
    title: `${config.courseName} ${year} HSC exam pack`,
    packPageUrl: localPackUrl(packId),
    syllabusEra: config.syllabusEra,
    officialListStatus: "listed",
    importStatus: "seeded",
    importedQuestionCount: existingQuestionCount(paperId),
    assetStatus: "pending-extraction",
    notes: "Seeded from local SourceExams archive.",
    assets: files.map((file) => sourceAssetFor(file, packId))
  });
}

function seedStandardPack(year: number) {
  const files = [...filesFor(year, "Mathematics_Standard_1"), ...filesFor(year, "Mathematics_Standard_2")];
  if (files.length === 0) {
    return;
  }

  const packId = `source-std-${year}`;
  const paperIds: string[] = [];
  if (files.some((file) => file.subject === "Mathematics_Standard_1")) {
    paperIds.push(`std1-${year}`);
    upsertPaper({
      id: `std1-${year}`,
      courseId: "standard",
      year,
      courseName: "Mathematics Standard 1",
      syllabusEra: "standard-2017",
      examPackUrl: localPackUrl(packId),
      sourceStatus: "source-linked"
    });
  }
  if (files.some((file) => file.subject === "Mathematics_Standard_2")) {
    paperIds.push(`std2-${year}`);
    upsertPaper({
      id: `std2-${year}`,
      courseId: "standard",
      year,
      courseName: "Mathematics Standard 2",
      syllabusEra: "standard-2017",
      examPackUrl: localPackUrl(packId),
      sourceStatus: "source-linked"
    });
  }

  upsertSourcePack({
    id: packId,
    courseId: "standard",
    paperIds,
    collectionId: "nesa-math-standard-papers",
    year,
    courseName: "Mathematics Standard",
    title: `Mathematics Standard ${year} HSC exam pack`,
    packPageUrl: localPackUrl(packId),
    syllabusEra: "standard-2017",
    officialListStatus: "listed",
    importStatus: "seeded",
    importedQuestionCount: paperIds.reduce((total, paperId) => total + existingQuestionCount(paperId), 0),
    assetStatus: "pending-extraction",
    notes: "Seeded from local SourceExams archive.",
    assets: files.map((file) => sourceAssetFor(file, packId))
  });
}

function upsertPaper(paper: PaperRecord) {
  const existing = database.papers.find((candidate) => candidate.id === paper.id);
  if (existing) {
    existing.courseId = paper.courseId;
    existing.year = paper.year;
    existing.courseName = paper.courseName;
    existing.syllabusEra = paper.syllabusEra;
    existing.examPackUrl = existing.examPackUrl || paper.examPackUrl;
    return;
  }
  database.papers.push(paper);
}

function upsertSourcePack(pack: SourcePackRecord) {
  const existing = database.sourcePacks.find((candidate) => candidate.id === pack.id);
  if (existing) {
    existing.paperId = pack.paperId;
    existing.paperIds = pack.paperIds;
    existing.assets = existing.assets.length > 0 ? existing.assets : pack.assets;
    if (existing.importStatus === "not-started") {
      existing.importStatus = "seeded";
    }
    return;
  }
  database.sourcePacks.push(pack);
}

function sourceAssetFor(file: LocalSourceExam, packId: string): SourcePackRecord["assets"][number] {
  return {
    id: `${packId}-${file.subject.toLowerCase().replace(/_/g, "-")}-${file.documentType.replace(/_/g, "-")}`,
    role: file.role,
    label: `${file.year} ${file.subject.replace(/_/g, " ")} ${file.documentType.replace(/_/g, " ")}`,
    status: "linked"
  };
}

function filesFor(year: number, subject: LocalSourceExam["subject"]): LocalSourceExam[] {
  return sourceFiles.filter((file) => file.year === year && file.subject === subject);
}

function yearsFromSourceFiles(files: LocalSourceExam[]): number[] {
  return [...new Set(files.map((file) => file.year))].sort((left, right) => right - left);
}

function existingQuestionCount(paperId: string): number {
  const db = database as Database & { questions?: Array<{ paperId: string }> };
  return db.questions?.filter((question) => question.paperId === paperId).length ?? 0;
}

function localPackUrl(packId: string): string {
  return `https://local.sourceexams.invalid/${packId}`;
}

function configForSubject(subject: LocalSourceExam["subject"]) {
  switch (subject) {
    case "Mathematics_Advanced":
      return {
        paperPrefix: "adv",
        sourcePrefix: "adv",
        courseId: "advanced",
        courseName: "Mathematics Advanced",
        syllabusEra: "advanced-2017",
        collectionId: "nesa-math-advanced-papers"
      };
    case "Mathematics_Extension_1":
      return {
        paperPrefix: "ext1",
        sourcePrefix: "ext1",
        courseId: "extension-1",
        courseName: "Mathematics Extension 1",
        syllabusEra: "extension-1-2017",
        collectionId: "nesa-math-extension-1-papers"
      };
    case "Mathematics_Extension_2":
      return {
        paperPrefix: "ext2",
        sourcePrefix: "ext2",
        courseId: "extension-2",
        courseName: "Mathematics Extension 2",
        syllabusEra: "extension-2-2017",
        collectionId: "nesa-math-extension-2-papers"
      };
    default:
      throw new Error(`Unexpected single-paper subject: ${subject}`);
  }
}

function comparePapers(left: PaperRecord, right: PaperRecord): number {
  return right.year - left.year || left.id.localeCompare(right.id);
}

function compareSourcePacks(left: SourcePackRecord, right: SourcePackRecord): number {
  return right.year - left.year || left.id.localeCompare(right.id);
}
