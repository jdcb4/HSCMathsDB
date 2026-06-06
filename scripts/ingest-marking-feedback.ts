import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { HscDatabaseSchema, type HscDatabase } from "../src/domain/hscSchemas";

type FeedbackBucket = {
  betterResponses: string[];
  improvementAreas: string[];
};

type SectionState = "better" | "improve" | "ignore";

const rootDirectory = process.cwd();
const dataPath = path.join(rootDirectory, "src", "data", "hsc-math-advanced.json");

const feedbackSources: Record<number, { packId: string; textPath: string; sourceRef: string }> = {
  2025: {
    packId: "source-adv-2025",
    textPath: path.join(
      rootDirectory,
      "var",
      "extracted-text",
      "source-adv-2025",
      "source-adv-2025-marking-feedback-2025-hsc-maths-adv-marking-feedback-section-ii.txt"
    ),
    sourceRef: "2025 HSC marking feedback"
  },
  2024: {
    packId: "source-adv-2024",
    textPath: path.join(
      rootDirectory,
      "var",
      "extracted-text",
      "source-adv-2024",
      "source-adv-2024-marking-feedback-2024-hsc-mathematics-adv-marking-feedback.txt"
    ),
    sourceRef: "2024 HSC marking feedback"
  },
  2023: {
    packId: "source-adv-2023",
    textPath: path.join(
      rootDirectory,
      "var",
      "extracted-text",
      "source-adv-2023",
      "source-adv-2023-marking-feedback-2023-hsc-mathematics-adv-marking-feedback.txt"
    ),
    sourceRef: "2023 HSC marking feedback"
  },
  2022: {
    packId: "source-adv-2022",
    textPath: path.join(
      rootDirectory,
      "var",
      "extracted-text",
      "source-adv-2022",
      "source-adv-2022-marking-feedback-2022-mathematics-advanced-hsc-marking-feedback.txt"
    ),
    sourceRef: "2022 HSC marking feedback"
  }
};

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const selectedYear = [...args].filter((arg) => /^\d{4}$/.test(arg)).map((arg) => Number.parseInt(arg, 10));

const years = selectedYear.length > 0 ? selectedYear : Object.keys(feedbackSources).map(Number);

const database = HscDatabaseSchema.parse(JSON.parse(await readFile(dataPath, "utf8")));
const updatedDatabase: HscDatabase = {
  ...database,
  questions: database.questions.map((question) => ({ ...question }))
};

const summary: string[] = [];

for (const year of years) {
  const source = feedbackSources[year];
  if (!source) {
    throw new Error(`No feedback source configured for ${year}`);
  }

  const feedbackText = await readFile(source.textPath, "utf8");
  const feedbackByQuestion = parseFeedback(feedbackText);
  const yearQuestions = updatedDatabase.questions.filter((question) => question.year === year);
  let attached = 0;

  yearQuestions.forEach((question) => {
    const questionNumber = Number.parseInt(question.questionNumber.replace(/^Q/i, ""), 10);
    const feedback = feedbackByQuestion.get(questionNumber);

    if (feedback && (feedback.betterResponses.length > 0 || feedback.improvementAreas.length > 0)) {
      question.markingFeedback = {
        sourceRef: source.sourceRef,
        betterResponses: feedback.betterResponses,
        improvementAreas: feedback.improvementAreas
      };
      attached += 1;
      return;
    }

    delete question.markingFeedback;
  });

  summary.push(
    `${source.packId}: attached feedback to ${attached}/${yearQuestions.length} question records ` +
      `from ${feedbackByQuestion.size} feedback sections`
  );
}

const validated = HscDatabaseSchema.parse(updatedDatabase);

