import { readFile, writeFile } from "node:fs/promises";

import conversionJson from "../src/data/syllabus-conversion.json";
import type {
  HscDatabase,
  Question,
  SourcePack,
  SyllabusConversion,
  SyllabusConversionNode,
  SyllabusNode
} from "../src/domain/hscSchemas";

export type SourceLine = {
  index: number;
  text: string;
  page?: number;
};

export type ExamCourseId = "standard" | "extension-1" | "extension-2";

export type QuestionBoundary = {
  questionNumber: number;
  startIndex: number;
  endIndex: number;
  section: "I" | "II";
};

export type ExamIngestionProfile = {
  id: string;
  paperId: string;
  sourcePackId: string;
  courseId: ExamCourseId;
  courseName: string;
  year: number;
  sourceRef: string;
  examTextPath: string;
  markingGuideTextPath: string;
  markingFeedbackTextPath: string;
  examPackUrl: string;
  expectedQuestionCount: number;
  sectionIQuestionCount: number;
  boundaries: QuestionBoundary[];
  questionOverrides?: Record<
    number,
    Partial<Pick<Question, "promptLatex" | "answerLatex" | "workingLatex" | "assets">>
  >;
};

type BuildOptions = {
  database: HscDatabase;
  profiles: ExamIngestionProfile[];
};

const conversion = conversionJson as SyllabusConversion;

export async function ingestExamProfiles({ database, profiles }: BuildOptions): Promise<number> {
  promoteSyllabusNodes(database);

  const targetPaperIds = new Set(profiles.map((profile) => profile.paperId));
  database.questions = database.questions.filter((question) => !targetPaperIds.has(question.paperId));

  const importedCountsByPack = new Map<string, number>();
  let importedTotal = 0;

  for (const profile of profiles) {
    const questions = await buildQuestions(database, profile);
    database.questions.push(...questions);
    importedTotal += questions.length;
    importedCountsByPack.set(
      profile.sourcePackId,
      (importedCountsByPack.get(profile.sourcePackId) ?? 0) + questions.length
    );
    updatePaper(database, profile.paperId);
    console.log(
      `${profile.paperId}: promoted ${questions.length}/${profile.expectedQuestionCount} draft records`
    );
  }

  for (const [packId, importedCount] of importedCountsByPack.entries()) {
    const expectedCount = profiles
      .filter((profile) => profile.sourcePackId === packId)
      .reduce((sum, profile) => sum + profile.expectedQuestionCount, 0);
    updateSourcePack(database, packId, expectedCount, importedCount);
  }

  database.meta.updatedAt = "2026-06-06";
  database.meta.sourceSummary =
    "Validated corpus linking NSW mathematics exam-pack sources, Standard and Extension draft imports, the Mathematics archive, 2017 syllabus nodes, and 2024 syllabus conversion nodes.";

  await writeFile("src/data/hsc-math-advanced.json", `${JSON.stringify(database, null, 2)}\n`, "utf-8");
  return importedTotal;
}

