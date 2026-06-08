import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Database = {
  meta: { version: string; updatedAt: string; sourceSummary: string };
  papers: Array<{ id: string; courseId: string; syllabusEra: string; sourceStatus: string }>;
  sourcePacks: Array<{
    id: string;
    paperId?: string;
    paperIds?: string[];
    importStatus: string;
    importedQuestionCount: number;
    assetStatus: string;
    notes?: string;
  }>;
  syllabus: Array<{
    id: string;
    course: string;
    code: string;
    topic: string;
    title: string;
    content: string;
  }>;
  questions: Question[];
};

type Question = {
  id: string;
  paperId: string;
  year: number;
  questionNumber: string;
  title: string;
  marks: number;
  style: "multiple-choice" | "short-answer" | "extended-response" | "proof" | "modelling";
  topic: string;
  subtopic: string;
  syllabusNodeIds: string[];
  promptLatex: string;
  answerLatex: string;
  workingLatex: string[];
  tags: string[];
  assets: Asset[];
  source: {
    examPackUrl: string;
    pageRef?: string;
    markingGuideRef?: string;
    transcriptionStatus: "draft";
  };
};

type Asset = {
  id: string;
  type: "diagram" | "graph" | "table" | "image";
  label: string;
  alt: string;
  path: string;
  sourceStatus: "exam-derived";
};

type Report = {
  paper: { id: string; year: number; courseName: string; examPackUrl: string };
  sourcePack: { id: string };
  examPageProposals: ExamPageProposal[];
  markingGuidePageProposals: MarkingGuidePageProposal[];
  cropQa: { candidates: CropCandidate[] };
};

type ExamPageProposal = {
  page: number;
  questions: Array<{
    questionNumber: number | string;
    partLabels?: string[];
    promptLatex: string;
    options?: Array<{ label: string; textLatex: string }>;
    marks?: number;
  }>;
};

type MarkingGuidePageProposal = {
  page: number;
  questions: Array<{
    questionNumber: number | string;
    partLabel?: string | null;
    marks?: number;
    answerLatex?: string;
    sampleAnswerLatex?: string;
    markingCriteria?: string[];
    notes?: string[];
  }>;
};

type CropCandidate = {
  id: string;
  questionNumber: number;
  page: number;
  kind: string;
  description: string;
  cropPath: string;
};

const databasePath = "src/data/hsc-math-advanced.json";
const diagramRoot = path.join("public", "assets", "diagrams");

async function main() {
  const paperId = process.argv[2];
  if (!paperId) {
    throw new Error("Usage: pnpm run data:promote-gemini-ingestion -- <paperId>");
  }

  const report = JSON.parse(
    await readFile(path.join("var", "gemini-ingestion-proposals", paperId, "report.json"), "utf8")
  ) as Report;
  const database = JSON.parse(await readFile(databasePath, "utf8")) as Database;
  const paper = database.papers.find((candidate) => candidate.id === paperId);
  if (!paper) {
    throw new Error(`Unknown paper id in database: ${paperId}`);
  }
  const nodeById = new Map(database.syllabus.map((node) => [node.id, node]));
  const syllabusNodes = syllabusNodesForPaper(database.syllabus, paper);

  await mkdir(diagramRoot, { recursive: true });
  const assetsByQuestion = await promoteAssets(report);
  const questions = buildQuestions(report, nodeById, syllabusNodes, assetsByQuestion);

  database.questions = database.questions.filter((question) => question.paperId !== paperId);
  database.questions.push(...questions);
  database.questions.sort(compareQuestions);

  paper.sourceStatus = "complete";

  const sourcePack = database.sourcePacks.find(
    (candidate) =>
      candidate.id === report.sourcePack.id ||
      candidate.paperId === paperId ||
      candidate.paperIds?.includes(paperId)
  );
  if (sourcePack) {
    sourcePack.importStatus = "in-progress";
    const packPaperIds = new Set([sourcePack.paperId, ...(sourcePack.paperIds ?? [])].filter(Boolean));
    sourcePack.importedQuestionCount = database.questions.filter((question) =>
      packPaperIds.size > 0 ? packPaperIds.has(question.paperId) : question.paperId === paperId
    ).length;
    sourcePack.assetStatus = "complete";
    sourcePack.notes =
      "Gemini/Sonnet page-image proposal reviewed and promoted as official draft records with exam-derived assets.";
  }

  database.meta.updatedAt = "2026-06-08";
  await writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  console.log(`${paperId}: promoted ${questions.length} reviewed Gemini draft records`);
}

