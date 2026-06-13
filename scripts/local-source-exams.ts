import { readdir } from "node:fs/promises";
import path from "node:path";

import type { SourcePack } from "../src/domain/hscSchemas";

export type SourceExamDocumentType =
  | "exam_paper"
  | "marking_feedback"
  | "marking_guide"
  | "marking_report"
  | "sample_answers";

export type LocalSourceExamSubject =
  | "Mathematics_Advanced"
  | "Mathematics_Extension_1"
  | "Mathematics_Extension_2"
  | "Mathematics_General"
  | "Mathematics_Standard_1"
  | "Mathematics_Standard_2";

export type LocalSourceExamRole =
  | "exam-paper"
  | "marking-feedback"
  | "marking-guide"
  | "marking-report"
  | "sample-answers";

export type LocalSourceExam = {
  year: number;
  subject: LocalSourceExamSubject;
  documentType: SourceExamDocumentType;
  role: LocalSourceExamRole;
  fileName: string;
  path: string;
};

const sourceExamFilePattern =
  /^(?<year>\d{4})_(?<subject>Mathematics_(?:Advanced|Extension_1|Extension_2|General|Standard_1|Standard_2))_(?<documentType>exam_paper|marking_feedback|marking_guide|marking_report|sample_answers)\.pdf$/;

export const defaultSourceExamRoot = "SourceExams";

export async function listLocalSourceExams(sourceRoot = defaultSourceExamRoot): Promise<LocalSourceExam[]> {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => parseLocalSourceExamFileName(entry.name, sourceRoot))
    .filter((asset): asset is LocalSourceExam => Boolean(asset))
    .sort(compareLocalSourceExams);
}

export async function findLocalSourceExamsForPack(
  pack: SourcePack,
  sourceRoot = defaultSourceExamRoot
): Promise<LocalSourceExam[]> {
  const subjects = new Set(subjectsForSourcePack(pack));
  const files = await listLocalSourceExams(sourceRoot);
  return files.filter((file) => file.year === pack.year && subjects.has(file.subject));
}

export function parseLocalSourceExamFileName(
  fileName: string,
  sourceRoot = defaultSourceExamRoot
): LocalSourceExam | undefined {
  const match = fileName.match(sourceExamFilePattern);
  if (!match?.groups) {
    return undefined;
  }

  const documentType = match.groups.documentType as SourceExamDocumentType;
  return {
    year: Number(match.groups.year),
    subject: match.groups.subject as LocalSourceExamSubject,
    documentType,
    role: roleForDocumentType(documentType),
    fileName,
    path: path.join(sourceRoot, fileName)
  };
}

export function subjectsForSourcePack(pack: SourcePack): LocalSourceExamSubject[] {
  const paperIds = [pack.paperId, ...(pack.paperIds ?? [])].filter((id): id is string => Boolean(id));
  const subjects = new Set<LocalSourceExamSubject>();

  for (const paperId of paperIds) {
    const subject = subjectForPaperId(paperId);
    if (subject) {
      subjects.add(subject);
    }
  }

  if (subjects.size > 0) {
    return [...subjects];
  }

  if (pack.courseId === "advanced" || pack.courseId === "mathematics-archive") {
    return ["Mathematics_Advanced"];
  }

  if (pack.courseId === "extension-1") {
    return ["Mathematics_Extension_1"];
  }

  if (pack.courseId === "extension-2") {
    return ["Mathematics_Extension_2"];
  }

  if (pack.courseId === "standard") {
    if (pack.courseName.includes("Standard 1")) {
      return ["Mathematics_Standard_1"];
    }

    if (pack.courseName.includes("Standard 2")) {
      return ["Mathematics_Standard_2"];
    }

    return ["Mathematics_Standard_1", "Mathematics_Standard_2"];
  }

  return [];
}

export function roleForDocumentType(documentType: SourceExamDocumentType): LocalSourceExamRole {
  switch (documentType) {
    case "exam_paper":
      return "exam-paper";
    case "marking_feedback":
      return "marking-feedback";
    case "marking_guide":
      return "marking-guide";
    case "marking_report":
      return "marking-report";
    case "sample_answers":
      return "sample-answers";
  }
}

export function labelForLocalSourceExam(file: LocalSourceExam): string {
  const subject = file.subject.replace(/_/g, " ");
  const type = file.documentType.replace(/_/g, " ");
  return `${file.year} ${subject} ${type}`;
}

export function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function subjectForPaperId(paperId: string): LocalSourceExamSubject | undefined {
  if (paperId.startsWith("std1-")) {
    return "Mathematics_Standard_1";
  }

  if (paperId.startsWith("std2-")) {
    return "Mathematics_Standard_2";
  }

  if (paperId.startsWith("gen-")) {
    return "Mathematics_General";
  }

  if (paperId.startsWith("ext1-")) {
    return "Mathematics_Extension_1";
  }

  if (paperId.startsWith("ext2-")) {
    return "Mathematics_Extension_2";
  }

  if (paperId.startsWith("adv-") || paperId.startsWith("math-")) {
    return "Mathematics_Advanced";
  }

  return undefined;
}

function compareLocalSourceExams(left: LocalSourceExam, right: LocalSourceExam): number {
  return (
    left.year - right.year ||
    left.subject.localeCompare(right.subject) ||
    documentTypeOrder(left.documentType) - documentTypeOrder(right.documentType)
  );
}

function documentTypeOrder(documentType: SourceExamDocumentType): number {
  return ["exam_paper", "marking_guide", "marking_feedback", "marking_report", "sample_answers"].indexOf(
    documentType
  );
}