if (write) {
  await writeFile(dataPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
}

console.log(summary.join("\n"));
console.log(write ? "Updated src/data/hsc-math-advanced.json" : "Dry run only. Pass --write to update data.");

function parseFeedback(text: string): Map<number, FeedbackBucket> {
  const byQuestion = new Map<number, FeedbackBucket>();
  let currentQuestion: number | undefined;
  let currentPart: string | undefined;
  let state: SectionState = "ignore";
  let activeArray: string[] | undefined;
  let pendingAreasHeadingPrefix = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);

    if (!line || shouldSkipLine(line)) {
      continue;
    }

    const questionMatch = /^Question\s+(\d+)(?:\s*\(([a-z])\))?/i.exec(line);
    if (questionMatch) {
      currentQuestion = Number.parseInt(questionMatch[1], 10);
      currentPart = questionMatch[2];
      state = "ignore";
      activeArray = undefined;
      ensureBucket(byQuestion, currentQuestion);
      continue;
    }

    if (!currentQuestion) {
      continue;
    }

    if (line === "A") {
      pendingAreasHeadingPrefix = true;
      continue;
    }

    if (pendingAreasHeadingPrefix && /^reas for students to improve include:?$/i.test(line)) {
      state = "improve";
      activeArray = ensureBucket(byQuestion, currentQuestion).improvementAreas;
      pendingAreasHeadingPrefix = false;
      continue;
    }

    pendingAreasHeadingPrefix = false;

    if (/^In better responses, students were able to:?$/i.test(line)) {
      state = "better";
      activeArray = ensureBucket(byQuestion, currentQuestion).betterResponses;
      continue;
    }

    if (/^Areas for students to improve include:?$/i.test(line)) {
      state = "improve";
      activeArray = ensureBucket(byQuestion, currentQuestion).improvementAreas;
      continue;
    }

    if (/^(Students should|General feedback|Section II)\b/i.test(line)) {
      state = "ignore";
      activeArray = undefined;
      continue;
    }

    if (!activeArray || state === "ignore") {
      continue;
    }

    const bullet = extractBullet(line);
    if (bullet) {
      activeArray.push(withPartPrefix(bullet, currentPart));
      continue;
    }

    if (activeArray.length > 0 && shouldAppendContinuation(line)) {
      const continuation = withPartPrefix(line, currentPart, false);
      activeArray[activeArray.length - 1] = `${activeArray[activeArray.length - 1]} ${continuation}`.trim();
    }
  }

  byQuestion.forEach((bucket) => {
    bucket.betterResponses = dedupeAndLimit(bucket.betterResponses);
    bucket.improvementAreas = dedupeAndLimit(bucket.improvementAreas);
  });

  return byQuestion;
}

function ensureBucket(map: Map<number, FeedbackBucket>, question: number): FeedbackBucket {
  const existing = map.get(question);
  if (existing) {
    return existing;
  }

  const bucket = { betterResponses: [], improvementAreas: [] };
  map.set(question, bucket);
  return bucket;
}

function cleanLine(line: string): string {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/â€“|â€”/g, "-")
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/â‰¤/g, "<=")
    .replace(/â‰¥/g, ">=")
    .replace(/âˆ’/g, "-")
    .replace(/\$/g, "\\$")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipLine(line: string): boolean {
  return (
    /^--- page \d+ ---$/i.test(line) ||
    /^Page \d+ of \d+$/i.test(line) ||
    /^Mathematics Advanced\b.*HSC Marking Feedback/i.test(line) ||
    /^Mathematics Advanced\b.*HSC marking feedback/i.test(line) ||
    /^NSW Education Standards Authority$/i.test(line)
  );
}

function extractBullet(line: string): string | undefined {
  const cleaned = line
    .replace(/^(?:â€¢|ï‚¡|ï‚§|▪||•|\uf0a1|\uf0a7|-)\s*/u, "")
    .replace(/^o\s+/, "")
    .trim();

  if (cleaned === line && !/^(?:[a-z]\)|\([a-z]\))\s+/i.test(cleaned)) {
    return undefined;
  }

  return cleaned.length > 0 ? cleaned : undefined;
}

function shouldAppendContinuation(line: string): boolean {
  return !/^Question\s+\d+/i.test(line) && !/responses, students were able to|Areas for students/i.test(line);
}

function withPartPrefix(text: string, part: string | undefined, allowPrefix = true): string {
  if (!allowPrefix || !part) {
    return text;
  }

  return `(${part}) ${text}`;
}

function dedupeAndLimit(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const cleaned = item.replace(/\s+/g, " ").trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(cleaned);
  });

  return result.slice(0, 12);
}
