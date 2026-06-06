import { readFile, writeFile } from "node:fs/promises";

import databaseJson from "../src/data/hsc-math-advanced.json";
import conversionJson from "../src/data/syllabus-conversion.json";
import type {
  HscDatabase,
  Question,
  SourcePack,
  SyllabusConversion,
  SyllabusConversionNode,
  SyllabusNode
} from "../src/domain/hscSchemas";

type Line = {
  index: number;
  text: string;
  page?: number;
};

type PaperImportConfig = {
  paperId: string;
  sourcePackId: string;
  courseId: "standard" | "extension-1" | "extension-2";
  courseName: string;
  sourceRef: string;
  examTextPath: string;
  markingGuideTextPath: string;
  markingFeedbackTextPath: string;
  examPackUrl: string;
  sectionIQuestionCount: number;
  sectionIStartIndexes: number[];
  sectionIIQuestionNumbers: number[];
  sectionIIStartIndexes: number[];
  endIndex: number;
  expectedQuestionCount: number;
};

const database = databaseJson as HscDatabase;
const conversion = conversionJson as SyllabusConversion;

const configs: PaperImportConfig[] = [
  {
    paperId: "std1-2025",
    sourcePackId: "source-std-2025",
    courseId: "standard",
    courseName: "Mathematics Standard 1",
    sourceRef: "2025 HSC Mathematics Standard 1 marking feedback",
    examTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-exam-paper-2025-hsc-maths-standard-1.txt",
    markingGuideTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-guide-2025-hsc-maths-standard-1-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-feedback-2025-hsc-maths-std-1-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-standard/2025",
    sectionIQuestionCount: 10,
    sectionIStartIndexes: [53, 69, 101, 131, 170, 279, 314, 340, 388, 425],
    sectionIIQuestionNumbers: range(11, 28),
    sectionIIStartIndexes: [
      519, 567, 613, 679, 820, 966, 1014, 1062, 1123, 1205, 1348, 1391, 1479, 1536, 1593, 1644, 1688, 1749
    ],
    endIndex: 1803,
    expectedQuestionCount: 28
  },
  {
    paperId: "std2-2025",
    sourcePackId: "source-std-2025",
    courseId: "standard",
    courseName: "Mathematics Standard 2",
    sourceRef: "2025 HSC Mathematics Standard 2 marking feedback",
    examTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-exam-paper-2025-hsc-maths-standard-2.txt",
    markingGuideTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-guide-2025-hsc-maths-standard-2-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-feedback-2025-hsc-maths-std-2-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-standard/2025",
    sectionIQuestionCount: 15,
    sectionIStartIndexes: [53, 81, 118, 153, 178, 274, 353, 375, 423, 441, 529, 548, 574, 600, 653],
    sectionIIQuestionNumbers: range(16, 40),
    sectionIIStartIndexes: [
      748, 793, 884, 972, 1070, 1180, 1236, 1381, 1441, 1485, 1626, 1738, 1781, 1854, 1873, 1931, 2002, 2067,
      2125, 2246, 2327, 2388, 2445, 2500, 2602
    ],
    endIndex: 2662,
    expectedQuestionCount: 40
  },
  {
    paperId: "ext1-2025",
    sourcePackId: "source-ext1-2025",
    courseId: "extension-1",
    courseName: "Mathematics Extension 1",
    sourceRef: "2025 HSC Mathematics Extension 1 marking feedback",
    examTextPath:
      "var/extracted-text/source-ext1-2025/source-ext1-2025-exam-paper-2025-hsc-maths-extension-1.txt",
    markingGuideTextPath:
      "var/extracted-text/source-ext1-2025/source-ext1-2025-marking-guide-2025-hsc-maths-extension-1-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-ext1-2025/source-ext1-2025-marking-feedback-2025-hsc-maths-ext-1-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-extension-1/2025",
    sectionIQuestionCount: 10,
    sectionIStartIndexes: [53, 127, 263, 388, 533, 572, 658, 734, 837, 920],
    sectionIIQuestionNumbers: range(11, 14),
    sectionIIStartIndexes: [1018, 1233, 1478, 1769],
    endIndex: 2080,
    expectedQuestionCount: 14
  },
  {
    paperId: "ext2-2025",
    sourcePackId: "source-ext2-2025",
    courseId: "extension-2",
    courseName: "Mathematics Extension 2",
    sourceRef: "2025 HSC Mathematics Extension 2 marking feedback",
    examTextPath:
      "var/extracted-text/source-ext2-2025/source-ext2-2025-exam-paper-2025-hsc-maths-extension-2.txt",
    markingGuideTextPath:
      "var/extracted-text/source-ext2-2025/source-ext2-2025-marking-guide-2025-hsc-maths-extension-2-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-ext2-2025/source-ext2-2025-marking-feedback-2025-hsc-maths-ext-2-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-extension-2/2025",
    sectionIQuestionCount: 10,
    sectionIStartIndexes: [70, 170, 247, 331, 377, 496, 548, 729, 774, 869],
    sectionIIQuestionNumbers: range(11, 16),
    sectionIIStartIndexes: [1009, 1303, 1599, 1846, 2218, 2472],
    endIndex: 2875,
    expectedQuestionCount: 16
  }
];