async function promoteAssets(report: Report): Promise<Map<number, Asset[]>> {
  const assetsByQuestion = new Map<number, Asset[]>();

  for (const candidate of report.cropQa.candidates) {
    const assetType = toAssetType(candidate.kind);
    const assetId = `${report.paper.id}-${candidate.id}`;
    const fileName = `${assetId}.png`;
    await copyFile(candidate.cropPath, path.join(diagramRoot, fileName));
    const asset: Asset = {
      id: assetId,
      type: assetType,
      label: labelForAsset(candidate),
      alt: candidate.description,
      path: `/assets/diagrams/${fileName}`,
      sourceStatus: "exam-derived"
    };
    const existing = assetsByQuestion.get(candidate.questionNumber) ?? [];
    existing.push(asset);
    assetsByQuestion.set(candidate.questionNumber, existing);
  }

  return assetsByQuestion;
}

function buildQuestions(
  report: Report,
  nodeById: Map<string, { id: string; topic: string; title: string }>,
  syllabusNodes: Array<{ id: string; topic: string; title: string; content?: string; code?: string }>,
  assetsByQuestion: Map<number, Asset[]>
): Question[] {
  const questionNumbers = [
    ...new Set(
      report.examPageProposals.flatMap((page) =>
        page.questions.map((question) => toQuestionNumber(question.questionNumber))
      )
    )
  ].filter((value): value is number => value !== undefined);

  return questionNumbers
    .sort((left, right) => left - right)
    .map((questionNumber) => {
      const promptParts = report.examPageProposals
        .flatMap((page) =>
          page.questions
            .filter((question) => toQuestionNumber(question.questionNumber) === questionNumber)
            .map((question) => ({ ...question, page: page.page }))
        )
        .sort(comparePromptParts);
      const answerParts = report.markingGuidePageProposals
        .flatMap((page) =>
          page.questions
            .filter((question) => toQuestionNumber(question.questionNumber) === questionNumber)
            .map((question) => ({ ...question, page: page.page }))
        )
        .filter((part) => Boolean(part.answerLatex?.trim()) || Boolean(part.sampleAnswerLatex?.trim()))
        .sort(compareAnswerParts);
      const promptLatex = promptParts.map(formatPromptPart).filter(Boolean).join("\n\n");
      const answerLatex =
        questionNumber <= multipleChoiceCount(report)
          ? `Official answer: ${answerParts[0]?.answerLatex?.trim() || "not extracted"}.`
          : formatAnswerParts(answerParts);
      const syllabusNodeIds = inferSyllabusNodeIds(syllabusNodes, `${promptLatex}\n${answerLatex}`);
      const primaryNode = nodeById.get(syllabusNodeIds[0]);
      if (!primaryNode) {
        throw new Error(`Missing syllabus node ${syllabusNodeIds[0]} for Q${questionNumber}`);
      }

      const marks = questionNumber <= multipleChoiceCount(report) ? 1 : sumUniquePromptMarks(promptParts);
      const style =
        questionNumber <= multipleChoiceCount(report)
          ? "multiple-choice"
          : marks >= 5
            ? "extended-response"
            : "short-answer";

      return {
        id: `${report.paper.id}-q${questionNumber.toString().padStart(2, "0")}-${slug(primaryNode.title)}`,
        paperId: report.paper.id,
        year: report.paper.year,
        questionNumber: `Q${questionNumber}`,
        title: titleForQuestion(questionNumber, promptLatex),
        marks,
        style,
        topic: primaryNode.topic,
        subtopic: primaryNode.title,
        syllabusNodeIds,
        promptLatex,
        answerLatex,
        workingLatex: questionNumber <= 10 ? [] : buildWorkingParts(answerParts),
        tags: [
          "official-draft",
          report.paper.year.toString(),
          questionNumber <= 10 ? "multiple-choice" : "section-ii",
          report.paper.courseName,
          "gemini-reviewed",
          "auto-promoted"
        ],
        assets: assetsByQuestion.get(questionNumber) ?? [],
        source: {
          examPackUrl: report.paper.examPackUrl,
          pageRef: pageRef(
            promptParts.map((part) => part.page),
            "Exam paper pages"
          ),
          markingGuideRef: pageRef(
            answerParts.map((part) => part.page),
            "Marking guidelines pages"
          ),
          transcriptionStatus: "draft"
        }
      };
    });
}