export async function buildQuestions(
  database: HscDatabase,
  profile: ExamIngestionProfile
): Promise<Question[]> {
  const examLines = await readLines(profile.examTextPath);
  const guideLines = await readLines(profile.markingGuideTextPath);
  const feedbackLines = await readLines(profile.markingFeedbackTextPath);
  const answerKey = parseAnswerKey(guideLines);
  const guideBlocks = parseQuestionBlocks(guideLines);
  const feedbackBlocks = parseFeedbackBlocks(feedbackLines, profile.sourceRef);

  return profile.boundaries.map((boundary) => {
    const block = sliceLines(examLines, boundary.startIndex, boundary.endIndex);
    const prompt = cleanPrompt(block.map((line) => line.text));
    const questionNumber = boundary.questionNumber;
    const isMultipleChoice = boundary.section === "I";
    const node = selectSyllabusNode(database, profile.courseId, prompt, isMultipleChoice);
    const marks = isMultipleChoice ? 1 : extractMarks(prompt);
    const guideBlock = guideBlocks.get(questionNumber.toString()) ?? [];
    const feedback = feedbackBlocks.get(questionNumber.toString());

    const question = {
      id: `${profile.paperId}-q${questionNumber.toString().padStart(2, "0")}-${slug(node.title)}`,
      paperId: profile.paperId,
      year: profile.year,
      questionNumber: `Q${questionNumber}`,
      title: titleForQuestion(prompt, node, isMultipleChoice ? "Multiple-choice" : "Question"),
      marks,
      style: isMultipleChoice ? "multiple-choice" : marks >= 5 ? "extended-response" : "short-answer",
      topic: node.topic,
      subtopic: node.title,
      syllabusNodeIds: [node.id],
      promptLatex: prompt,
      answerLatex: isMultipleChoice
        ? `Official answer: ${answerKey.get(questionNumber.toString()) ?? "not extracted"}.`
        : cleanAnswer(guideBlock.map((line) => line.text)),
      workingLatex: [],
      markingFeedback: feedback,
      tags: [
        "official-draft",
        profile.year.toString(),
        isMultipleChoice ? "multiple-choice" : "section-ii",
        profile.courseName
      ],
      assets: [],
      source: {
        examPackUrl: profile.examPackUrl,
        pageRef: pageRef(block),
        markingGuideRef: isMultipleChoice
          ? "Marking guidelines page 1"
          : pageRef(guideBlock, "Marking guidelines pages"),
        transcriptionStatus: "draft"
      }
    } satisfies Question;

    return { ...question, ...profile.questionOverrides?.[questionNumber] };
  });
}

export async function readLines(filePath: string): Promise<SourceLine[]> {
  const rawLines = (await readFile(filePath, "utf-8")).split(/\r?\n/);
  const lines: SourceLine[] = [];
  let currentPage: number | undefined;

  rawLines.forEach((rawText, index) => {
    const text = normaliseText(rawText.trim());
    const pageMatch = /^--- page (\d+) ---$/.exec(text);
    if (pageMatch) {
      currentPage = Number(pageMatch[1]);
    }
    lines.push({ index, text, page: currentPage });
  });

  return lines;
}

export function makeBoundaries(
  sectionIQuestionCount: number,
  sectionIStartIndexes: number[],
  sectionIIQuestionNumbers: number[],
  sectionIIStartIndexes: number[],
  endIndex: number,
  sectionIEndIndex?: number
): QuestionBoundary[] {
  const boundaries: QuestionBoundary[] = [];

  for (let questionNumber = 1; questionNumber <= sectionIQuestionCount; questionNumber += 1) {
    boundaries.push({
      questionNumber,
      startIndex: sectionIStartIndexes[questionNumber - 1],
      endIndex: sectionIStartIndexes[questionNumber] ?? sectionIEndIndex ?? sectionIIStartIndexes[0],
      section: "I"
    });
  }

  sectionIIQuestionNumbers.forEach((questionNumber, questionIndex) => {
    boundaries.push({
      questionNumber,
      startIndex: sectionIIStartIndexes[questionIndex],
      endIndex: sectionIIStartIndexes[questionIndex + 1] ?? endIndex,
      section: "II"
    });
  });

  return boundaries;
}