promoteSyllabusNodes();

const paperIds = new Set(configs.map((config) => config.paperId));
database.questions = database.questions.filter((question) => !paperIds.has(question.paperId));

const importedCountsByPack = new Map<string, number>();

for (const config of configs) {
  const questions = await buildQuestions(config);
  database.questions.push(...questions);
  importedCountsByPack.set(
    config.sourcePackId,
    (importedCountsByPack.get(config.sourcePackId) ?? 0) + questions.length
  );
  updatePaper(config.paperId);
  console.log(
    `${config.paperId}: promoted ${questions.length}/${config.expectedQuestionCount} draft records`
  );
}

for (const [packId, importedCount] of importedCountsByPack.entries()) {
  const expectedCount = configs
    .filter((config) => config.sourcePackId === packId)
    .reduce((sum, config) => sum + config.expectedQuestionCount, 0);
  updateSourcePack(packId, expectedCount, importedCount);
}

database.meta.version = "0.9.0";
database.meta.updatedAt = "2026-06-06";
database.meta.sourceSummary =
  "Validated corpus linking NSW mathematics exam-pack sources, 2025 Standard and Extension draft imports, the Mathematics archive, 2017 syllabus nodes, and 2024 syllabus conversion nodes.";

await writeFile("src/data/hsc-math-advanced.json", `${JSON.stringify(database, null, 2)}\n`, "utf-8");