function multipleChoiceCount(report: Report): number {
  const optionQuestions = new Set<number>();
  for (const page of report.examPageProposals) {
    for (const question of page.questions) {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber !== undefined && (question.options ?? []).length > 0) {
        optionQuestions.add(questionNumber);
      }
    }
  }
  return optionQuestions.size > 0 ? Math.max(...optionQuestions) : 10;
}

function syllabusNodesForPaper(
  syllabus: Database["syllabus"],
  paper: { courseId: string; syllabusEra: string }
): Array<{ id: string; topic: string; title: string; content?: string; code?: string }> {
  const courseLabelById: Record<string, string> = {
    advanced: "Mathematics Advanced Stage 6",
    standard: "Mathematics Standard Stage 6",
    "extension-1": "Mathematics Extension 1 Stage 6",
    "extension-2": "Mathematics Extension 2 Stage 6",
    "mathematics-archive": "Mathematics 2 Unit"
  };
  const courseLabel = courseLabelById[paper.courseId];
  const matches = syllabus.filter((node) => node.course === courseLabel);
  if (matches.length === 0) {
    throw new Error(`No syllabus nodes found for ${paper.courseId}`);
  }
  return matches;
}

function inferSyllabusNodeIds(
  nodes: Array<{ id: string; topic: string; title: string; content?: string; code?: string }>,
  text: string
): string[] {
  const haystack = plainText(text).toLowerCase();
  const scored = nodes
    .map((node) => ({
      node,
      score: keywordScore(haystack, `${node.code ?? ""} ${node.topic} ${node.title} ${node.content ?? ""}`)
    }))
    .sort((left, right) => right.score - left.score);
  const selected = scored.filter((entry) => entry.score > 0).slice(0, 3);
  return (selected.length > 0 ? selected : scored.slice(0, 1)).map((entry) => entry.node.id);
}

function keywordScore(haystack: string, source: string): number {
  return [...new Set(source.toLowerCase().match(/[a-z]{4,}|[0-9]+/g) ?? [])].reduce(
    (score, word) => score + (haystack.includes(word) ? 1 : 0),
    0
  );
}

function formatPromptPart(part: ExamPageProposal["questions"][number] & { page: number }): string {
  const labels = part.partLabels ?? [];
  const label = labels.length > 0 ? `(${labels.join("")}) ` : "";
  const options = (part.options ?? [])
    .map((option) => `${option.label}. ${normaliseOptionLatex(option.textLatex)}`)
    .join("\n");
  return `${label}${part.promptLatex.trim()}${options ? `\n${options}` : ""}`;
}

function normaliseOptionLatex(value: string): string {
  const trimmed = value.trim();
  const displayInsideInline = trimmed.match(/^\\\(\s*\\\[([\s\S]+?)\\\]\s*\\text\{\s*for\s*\}\s*([\s\S]+?)\s*\\\)$/);
  if (displayInsideInline) {
    return `\\(${displayInsideInline[1].trim()}\\) for \\(${displayInsideInline[2].trim()}\\)`;
  }

  return trimmed;
}

function formatAnswerParts(
  parts: Array<MarkingGuidePageProposal["questions"][number] & { page: number }>
): string {
  const lines = ["Official marking guide excerpt:"];
  for (const part of parts) {
    const label = normalisePartLabel(part.partLabel);
    const answerLatex = normaliseGuideLatex(part.answerLatex);
    if (label) {
      lines.push(`${label} ${answerLatex}`.trim());
    } else if (answerLatex) {
      lines.push(answerLatex);
    }
  }
  return lines.join("\n");
}

function buildWorkingParts(
  parts: Array<MarkingGuidePageProposal["questions"][number] & { page: number }>
): string[] {
  return parts.flatMap((part) => {
    const label = normalisePartLabel(part.partLabel);
    const values: string[] = [];
    const sampleAnswerLatex = normaliseGuideLatex(part.sampleAnswerLatex);
    if (sampleAnswerLatex) {
      values.push(`${label ? `${label} ` : ""}${sampleAnswerLatex}`.trim());
    }
    if (part.markingCriteria?.length) {
      values.push(`${label ? `${label} ` : ""}Marking criteria: ${part.markingCriteria.join("; ")}`);
    }
    return values;
  });
}