export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function promoteSyllabusNodes(database: HscDatabase) {
  const existingNodeIds = new Set(database.syllabus.map((node) => node.id));
  const newNodes: SyllabusNode[] = [];

  conversion.courses
    .filter((course) => ["standard", "extension-1", "extension-2"].includes(course.id))
    .forEach((course) => {
      const oldCourseTitle = course.oldSyllabus.title.replace(" Syllabus (2017)", "");
      course.oldSyllabus.nodes.forEach((node) => {
        const appNodeId = node.appNodeId ?? node.id;
        if (!existingNodeIds.has(appNodeId)) {
          newNodes.push(
            toSyllabusNode(
              node,
              appNodeId,
              oldCourseTitle,
              course.oldSyllabus.id,
              course.oldSyllabus.sourceUrl
            )
          );
          existingNodeIds.add(appNodeId);
        }
      });

      const newCourseTitle = course.newSyllabus.title.replace(" Syllabus (2024)", "");
      course.newSyllabus.nodes.forEach((node) => {
        if (!existingNodeIds.has(node.id)) {
          newNodes.push(
            toSyllabusNode(
              node,
              node.id,
              newCourseTitle,
              course.newSyllabus.id,
              node.sourceUrl ?? course.newSyllabus.contentUrl
            )
          );
          existingNodeIds.add(node.id);
        }
      });
    });

  database.syllabus.push(...newNodes);
  if (newNodes.length > 0) {
    console.log(`Promoted ${newNodes.length} non-Advanced syllabus nodes`);
  }
}

function toSyllabusNode(
  node: SyllabusConversionNode,
  id: string,
  course: string,
  syllabusEra: string,
  sourceUrl: string
): SyllabusNode {
  return {
    id,
    course,
    syllabusEra,
    code: node.code,
    topic: normaliseTopic(node.areaOfStudy),
    title: node.title,
    content: `${node.title}: ${node.contentGroups.map((group) => group.title).join("; ")}.`,
    sourceUrl
  };
}

function parseAnswerKey(lines: SourceLine[]): Map<string, string> {
  const answerKey = new Map<string, string>();
  const compact = lines
    .map((line) => line.text)
    .filter(Boolean)
    .slice(0, 100);
  const start = compact.findIndex((line) => line === "Multiple-choice Answer Key");

  for (let index = Math.max(0, start); index < compact.length - 1; index += 1) {
    if (/^\d{1,2}$/.test(compact[index]) && /^[A-D]$/.test(compact[index + 1])) {
      answerKey.set(compact[index], compact[index + 1]);
      index += 1;
    }
  }

  return answerKey;
}

function parseQuestionBlocks(lines: SourceLine[]): Map<string, SourceLine[]> {
  const mappingStart = findMappingGridStart(lines);
  const starts = findQuestionStarts(lines).filter((start) => start.index < mappingStart);
  const blocks = new Map<string, SourceLine[]>();

  starts.forEach((start, index) => {
    const end = Math.min(starts[index + 1]?.index ?? mappingStart, mappingStart);
    const current = blocks.get(start.questionNumber) ?? [];
    blocks.set(start.questionNumber, [...current, ...sliceLines(lines, start.index, end)]);
  });

  return blocks;
}

function findMappingGridStart(lines: SourceLine[]): number {
  const directMatch = lines.find((line) => line.text.includes("Mapping Grid"));
  if (directMatch) return directMatch.index;

  const splitMatch = lines.find((line, arrayIndex) => {
    if (line.text !== "Mapping") return false;
    const nextMeaningfulLine = lines.slice(arrayIndex + 1).find((candidate) => candidate.text);
    return nextMeaningfulLine?.text === "Grid";
  });

  return splitMatch?.index ?? lines.length;
}

function parseFeedbackBlocks(
  lines: SourceLine[],
  sourceRef: string
): Map<string, Question["markingFeedback"]> {
  const feedback = new Map<string, Question["markingFeedback"]>();
  const questionBlocks = parseQuestionBlocks(lines);

  questionBlocks.forEach((block, questionNumber) => {
    const raw = block.map((line) => line.text).filter(Boolean);
    const better = extractFeedbackItems(
      raw,
      "In better responses, students were able to:",
      "Areas for students to improve include:"
    );
    const improve = extractFeedbackItems(raw, "Areas for students to improve include:", "Question ");

    if (better.length > 0 || improve.length > 0) {
      feedback.set(questionNumber, {
        sourceRef,
        betterResponses: better,
        improvementAreas: improve
      });
    }
  });

  return feedback;
}