async function buildQuestions(config: PaperImportConfig): Promise<Question[]> {
  const examLines = await readLines(config.examTextPath);
  const guideLines = await readLines(config.markingGuideTextPath);
  const feedbackLines = await readLines(config.markingFeedbackTextPath);
  const answerKey = parseAnswerKey(guideLines);
  const guideBlocks = parseQuestionBlocks(guideLines);
  const feedbackBlocks = parseFeedbackBlocks(feedbackLines, config.sourceRef);
  const questions: Question[] = [];

  for (let questionNumber = 1; questionNumber <= config.sectionIQuestionCount; questionNumber += 1) {
    const start = config.sectionIStartIndexes[questionNumber - 1];
    const end = config.sectionIStartIndexes[questionNumber] ?? config.sectionIIStartIndexes[0];
    const block = sliceLines(examLines, start, end);
    const prompt = cleanPrompt(block.map((line) => line.text));
    const node = selectSyllabusNode(config.courseId, prompt, true);

    questions.push({
      id: `${config.paperId}-q${questionNumber.toString().padStart(2, "0")}-${slug(node.title)}`,
      paperId: config.paperId,
      year: 2025,
      questionNumber: `Q${questionNumber}`,
      title: titleForQuestion(prompt, node, "Multiple-choice"),
      marks: 1,
      style: "multiple-choice",
      topic: node.topic,
      subtopic: node.title,
      syllabusNodeIds: [node.id],
      promptLatex: prompt,
      answerLatex: `Official answer: ${answerKey.get(questionNumber.toString()) ?? "not extracted"}.`,
      workingLatex: [],
      tags: ["official-draft", "2025", "multiple-choice", config.courseName],
      assets: [],
      source: {
        examPackUrl: config.examPackUrl,
        pageRef: pageRef(block),
        markingGuideRef: "Marking guidelines page 1",
        transcriptionStatus: "draft"
      }
    });
  }

  config.sectionIIQuestionNumbers.forEach((questionNumber, questionIndex) => {
    const start = config.sectionIIStartIndexes[questionIndex];
    const end = config.sectionIIStartIndexes[questionIndex + 1] ?? config.endIndex;
    const block = sliceLines(examLines, start, end);
    const prompt = cleanPrompt(block.map((line) => line.text));
    const guideBlock = guideBlocks.get(questionNumber.toString()) ?? [];
    const feedback = feedbackBlocks.get(questionNumber.toString());
    const node = selectSyllabusNode(config.courseId, prompt, false);
    const marks = extractMarks(prompt);

    questions.push({
      id: `${config.paperId}-q${questionNumber.toString().padStart(2, "0")}-${slug(node.title)}`,
      paperId: config.paperId,
      year: 2025,
      questionNumber: `Q${questionNumber}`,
      title: titleForQuestion(prompt, node, "Question"),
      marks,
      style: marks >= 5 ? "extended-response" : "short-answer",
      topic: node.topic,
      subtopic: node.title,
      syllabusNodeIds: [node.id],
      promptLatex: prompt,
      answerLatex: cleanAnswer(guideBlock.map((line) => line.text)),
      workingLatex: [],
      markingFeedback: feedback,
      tags: ["official-draft", "2025", "section-ii", config.courseName],
      assets: [],
      source: {
        examPackUrl: config.examPackUrl,
        pageRef: pageRef(block),
        markingGuideRef: pageRef(guideBlock, "Marking guidelines pages"),
        transcriptionStatus: "draft"
      }
    });
  });

  return questions;
}

function promoteSyllabusNodes() {
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
  console.log(`Promoted ${newNodes.length} non-Advanced syllabus nodes`);
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

function selectSyllabusNode(
  courseId: PaperImportConfig["courseId"],
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

async function readLines(filePath: string): Promise<Line[]> {
  const rawLines = (await readFile(filePath, "utf-8")).split(/\r?\n/);
  const lines: Line[] = [];
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

function parseAnswerKey(lines: Line[]): Map<string, string> {
  const answerKey = new Map<string, string>();
  const compact = lines
    .map((line) => line.text)
    .filter(Boolean)
    .slice(0, 80);
  const start = compact.findIndex((line) => line === "Multiple-choice Answer Key");

  for (let index = Math.max(0, start); index < compact.length - 1; index += 1) {
    if (/^\d{1,2}$/.test(compact[index]) && /^[A-D]$/.test(compact[index + 1])) {
      answerKey.set(compact[index], compact[index + 1]);
      index += 1;
    }
  }

  return answerKey;
}

function parseQuestionBlocks(lines: Line[]): Map<string, Line[]> {
  const mappingStart = findMappingGridStart(lines);
  const starts = findQuestionStarts(lines).filter((start) => start.index < mappingStart);
  const blocks = new Map<string, Line[]>();

  starts.forEach((start, index) => {
    const end = Math.min(starts[index + 1]?.index ?? mappingStart, mappingStart);
    const questionNumber = start.questionNumber;
    const current = blocks.get(questionNumber) ?? [];
    blocks.set(questionNumber, [...current, ...sliceLines(lines, start.index, end)]);
  });

  return blocks;
}

function findMappingGridStart(lines: Line[]): number {
  const directMatch = lines.find((line) => line.text.includes("Mapping Grid"));
  if (directMatch) return directMatch.index;

  const splitMatch = lines.find((line, arrayIndex) => {
    if (line.text !== "Mapping") return false;
    const nextMeaningfulLine = lines.slice(arrayIndex + 1).find((candidate) => candidate.text);
    return nextMeaningfulLine?.text === "Grid";
  });

  return splitMatch?.index ?? lines.length;
}

function parseFeedbackBlocks(lines: Line[], sourceRef: string): Map<string, Question["markingFeedback"]> {
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
      if (current.length > 0) items.push(cleanText(current));
      current = [];
      return;
    }
    if (!isNoiseLine(line)) current.push(line);
  });

  if (current.length > 0) items.push(cleanText(current));
  return items.filter(Boolean);
}