function normaliseGuideLatex(value?: string | null): string {
  let text = value?.trim() ?? "";
  if (!text) return "";

  text = text
    .replace(/\\begin\{itemize\}/g, "")
    .replace(/\\end\{itemize\}/g, "")
    .replace(/^\s*\\item\s*/gm, "- ")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (hasRawLatexOutsideDelimiters(text) && isMostlyMathematicalGuideText(text)) {
    const displayBody = text
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")
      .replace(/\s*\\\\\s*/g, " \\\\\n")
      .trim();
    return `\\[${displayBody}\\]`;
  }

  return text;
}

function hasRawLatexOutsideDelimiters(value: string): boolean {
  const textOutsideTex = value.replace(/\\\([\s\S]*?\\\)/g, " ").replace(/\\\[[\s\S]*?\\\]/g, " ");
  return /\\[A-Za-z]+|\\\\/.test(textOutsideTex);
}

function isMostlyMathematicalGuideText(value: string): boolean {
  return /\\\\|\\begin\{|\\frac|\\sqrt|\\sin|\\cos|\\tan|\\int|\\sum|\\vec|\\left|\\right|\\begin\{pmatrix\}|\\therefore|\\quad|\\cdot|\\ln|\\angle|\\ell|\\lambda|\\mu/.test(
    value
  );
}

function normalisePartLabel(value?: string | null): string {
  const compact = value?.replace(/\s+/g, "").trim();
  return compact ? `(${compact})` : "";
}

function comparePromptParts(
  left: ExamPageProposal["questions"][number] & { page: number },
  right: ExamPageProposal["questions"][number] & { page: number }
): number {
  return (
    left.page - right.page ||
    (left.partLabels ?? []).join("").localeCompare((right.partLabels ?? []).join(""))
  );
}

function compareAnswerParts(
  left: MarkingGuidePageProposal["questions"][number] & { page: number },
  right: MarkingGuidePageProposal["questions"][number] & { page: number }
): number {
  return left.page - right.page || (left.partLabel ?? "").localeCompare(right.partLabel ?? "");
}

function sumUniquePromptMarks(
  parts: Array<ExamPageProposal["questions"][number] & { page: number }>
): number {
  const total = parts
    .filter((part) => (part.marks ?? 0) > 0)
    .reduce((sum, part) => sum + (part.marks ?? 0), 0);
  return Math.max(1, total);
}

function pageRef(pages: number[], prefix: string): string {
  const uniquePages = [...new Set(pages)].sort((left, right) => left - right);
  return uniquePages.length ? `${prefix} ${compactPageList(uniquePages)}` : prefix;
}

function compactPageList(pages: number[]): string {
  const ranges: string[] = [];
  let start = pages[0];
  let previous = pages[0];

  for (const page of pages.slice(1)) {
    if (page === previous + 1) {
      previous = page;
      continue;
    }
    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = page;
    previous = page;
  }

  ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  return ranges.join(", ");
}

function toQuestionNumber(value: string | number | undefined): number | undefined {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function toAssetType(kind: string): Asset["type"] {
  return kind === "graph" || kind === "table" || kind === "image" ? kind : "diagram";
}

function labelForAsset(candidate: CropCandidate): string {
  const noun = candidate.kind === "graph" || candidate.kind === "table" ? candidate.kind : "diagram";
  return `Question ${candidate.questionNumber} ${noun}`;
}

function titleForQuestion(questionNumber: number, promptLatex: string): string {
  return `Q${questionNumber} ${plainText(promptLatex).slice(0, 86)}`;
}

function plainText(value: string): string {
  return value
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\\[A-Za-z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "question"
  );
}

function compareQuestions(left: Question, right: Question): number {
  return (
    left.year - right.year ||
    left.paperId.localeCompare(right.paperId) ||
    questionSort(left) - questionSort(right)
  );
}

function questionSort(question: Question): number {
  return toQuestionNumber(question.questionNumber) ?? 0;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