function extractFeedbackItems(lines: string[], startMarker: string, endMarker: string): string[] {
  const start = lines.findIndex((line) => line === startMarker);
  if (start < 0) return [];
  const end = lines.findIndex((line, index) => index > start && line.startsWith(endMarker));
  const segment = lines.slice(start + 1, end > start ? end : undefined);
  const items: string[] = [];
  let current: string[] = [];

  segment.forEach((line) => {
    if (line === "*") {
      if (current.length > 0) items.push(cleanInlineText(current));
      current = [];
      return;
    }
    if (!isNoiseLine(line)) current.push(line);
  });

  if (current.length > 0) items.push(cleanInlineText(current));
  return items.filter(Boolean);
}

function findQuestionStarts(lines: SourceLine[]): Array<{ index: number; questionNumber: string }> {
  return lines
    .filter((line) => /^Question\s+\d{1,2}(?:\s+\([a-ziv]+\))?$/.test(line.text))
    .map((line) => ({
      index: line.index,
      questionNumber: line.text.match(/\d{1,2}/)?.[0] ?? ""
    }))
    .filter((start) => start.questionNumber);
}

function sliceLines(lines: SourceLine[], start: number, end: number): SourceLine[] {
  return lines.filter((line) => line.index >= start && line.index < end);
}

function cleanPrompt(lines: string[]): string {
  return cleanStructuredText(
    lines.filter((line) => !isNoiseLine(line)),
    "prompt"
  );
}

function cleanAnswer(lines: string[]): string {
  const answer = cleanStructuredText(
    lines.filter((line) => !isNoiseLine(line) && !isMarkingGuideHeader(line)),
    "answer"
  );
  return answer
    ? `Official marking guide excerpt:\n${answer}`
    : "Official marking-guide answer not extracted.";
}