function findQuestionStarts(lines: Line[]): Array<{ index: number; questionNumber: string }> {
  return lines
    .filter((line) => /^Question\s+\d{1,2}(?:\s+\([a-ziv]+\))?$/.test(line.text))
    .map((line) => ({
      index: line.index,
      questionNumber: line.text.match(/\d{1,2}/)?.[0] ?? ""
    }))
    .filter((start) => start.questionNumber);
}

function sliceLines(lines: Line[], start: number, end: number): Line[] {
  return lines.filter((line) => line.index >= start && line.index < end);
}

function cleanPrompt(lines: string[]): string {
  const cleaned = lines.filter((line) => !isNoiseLine(line));
  return cleanText(cleaned);
}

function cleanAnswer(lines: string[]): string {
  const cleaned = lines.filter((line) => !isNoiseLine(line));
  const answer = cleanText(cleaned);
  return answer
    ? `Official marking guide excerpt: ${answer}`
    : "Official marking-guide answer not extracted.";
}

function cleanText(lines: string[]): string {
  return lines
    .map(normaliseText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseText(value: string): string {
  /* eslint-disable no-irregular-whitespace */
  return value
    .replace(/â€“|–/g, "-")
    .replace(/âˆ’|−/g, "-")
    .replace(/â€¢|•/g, "*")
    .replace(/â‰¥/g, ">=")
    .replace(/â‰¤/g, "<=")
    .replace(/â‰ /g, "!=")
    .replace(/Â·|·/g, ".")
    .replace(/Æ’/g, "f")
    .replace(/Ì°/g, "")
    .replace(/\uFFFD/g, "")
    .trim();
  /* eslint-enable no-irregular-whitespace */
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
    /^2025 HSC$/.test(line) ||
    /^Mathematics .* Marking Guidelines$/.test(line) ||
    /^Marking Guidelines$/.test(line) ||
    /^Criteria$/.test(line) ||
    /^Marks$/.test(line) ||
    /^Sample answer:$/.test(line) ||
    /^Use the Question \d+ Writing Booklet$/.test(line) ||
    /^Use the multiple-choice answer sheet/.test(line) ||
    /^Allow about/.test(line) ||
    /^Attempt Questions/.test(line) ||
    /^Section I/.test(line) ||
    /^Section II/.test(line) ||
    /^For questions in Section II/.test(line) ||
    /^\.+$/.test(line) ||
    /^\d{8,}$/.test(line)
  );
}

function pageRef(lines: Line[], prefix = "Exam paper pages"): string {
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

function containsAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function updatePaper(paperId: string) {
  const paper = database.papers.find((candidate) => candidate.id === paperId);
  if (paper) paper.sourceStatus = "partially-transcribed";
}

function updateSourcePack(packId: string, expectedQuestionCount: number, importedQuestionCount: number) {
  const pack = database.sourcePacks.find((candidate) => candidate.id === packId) as SourcePack | undefined;
  if (!pack) return;
  pack.expectedQuestionCount = expectedQuestionCount;
  pack.importedQuestionCount = importedQuestionCount;
  pack.importStatus = "in-progress";
  pack.assetStatus = "complete";
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
