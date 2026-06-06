import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { database } from "../src/services/hscDatabase";
import type { Question, SourcePack } from "../src/domain/hscSchemas";

type CandidateFile = {
  candidates?: Array<{ questionNumber?: string }>;
};

const requestedPackIds = process.argv.slice(2);
const packs = selectPacks(requestedPackIds);

for (const pack of packs) {
  const questions = database.questions.filter((question) => question.paperId === pack.paperId);
  const officialQuestions = questions.filter((question) => question.source.transcriptionStatus !== "demo");
  const candidateNumbers = await readCandidateNumbers(pack.id);
  const importedNumbers = new Set(
    officialQuestions.map((question) => normaliseQuestionNumber(question.questionNumber))
  );
  const missingCandidateNumbers = candidateNumbers.filter(
    (questionNumber) => !importedNumbers.has(questionNumber)
  );
  const assetProblems = await findMissingAssets(questions);
  const transcriptionCounts = countBy(questions, (question) => question.source.transcriptionStatus);

  console.log(
    [
      `${pack.id}: ${officialQuestions.length}/${pack.expectedQuestionCount ?? "?"} official imported`,
      `appRecords=${questions.length}`,
      `sourcePack.importedQuestionCount=${pack.importedQuestionCount}`,
      `draft=${transcriptionCounts.draft ?? 0}`,
      `verified=${transcriptionCounts.verified ?? 0}`,
      `demo=${transcriptionCounts.demo ?? 0}`,
      `candidateMissing=${missingCandidateNumbers.length ? missingCandidateNumbers.join(",") : "none"}`,
      `missingPublicAssets=${assetProblems.length ? assetProblems.join(",") : "none"}`
    ].join(" | ")
  );
}

function selectPacks(packIds: string[]): SourcePack[] {
  if (packIds.length === 0) {
    return database.sourcePacks.filter((pack) => pack.expectedQuestionCount);
  }

  const requested = new Set(packIds);
  const selected = database.sourcePacks.filter((pack) => requested.has(pack.id));

  if (selected.length !== requested.size) {
    const found = new Set(selected.map((pack) => pack.id));
    const missing = [...requested].filter((packId) => !found.has(packId));
    throw new Error(`Unknown source pack id(s): ${missing.join(", ")}`);
  }

  return selected;
}

async function readCandidateNumbers(packId: string): Promise<string[]> {
  const candidatePath = path.resolve("var/question-candidates", `${packId}.json`);

  try {
    const candidateFile = JSON.parse(await readFile(candidatePath, "utf-8")) as CandidateFile;
    return [
      ...new Set(
        (candidateFile.candidates ?? []).map((candidate) => candidate.questionNumber).filter(Boolean)
      )
    ]
      .map((questionNumber) => normaliseQuestionNumber(questionNumber ?? ""))
      .sort(compareQuestionNumbers);
  } catch {
    return [];
  }
}

async function findMissingAssets(questions: Question[]): Promise<string[]> {
  const missingAssets: string[] = [];

  for (const question of questions) {
    for (const asset of question.assets) {
      const publicPath = path.resolve("public", asset.path.replace(/^\//, ""));
      try {
        await access(publicPath);
      } catch {
        missingAssets.push(`${question.id}:${asset.path}`);
      }
    }
  }

  return missingAssets;
}

function countBy<T extends string>(
  items: Question[],
  getKey: (item: Question) => T
): Partial<Record<T, number>> {
  return items.reduce<Partial<Record<T, number>>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function normaliseQuestionNumber(questionNumber: string): string {
  return questionNumber.replace(/^Q/i, "");
}

function compareQuestionNumbers(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right);
}