function cleanStructuredText(lines: string[], mode: "prompt" | "answer"): string {
  const output: string[] = [];
  let current: string[] = [];

  const flush = () => {
    const text = cleanInlineText(current);
    if (text) output.push(text);
    current = [];
  };

  for (const rawLine of lines.map(normaliseText).filter(Boolean)) {
    if (shouldDropFillLine(rawLine)) continue;

    if (isStructuralBreak(rawLine, mode)) {
      flush();
      output.push(rawLine === "*" ? "- " : rawLine);
      continue;
    }

    if (/^[A-D]\.$/.test(rawLine)) {
      flush();
      current.push(rawLine);
      continue;
    }

    current.push(rawLine);
  }

  flush();
  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanInlineText(lines: string[]): string {
  const cleaned = lines
    .map(normaliseText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/\s*-\s*intercept/g, "-intercept")
    .replace(/\s+/g, " ")
    .trim();

  return normaliseMathExtractionArtifacts(cleaned);
}

function normaliseMathExtractionArtifacts(value: string): string {
  return value
    .replace(/\b7\s+([a-z])\s*!\s*([RZC])\b/g, (_, variable: string, setName: string) =>
      mathSetMembership("\\exists", variable, setName)
    )
    .replace(/\b6\s+([a-z])\s*!\s*([RZC])\b/g, (_, variable: string, setName: string) =>
      mathSetMembership("\\forall", variable, setName)
    )
    .replace(/\b([a-z])\s*!\s*([RZC])\b/g, (_, variable: string, setName: string) =>
      mathSetMembership(undefined, variable, setName)
    );
}

function mathSetMembership(quantifier: string | undefined, variable: string, setName: string): string {
  const prefix = quantifier ? `${quantifier} ` : "";
  return `\\(${prefix}${variable} \\in \\mathbb{${setName}}\\)`;
}

function normaliseText(value: string): string {
  /* eslint-disable no-irregular-whitespace */
  return value
    .replace(/Ã¢â‚¬â€œ|â€“|–/g, "-")
    .replace(/Ã¢Ë†â€™|âˆ’|−/g, "-")
    .replace(/Ã¢â‚¬Â¢|â€¢|•|●/g, "*")
    .replace(/Ã¢â€°Â¥|≥/g, ">=")
    .replace(/Ã¢â€°Â¤|≤/g, "<=")
    .replace(/Ã¢â€°Â |≠/g, "!=")
    .replace(/Ã‚Â·|Â·/g, ".")
    .replace(/Ã†â€™/g, "f")
    .replace(/ÃŒÂ°/g, "")
    .replace(/\uFFFD/g, "")
    .trim();
  /* eslint-enable no-irregular-whitespace */
}

function isStructuralBreak(line: string, mode: "prompt" | "answer"): boolean {
  if (/^\([a-ziv]+\)$/.test(line)) return true;
  if (/^Question\s+\d{1,2}(?:\s+\([a-ziv]+\))?$/.test(line)) return true;
  if (mode === "answer" && line === "*") return true;
  return false;
}

function shouldDropFillLine(line: string): boolean {
  return /^\.+$/.test(line) || /^[.: ]{20,}$/.test(line) || /^[A-Za-z ]+:\s*\.{10,}$/.test(line);
}

function isMarkingGuideHeader(line: string): boolean {
  return (
    /^Mathematics .* Marking Guidelines$/.test(line) ||
    /^Marking Guidelines$/.test(line) ||
    /^Criteria$/.test(line) ||
    /^Marks$/.test(line) ||
    /^Sample answer:?$/.test(line)
  );
}

function isNoiseLine(line: string): boolean {
  return (
    !line ||
    /^--- page \d+ ---$/.test(line) ||
    /^Page \d+ of \d+$/.test(line) ||
    /^-\s*\d+\s*-$/.test(line) ||
    /^Office Use Only/.test(line) ||
    /^Do NOT write/.test(line) ||
    /^Do$/.test(line) ||
    /^NOT$/.test(line) ||
    /^write$/.test(line) ||
    /^in$/.test(line) ||
    /^this$/.test(line) ||
    /^area\.$/.test(line) ||
    /^Question \d+ continues/.test(line) ||
    /^Question \d+ \(continued\)$/.test(line) ||
    /^End of Question \d+$/.test(line) ||
    /^End of paper$/.test(line) ||
    /^BLANK PAGE$/.test(line) ||
    /^NSW Education Standards Authority$/.test(line) ||
    /^NESA$/.test(line) ||
    /^20\d{2} HSC$/.test(line) ||
    /^Use the Question \d+ Writing Booklet$/.test(line) ||
    /^Use the multiple-choice answer sheet/.test(line) ||
    /^Allow about/.test(line) ||
    /^Attempt Questions/.test(line) ||
    /^Section I/.test(line) ||
    /^Section II/.test(line) ||
    /^For questions in Section II/.test(line) ||
    /^\d{8,}$/.test(line)
  );
}

function pageRef(lines: SourceLine[], prefix = "Exam paper pages"): string {
  const pages = [...new Set(lines.map((line) => line.page).filter((page): page is number => Boolean(page)))];
  if (pages.length === 0) return prefix;
  if (pages.length === 1) return `${prefix} ${pages[0]}`;
  return `${prefix} ${pages[0]}-${pages.at(-1)}`;
}

function extractMarks(prompt: string): number {
  const match = /\((\d+)\s+marks?\)/i.exec(prompt);
  return match ? Number(match[1]) : 1;
}

function titleForQuestion(prompt: string, node: SyllabusNode, fallback: string): string {
  const withoutLead = prompt.replace(/^Question \d+\s+\(\d+ marks?\)\s*/i, "");
  const sentence = withoutLead.split(/[.?]/)[0]?.trim();
  if (sentence && sentence.length >= 12 && sentence.length <= 80) return sentence;
  if (sentence && sentence.length > 80) return sentence.slice(0, 77).trimEnd() + "...";
  return `${fallback}: ${node.title}`;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function normaliseTopic(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function selectSyllabusNode(
  database: HscDatabase,
  courseId: ExamCourseId,
  prompt: string,
  isMultipleChoice: boolean
): SyllabusNode {
  const promptText = prompt.toLowerCase();
  const oldNodes = database.syllabus.filter((node) => node.syllabusEra === `${courseId}-2017`);
  const byId = (id: string) => oldNodes.find((node) => node.id === id) ?? oldNodes[0];

  if (courseId === "extension-1") {
    if (containsAny(promptText, ["vector", "position", "velocity", "acceleration"]))
      return byId("old-me1-v1");
    if (containsAny(promptText, ["bernoulli", "binomial", "normal distribution", "probability"]))
      return byId("old-me1-s1");
    if (containsAny(promptText, ["pascal", "induction", "prove"])) return byId("old-me1-p1");
    if (containsAny(promptText, ["arrangements", "distinct factors", "seating"])) return byId("old-me1-a1");
    if (containsAny(promptText, ["sin", "cos", "tan", "clock", "trigonometric"])) return byId("old-me1-t3");
    if (containsAny(promptText, ["integral", "dx", "dy", "particle", "rate", "hyperbola"]))
      return byId("old-me1-c2");
    if (containsAny(promptText, ["polynomial", "roots"])) return byId("old-me1-f2");
    return byId(isMultipleChoice ? "old-me1-f1" : "old-me1-c3");
  }

  if (courseId === "extension-2") {
    if (containsAny(promptText, ["complex", "arg", "modulus", "de moivre", "unit circle"]))
      return byId("old-me2-n2");
    if (containsAny(promptText, ["vector", "sphere", "line", "force", "plane"])) return byId("old-me2-v1");
    if (containsAny(promptText, ["induction"])) return byId("old-me2-p2");
    if (containsAny(promptText, ["prove", "contradiction", "statement"])) return byId("old-me2-p1");
    if (containsAny(promptText, ["particle", "velocity", "acceleration", "simple harmonic", "motion"]))
      return byId("old-me2-m1");
    return byId("old-me2-c1");
  }

  if (containsAny(promptText, ["network", "critical path", "minimum spanning", "vertex", "edge"]))
    return byId("old-ms-n2");
  if (
    containsAny(promptText, [
      "normal",
      "z-score",
      "frequency histogram",
      "sampling",
      "probability",
      "spinner",
      "die"
    ])
  )
    return byId("old-ms-s3");
  if (containsAny(promptText, ["scatter", "line of best fit", "bivariate"])) return byId("old-ms-s4");
  if (containsAny(promptText, ["investment", "annuity", "loan", "depreciation", "compound", "interest"]))
    return byId("old-ms-f4");
  if (containsAny(promptText, ["pay", "annual leave", "profit", "cost", "electricity", "money", "saving"]))
    return byId("old-ms-f1");
  if (
    containsAny(promptText, [
      "area",
      "volume",
      "surface",
      "perimeter",
      "trapezium",
      "triangle",
      "cross-section"
    ])
  )
    return byId("old-ms-m1");
  if (containsAny(promptText, ["bearing", "trigonometry", "sine", "cosine"])) return byId("old-ms-m6");
  if (containsAny(promptText, ["rate", "ratio", "scale", "model car"])) return byId("old-ms-m7");
  if (containsAny(promptText, ["graph", "linear", "formula", "equation", "varies inversely"]))
    return byId("old-ms-a4");
  return byId("old-ms-a1");
}

function containsAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function updatePaper(database: HscDatabase, paperId: string) {
  const paper = database.papers.find((candidate) => candidate.id === paperId);
  if (paper) paper.sourceStatus = "partially-transcribed";
}

function updateSourcePack(
  database: HscDatabase,
  packId: string,
  expectedQuestionCount: number,
  importedQuestionCount: number
) {
  const pack = database.sourcePacks.find((candidate) => candidate.id === packId) as SourcePack | undefined;
  if (!pack) return;
  pack.expectedQuestionCount = expectedQuestionCount;
  pack.importedQuestionCount = importedQuestionCount;
  pack.importStatus = "in-progress";
  pack.assetStatus = "partial";
}
