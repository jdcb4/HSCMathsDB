import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { Paper, SourcePack } from "../src/domain/hscSchemas";
import { database } from "../src/services/hscDatabase";
import { getOpenRouterApiKey, loadDotEnv, safeFileName } from "./llm-worked-solution-tools";
import { discoverSourceAssets, filenameForAsset, type DiscoveredSourceAsset } from "./source-asset-discovery";

type Args = {
  paperId: string;
  pages?: string;
  guidePages?: string;
  model: string;
  force: boolean;
  skipLlm: boolean;
};

type RenderedPage = {
  page: number;
  width: number;
  height: number;
  path: string;
};

type RenderedDocument = {
  sourcePdf: string;
  pageCount: number;
  renderedPages: RenderedPage[];
};

type RenderMetadata = {
  packId: string;
  scale: number;
  documents: RenderedDocument[];
};

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: Record<string, unknown>;
};

const defaultModel = "google/gemini-3.1-flash-lite";
const outputRoot = path.join("var", "gemini-ingestion-proposals");

const OptionsSchema = z
  .array(
    z
      .object({
        label: z.string(),
        textLatex: z.string().default("")
      })
      .passthrough()
  )
  .default([]);

const PartLabelsSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [String(value)];
}, z.array(z.string()).default([]));

const VisualKindSchema = z.preprocess(
  (value) => {
    const normalised = String(value ?? "other").toLowerCase();

    if (normalised.includes("graph") || normalised.includes("chart") || normalised.includes("plot")) {
      return "graph";
    }

    if (normalised.includes("table")) {
      return "table";
    }

    if (normalised.includes("image") || normalised.includes("photo")) {
      return "image";
    }

    if (
      normalised.includes("diagram") ||
      normalised.includes("map") ||
      normalised.includes("plan") ||
      normalised.includes("network") ||
      normalised.includes("spinner")
    ) {
      return "diagram";
    }

    return "other";
  },
  z.enum(["diagram", "graph", "table", "image", "other"])
);

const NullableStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");

const BBoxSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  })
  .optional();

const ExamPageProposalSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]),
            partLabels: PartLabelsSchema,
            promptLatex: z.string().default(""),
            options: OptionsSchema,
            marks: z.number().optional(),
            hasVisual: z.boolean().default(false),
            needsAsset: z.boolean().default(false),
            visualDescription: z.string().nullable().optional(),
            confidence: z.number().optional(),
            notes: z.array(z.string()).default([])
          })
          .passthrough()
      )
      .default([]),
    visuals: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]).nullable().optional(),
            kind: VisualKindSchema,
            description: z.string().default(""),
            shouldExtract: z.boolean().default(false),
            confidence: z.number().optional(),
            bbox: BBoxSchema
          })
          .passthrough()
      )
      .default([]),
    pageRisks: z.array(z.string()).default([])
  })
  .passthrough();

const MarkingGuidePageProposalSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]),
            partLabel: z.string().nullable().optional(),
            marks: z.number().optional(),
            answerLatex: NullableStringSchema,
            markingCriteria: z.array(z.string()).default([]),
            sampleAnswerLatex: NullableStringSchema,
            confidence: z.number().optional(),
            notes: z.array(z.string()).default([])
          })
          .passthrough()
      )
      .default([]),
    pageRisks: z.array(z.string()).default([])
  })
  .passthrough();

type ExamPageProposal = z.infer<typeof ExamPageProposalSchema> & {
  page: number;
  imagePath: string;
  rawPath?: string;
  latencyMs: number;
  status: "ok" | "skipped" | "error";
  error?: string;
};

type MarkingGuidePageProposal = z.infer<typeof MarkingGuidePageProposalSchema> & {
  page: number;
  imagePath: string;
  rawPath?: string;
  latencyMs: number;
  status: "ok" | "skipped" | "error";
  error?: string;
};

type QuestionSummary = {
  questionNumber: number;
  examPages: number[];
  markingGuidePages: number[];
  promptPreview: string;
  answerPreview: string;
  hasVisual: boolean;
  needsAsset: boolean;
  visualDescriptions: string[];
  optionCount: number;
  marks?: number;
  averageConfidence?: number;
  flags: string[];
};

type EngineReport = {
  generatedAt: string;
  promptVersion: string;
  model: string;
  paper: {
    id: string;
    year: number;
    courseName: string;
    examPackUrl: string;
  };
  sourcePack: {
    id: string;
    title: string;
    packPageUrl: string;
  };
  sourceAssets: Array<{
    role: string;
    label: string;
    url: string;
    expectedCachePath: string;
  }>;
  renderedDocuments: {
    exam?: string;
    markingGuide?: string;
  };
  totals: {
    examPagesProcessed: number;
    guidePagesProcessed: number;
    questionsWithPrompt: number;
    questionsWithAnswer: number;
    questionsNeedingAssets: number;
    flaggedQuestions: number;
    errors: number;
  };
  examPageProposals: ExamPageProposal[];
  markingGuidePageProposals: MarkingGuidePageProposal[];
  questionSummaries: QuestionSummary[];
};

const promptVersion = "gemini-page-ingestion-v1";

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  const paper = findPaper(args.paperId);
  const pack = findSourcePack(paper);
  const runRoot = path.join(outputRoot, paper.id);
  const rawRoot = path.join(runRoot, "raw");
  const parsedRoot = path.join(runRoot, "parsed");

  await mkdir(rawRoot, { recursive: true });
  await mkdir(parsedRoot, { recursive: true });

  const sourceAssets = await discoverAssets(pack);
  const renderMetadata = await readRenderMetadata(pack);
  const examDocument = findRenderedDocument(renderMetadata, paper, "exam");
  const markingGuideDocument = findRenderedDocument(renderMetadata, paper, "marking-guide");
  const examPages = selectRenderedPages(examDocument, args.pages);
  const guidePages = markingGuideDocument ? selectRenderedPages(markingGuideDocument, args.guidePages) : [];
  const apiKey = args.skipLlm ? undefined : getOpenRouterApiKey();

  const examPageProposals: ExamPageProposal[] = [];
  for (const page of examPages) {
    examPageProposals.push(
      await proposeExamPage({
        apiKey,
        model: args.model,
        paper,
        page,
        rawRoot,
        parsedRoot,
        force: args.force,
        skipLlm: args.skipLlm
      })
    );
  }

  const markingGuidePageProposals: MarkingGuidePageProposal[] = [];
  for (const page of guidePages) {
    markingGuidePageProposals.push(
      await proposeMarkingGuidePage({
        apiKey,
        model: args.model,
        paper,
        page,
        rawRoot,
        parsedRoot,
        force: args.force,
        skipLlm: args.skipLlm
      })
    );
  }

  const questionSummaries = reconcileQuestions(examPageProposals, markingGuidePageProposals);
  const report: EngineReport = {
    generatedAt: new Date().toISOString(),
    promptVersion,
    model: args.model,
    paper: {
      id: paper.id,
      year: paper.year,
      courseName: paper.courseName,
      examPackUrl: paper.examPackUrl
    },
    sourcePack: {
      id: pack.id,
      title: pack.title,
      packPageUrl: pack.packPageUrl
    },
    sourceAssets,
    renderedDocuments: {
      exam: normalisePath(examDocument.sourcePdf),
      markingGuide: markingGuideDocument ? normalisePath(markingGuideDocument.sourcePdf) : undefined
    },
    totals: {
      examPagesProcessed: examPageProposals.length,
      guidePagesProcessed: markingGuidePageProposals.length,
      questionsWithPrompt: questionSummaries.filter((summary) => summary.promptPreview).length,
      questionsWithAnswer: questionSummaries.filter((summary) => summary.answerPreview).length,
      questionsNeedingAssets: questionSummaries.filter((summary) => summary.needsAsset).length,
      flaggedQuestions: questionSummaries.filter((summary) => summary.flags.length > 0).length,
      errors: [...examPageProposals, ...markingGuidePageProposals].filter(
        (proposal) => proposal.status === "error"
      ).length
    },
    examPageProposals,
    markingGuidePageProposals,
    questionSummaries
  };

  await writeFile(path.join(runRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(runRoot, "report.html"), buildReportHtml(report), "utf8");

  printSummary(report, runRoot);
}

function parseArgs(values: string[]): Args {
  const args: Args = {
    paperId: "",
    model: defaultModel,
    force: false,
    skipLlm: false
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--pages") {
      args.pages = values[index + 1];
      index += 1;
    } else if (value === "--guide-pages") {
      args.guidePages = values[index + 1];
      index += 1;
    } else if (value === "--model") {
      args.model = values[index + 1] ?? "";
      index += 1;
    } else if (value === "--force") {
      args.force = true;
    } else if (value === "--skip-llm") {
      args.skipLlm = true;
    } else if (!args.paperId) {
      args.paperId = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }

  if (!args.paperId) {
    throw new Error(
      "Usage: pnpm run data:propose-gemini-ingestion -- <paperId> [--pages 2-6] [--guide-pages 1-5]"
    );
  }

  if (!args.model) {
    throw new Error("--model must not be empty");
  }

  return args;
}

function findPaper(paperId: string): Paper {
  const paper = database.papers.find((candidate) => candidate.id === paperId);
  if (!paper) {
    throw new Error(`Unknown paper id: ${paperId}`);
  }
  return paper;
}

function findSourcePack(paper: Paper): SourcePack {
  const pack = database.sourcePacks.find(
    (candidate) => candidate.paperId === paper.id || candidate.paperIds?.includes(paper.id)
  );
  if (!pack) {
    throw new Error(`No source pack references paper ${paper.id}`);
  }
  return pack;
}

async function discoverAssets(pack: SourcePack): Promise<EngineReport["sourceAssets"]> {
  const assets =
    pack.assets.length > 0 ? pack.assets.filter((asset) => asset.url) : await discoverSourceAssets(pack);
  return assets.filter(isDownloadablePdfAsset).map((asset) => ({
    role: asset.role,
    label: asset.label,
    url: asset.url,
    expectedCachePath: normalisePath(
      path.join("var", "source-assets", pack.id, filenameForAsset(pack, asset))
    )
  }));
}

function isDownloadablePdfAsset(
  asset: SourcePack["assets"][number] | DiscoveredSourceAsset
): asset is DiscoveredSourceAsset {
  return (
    typeof asset.url === "string" &&
    (asset.role === "exam-paper" || asset.role === "marking-guide" || asset.role === "marking-feedback")
  );
}

async function readRenderMetadata(pack: SourcePack): Promise<RenderMetadata> {
  const metadataPath = path.join("var", "rendered-pages", pack.id, "metadata.json");
  if (!existsSync(metadataPath)) {
    throw new Error(
      `Missing render metadata at ${metadataPath}. Run: pnpm run data:render-pages -- ${pack.id} --all-documents`
    );
  }

  return JSON.parse(await readFile(metadataPath, "utf8")) as RenderMetadata;
}

function findRenderedDocument(metadata: RenderMetadata, paper: Paper, role: "exam" | "marking-guide") {
  const matches = metadata.documents.filter((document) => {
    const basename = path.basename(document.sourcePdf).toLowerCase();
    const paperMatches = documentMatchesPaper(basename, paper);
    const roleMatches =
      role === "exam"
        ? basename.includes("exam-paper") || (basename.includes("exam") && !basename.includes("mg"))
        : basename.includes("marking-guide") || basename.includes("-mg") || basename.endsWith("mg.pdf");
    return paperMatches && roleMatches;
  });

  if (matches.length === 0) {
    throw new Error(`Could not find rendered ${role} document for ${paper.id}`);
  }

  if (matches.length > 1) {
    const options = matches.map((match) => normalisePath(match.sourcePdf)).join(", ");
    throw new Error(`Ambiguous rendered ${role} document for ${paper.id}: ${options}`);
  }

  return matches[0];
}

function documentMatchesPaper(basename: string, paper: Paper): boolean {
  if (paper.id.includes("std1")) {
    return /std(?:andard)?-?1|standard-?1/.test(basename);
  }

  if (paper.id.includes("std2")) {
    return /std(?:andard)?-?2|standard-?2/.test(basename);
  }

  if (paper.id.includes("ext1")) {
    return /ext(?:ension)?-?1|extension-?1/.test(basename);
  }

  if (paper.id.includes("ext2")) {
    return /ext(?:ension)?-?2|extension-?2/.test(basename);
  }

  return basename.includes(paper.year.toString());
}

function selectRenderedPages(document: RenderedDocument, pages?: string): RenderedPage[] {
  const selectedNumbers = parsePageSelection(document.pageCount, pages);
  const byNumber = new Map(document.renderedPages.map((page) => [page.page, page]));
  return selectedNumbers.map((pageNumber) => {
    const page = byNumber.get(pageNumber);
    if (!page) {
      throw new Error(`Page ${pageNumber} was not rendered for ${document.sourcePdf}`);
    }
    return page;
  });
}

function parsePageSelection(pageCount: number, pages?: string): number[] {
  if (!pages) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const selected = new Set<number>();
  for (const part of pages.split(",")) {
    const range = part.trim();
    if (!range) {
      continue;
    }

    const [startText, endText] = range.split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : start;

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > pageCount) {
      throw new Error(`Invalid page range "${range}" for ${pageCount}-page document`);
    }

    for (let page = start; page <= end; page += 1) {
      selected.add(page);
    }
  }

  return [...selected].sort((left, right) => left - right);
}

async function proposeExamPage({
  apiKey,
  model,
  paper,
  page,
  rawRoot,
  parsedRoot,
  force,
  skipLlm
}: {
  apiKey?: string;
  model: string;
  paper: Paper;
  page: RenderedPage;
  rawRoot: string;
  parsedRoot: string;
  force: boolean;
  skipLlm: boolean;
}): Promise<ExamPageProposal> {
  const startedAt = Date.now();
  const stem = `${safeFileName(paper.id)}__exam-page-${page.page.toString().padStart(3, "0")}__${safeFileName(model)}`;
  const rawPath = path.join(rawRoot, `${stem}.json`);
  const parsedPath = path.join(parsedRoot, `${stem}.json`);

  try {
    if (skipLlm) {
      return skippedExamPage(page, rawPath, startedAt);
    }

    const response = !force ? await readCachedRaw(rawPath) : undefined;
    const completion =
      response ??
      (await callOpenRouterJson({
        apiKey: requireApiKey(apiKey),
        model,
        title: "GoalCheck HSC Gemini ingestion proposal",
        maxTokens: 5000,
        messages: [
          {
            role: "system",
            content:
              "You transcribe NSW HSC mathematics exam pages into strict JSON proposals for a reviewed ingestion pipeline. Return JSON only."
          },
          {
            role: "user",
            content: [
              { type: "text", text: buildExamPagePrompt(paper, page) },
              { type: "image_url", image_url: { url: await imageDataUrl(page.path) } }
            ]
          }
        ]
      }));

    if (!response) {
      await writeFile(rawPath, `${JSON.stringify(completion.raw, null, 2)}\n`, "utf8");
    }

    const parsed = ExamPageProposalSchema.parse(parseModelJson(completion.content));
    const proposal: ExamPageProposal = {
      ...parsed,
      page: page.page,
      imagePath: normalisePath(page.path),
      rawPath: normalisePath(rawPath),
      latencyMs: Date.now() - startedAt,
      status: "ok"
    };
    await writeFile(parsedPath, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
    return proposal;
  } catch (error: unknown) {
    return {
      questions: [],
      visuals: [],
      pageRisks: [],
      page: page.page,
      imagePath: normalisePath(page.path),
      rawPath: normalisePath(rawPath),
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function proposeMarkingGuidePage({
  apiKey,
  model,
  paper,
  page,
  rawRoot,
  parsedRoot,
  force,
  skipLlm
}: {
  apiKey?: string;
  model: string;
  paper: Paper;
  page: RenderedPage;
  rawRoot: string;
  parsedRoot: string;
  force: boolean;
  skipLlm: boolean;
}): Promise<MarkingGuidePageProposal> {
  const startedAt = Date.now();
  const stem = `${safeFileName(paper.id)}__guide-page-${page.page.toString().padStart(3, "0")}__${safeFileName(model)}`;
  const rawPath = path.join(rawRoot, `${stem}.json`);
  const parsedPath = path.join(parsedRoot, `${stem}.json`);

  try {
    if (skipLlm) {
      return skippedGuidePage(page, rawPath, startedAt);
    }

    const response = !force ? await readCachedRaw(rawPath) : undefined;
    const completion =
      response ??
      (await callOpenRouterJson({
        apiKey: requireApiKey(apiKey),
        model,
        title: "GoalCheck HSC Gemini marking guide proposal",
        maxTokens: 5000,
        messages: [
          {
            role: "system",
            content:
              "You extract NSW HSC mathematics marking guideline pages into strict JSON proposals for a reviewed ingestion pipeline. Return JSON only."
          },
          {
            role: "user",
            content: [
              { type: "text", text: buildGuidePagePrompt(paper, page) },
              { type: "image_url", image_url: { url: await imageDataUrl(page.path) } }
            ]
          }
        ]
      }));

    if (!response) {
      await writeFile(rawPath, `${JSON.stringify(completion.raw, null, 2)}\n`, "utf8");
    }

    const parsed = MarkingGuidePageProposalSchema.parse(parseModelJson(completion.content));
    const proposal: MarkingGuidePageProposal = {
      ...parsed,
      page: page.page,
      imagePath: normalisePath(page.path),
      rawPath: normalisePath(rawPath),
      latencyMs: Date.now() - startedAt,
      status: "ok"
    };
    await writeFile(parsedPath, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
    return proposal;
  } catch (error: unknown) {
    return {
      questions: [],
      pageRisks: [],
      page: page.page,
      imagePath: normalisePath(page.path),
      rawPath: normalisePath(rawPath),
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function skippedExamPage(page: RenderedPage, rawPath: string, startedAt: number): ExamPageProposal {
  return {
    questions: [],
    visuals: [],
    pageRisks: ["LLM call skipped by --skip-llm."],
    page: page.page,
    imagePath: normalisePath(page.path),
    rawPath: normalisePath(rawPath),
    latencyMs: Date.now() - startedAt,
    status: "skipped"
  };
}

function skippedGuidePage(page: RenderedPage, rawPath: string, startedAt: number): MarkingGuidePageProposal {
  return {
    questions: [],
    pageRisks: ["LLM call skipped by --skip-llm."],
    page: page.page,
    imagePath: normalisePath(page.path),
    rawPath: normalisePath(rawPath),
    latencyMs: Date.now() - startedAt,
    status: "skipped"
  };
}

function buildExamPagePrompt(paper: Paper, page: RenderedPage): string {
  return `Transcribe this rendered exam page for ${paper.courseName} ${paper.year}.

Known context:
- paperId: ${paper.id}
- rendered PDF page: ${page.page}
- image size: ${page.width} x ${page.height} pixels

Return this JSON shape:
{
  "questions": [
    {
      "questionNumber": 1,
      "partLabels": ["a"],
      "promptLatex": "near-verbatim question text with TeX for every mathematical expression",
      "options": [{"label": "A", "textLatex": "option text"}],
      "marks": 1,
      "hasVisual": false,
      "needsAsset": false,
      "visualDescription": null,
      "confidence": 0.0,
      "notes": []
    }
  ],
  "visuals": [
    {
      "questionNumber": 1,
      "kind": "graph",
      "description": "what the visual shows",
      "shouldExtract": true,
      "confidence": 0.0,
      "bbox": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ],
  "pageRisks": []
}

Rules:
- Preserve source wording where possible.
- Use MathJax-ready TeX for maths, with \\( ... \\) for inline maths and \\[ ... \\] for display maths.
- Do not use dollar delimiters. Currency may be written as \\(\\$2500\\).
- Option text must follow the same delimiter rule, for example \\(5\\text{ km}\\), not raw 5 \\text{ km}.
- Keep multiple-choice options in the options array and do not flatten them into the prompt.
- Ignore page headers, footers, copyright text, office-use text, blank-page notices, and answer-writing lines unless they are part of a question.
- If a source graph, table, diagram, map, network, spinner, graph option set, or floor plan is shown and needed to answer, set hasVisual and needsAsset true.
- Give approximate pixel bbox values for extractable visuals when possible.
- If the page has no question content, return empty arrays.`;
}

function buildGuidePagePrompt(paper: Paper, page: RenderedPage): string {
  return `Extract marking-guide content from this rendered page for ${paper.courseName} ${paper.year}.

Known context:
- paperId: ${paper.id}
- rendered PDF page: ${page.page}
- image size: ${page.width} x ${page.height} pixels

Return this JSON shape:
{
  "questions": [
    {
      "questionNumber": 1,
      "partLabel": "a",
      "marks": 2,
      "answerLatex": "official answer or sample answer with MathJax-ready TeX",
      "markingCriteria": ["criterion text"],
      "sampleAnswerLatex": "sample answer if separately shown",
      "confidence": 0.0,
      "notes": []
    }
  ],
  "pageRisks": []
}

Rules:
- Preserve official marking-guide wording where possible.
- Use MathJax-ready TeX for maths, with \\( ... \\) for inline maths and \\[ ... \\] for display maths.
- Do not use dollar delimiters. Currency may be written as \\(\\$2500\\).
- Answer and sample-answer fields must follow the same delimiter rule, for example \\(\\bar{x}=\\$60\\,200\\), not raw \\bar{x}=\\$60\\,200.
- Keep question numbers and part labels explicit.
- Ignore page headers, footers, and generic marking advice unless it belongs to a question.
- Ignore syllabus mapping/reference pages unless they also show question-specific answers or marking criteria.
- Do not put syllabus-reference notes such as content codes into question notes.
- If the page has only an answer key, return one question entry per key row.
- If the page has no question-specific marking content, return empty arrays.`;
}

async function callOpenRouterJson({
  apiKey,
  model,
  title,
  maxTokens,
  messages
}: {
  apiKey: string;
  model: string;
  title: string;
  maxTokens: number;
  messages: Array<{ role: "system"; content: string } | { role: "user"; content: unknown }>;
}): Promise<{ content: string; raw: OpenRouterResponse }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  const body: Record<string, unknown> = {
    model,
    temperature: 0.1,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": title
    },
    body: JSON.stringify(body),
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  const raw = (await response
    .json()
    .catch(async () => ({ rawText: await response.text() }))) as OpenRouterResponse;

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(raw)}`);
  }

  const content = raw.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`OpenRouter returned non-string content for ${model}`);
  }

  return { content, raw };
}

async function readCachedRaw(
  rawPath: string
): Promise<{ content: string; raw: OpenRouterResponse } | undefined> {
  if (!existsSync(rawPath)) {
    return undefined;
  }

  const raw = JSON.parse(await readFile(rawPath, "utf8")) as OpenRouterResponse;
  const content = raw.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return undefined;
  }
  return { content, raw };
}

function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const unfenced = fenced?.[1] ?? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const withoutJsonLabel = unfenced.replace(/^json\s*/i, "").trim();
  const objectText = repairTexJsonEscapes(extractFirstJsonObject(withoutJsonLabel));

  try {
    return JSON.parse(objectText);
  } catch {
    return JSON.parse(repairJsonEscapes(objectText));
  }
}

function extractFirstJsonObject(value: string): string {
  const start = value.indexOf("{");
  if (start === -1) {
    return value;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, index + 1);
      }
    }
  }

  return value.slice(start);
}

function repairJsonEscapes(value: string): string {
  return value.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
}

function repairTexJsonEscapes(value: string): string {
  return value.replace(
    /(?<!\\)\\(?=(?:alpha|beta|theta|pi|sin|cos|tan|ln|log|frac|dfrac|sqrt|left|right|text|times|cdot|to|approx|leq|geq|neq|infty|operatorname|overline|bar|hat|vec|mathbf|mathrm|begin|end)\b)/g,
    "\\\\"
  );
}

async function imageDataUrl(imagePath: string): Promise<string> {
  const base64 = (await readFile(imagePath)).toString("base64");
  return `data:image/png;base64,${base64}`;
}

function reconcileQuestions(
  examPageProposals: ExamPageProposal[],
  markingGuidePageProposals: MarkingGuidePageProposal[]
): QuestionSummary[] {
  const summaries = new Map<number, QuestionSummary>();

  for (const proposal of examPageProposals) {
    for (const question of proposal.questions) {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber === undefined) {
        continue;
      }

      const summary = getQuestionSummary(summaries, questionNumber);
      addUnique(summary.examPages, proposal.page);
      summary.promptPreview ||= truncateText(question.promptLatex, 500);
      summary.optionCount = Math.max(summary.optionCount, question.options.length);
      summary.hasVisual ||= question.hasVisual;
      summary.needsAsset ||= question.needsAsset;
      summary.marks ??= question.marks;
      if (question.visualDescription) {
        addUnique(summary.visualDescriptions, question.visualDescription);
      }
      addConfidence(summary, question.confidence);
      auditMathSyntax(question.promptLatex, `exam page ${proposal.page} prompt`, summary);
      question.options.forEach((option) => {
        auditMathSyntax(option.textLatex, `exam page ${proposal.page} option ${option.label}`, summary);
      });
      addRiskNotes(question.notes, `exam page ${proposal.page}`, summary);
    }

    for (const visual of proposal.visuals) {
      const questionNumber = toQuestionNumber(visual.questionNumber ?? undefined);
      if (questionNumber === undefined) {
        continue;
      }

      const summary = getQuestionSummary(summaries, questionNumber);
      addUnique(summary.examPages, proposal.page);
      summary.hasVisual = true;
      summary.needsAsset ||= visual.shouldExtract;
      if (visual.description) {
        addUnique(summary.visualDescriptions, visual.description);
      }
      addConfidence(summary, visual.confidence);
    }
  }

  for (const proposal of markingGuidePageProposals) {
    for (const question of proposal.questions) {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber === undefined) {
        continue;
      }

      const summary = getQuestionSummary(summaries, questionNumber);
      addUnique(summary.markingGuidePages, proposal.page);
      summary.answerPreview ||= truncateText(question.answerLatex || question.sampleAnswerLatex || "", 500);
      summary.marks ??= question.marks;
      addConfidence(summary, question.confidence);
      auditMathSyntax(question.answerLatex, `guide page ${proposal.page} answer`, summary);
      if (question.sampleAnswerLatex) {
        auditMathSyntax(question.sampleAnswerLatex, `guide page ${proposal.page} sample answer`, summary);
      }
      question.markingCriteria.forEach((criterion, index) => {
        auditMathSyntax(criterion, `guide page ${proposal.page} criterion ${index + 1}`, summary);
      });
      addRiskNotes(question.notes, `guide page ${proposal.page}`, summary);
    }
  }

  for (const summary of summaries.values()) {
    if (!summary.promptPreview) {
      addFlag(summary, "No exam prompt proposal found in processed pages.");
    }
    if (!summary.answerPreview) {
      addFlag(summary, "No marking-guide answer proposal found in processed pages.");
    }
    if (summary.needsAsset && summary.visualDescriptions.length === 0) {
      addFlag(summary, "Question is marked as needing an asset but has no visual description.");
    }
    if (summary.averageConfidence !== undefined && summary.averageConfidence < 0.75) {
      addFlag(summary, `Low average confidence: ${summary.averageConfidence.toFixed(2)}.`);
    }
  }

  return [...summaries.values()].sort((left, right) => left.questionNumber - right.questionNumber);
}

function getQuestionSummary(
  summaries: Map<number, QuestionSummary>,
  questionNumber: number
): QuestionSummary {
  const existing = summaries.get(questionNumber);
  if (existing) {
    return existing;
  }

  const created: QuestionSummary = {
    questionNumber,
    examPages: [],
    markingGuidePages: [],
    promptPreview: "",
    answerPreview: "",
    hasVisual: false,
    needsAsset: false,
    visualDescriptions: [],
    optionCount: 0,
    flags: []
  };
  summaries.set(questionNumber, created);
  return created;
}

function addConfidence(summary: QuestionSummary, confidence?: number) {
  if (confidence === undefined || !Number.isFinite(confidence)) {
    return;
  }

  const existing = summary.averageConfidence;
  summary.averageConfidence = existing === undefined ? confidence : (existing + confidence) / 2;
}

function addFlag(summary: QuestionSummary, flag: string) {
  addUnique(summary.flags, flag);
}

function addRiskNotes(notes: string[], context: string, summary: QuestionSummary) {
  notes
    .filter((note) =>
      /risk|uncertain|unclear|missing|illegible|ambiguous|implied|cannot|partial|cropped|truncated/i.test(
        note
      )
    )
    .forEach((note) => addFlag(summary, `${context}: ${note}`));
}

function auditMathSyntax(value: string, context: string, summary: QuestionSummary) {
  if (!value.trim()) {
    return;
  }

  const withoutDelimitedMath = value.replace(/\\\([\s\S]*?\\\)/g, "").replace(/\\\[[\s\S]*?\\\]/g, "");

  if (/(^|[^\\])\$/.test(withoutDelimitedMath)) {
    addFlag(summary, `${context} contains an unescaped dollar delimiter or currency symbol outside MathJax.`);
  }

  if (
    /\\(?:frac|dfrac|sqrt|text|times|cdot|approx|leq|geq|neq|infty|operatorname|overline|bar|hat|vec|mathbf|mathrm|begin|end|,|\$)/.test(
      withoutDelimitedMath
    )
  ) {
    addFlag(summary, `${context} contains raw TeX outside MathJax delimiters.`);
  }
}

function addUnique<T>(items: T[], item: T) {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function toQuestionNumber(value: string | number | null | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.match(/\d+/);
  if (!match) {
    return undefined;
  }

  return Number(match[0]);
}

function truncateText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 3)}...`;
}

function requireApiKey(apiKey?: string): string {
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required unless --skip-llm is used.");
  }
  return apiKey;
}

function buildReportHtml(report: EngineReport): string {
  const embedded = serialiseForInlineJson(publicReport(report));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gemini Ingestion Proposal - ${escapeHtml(report.paper.id)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f7f4;
        --ink: #202124;
        --muted: #62625c;
        --line: #d8d7ce;
        --panel: #ffffff;
        --accent: #0b6f68;
        --warn: #7a4b00;
        --bad: #a23b2a;
      }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      header { padding: 24px clamp(18px, 4vw, 48px) 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
      h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
      h2 { margin: 0 0 12px; font-size: 18px; }
      h3 { margin: 0 0 8px; font-size: 15px; }
      p { margin: 0 0 10px; }
      main { padding: 22px clamp(18px, 4vw, 48px) 48px; }
      .grid { display: grid; gap: 14px; }
      .summary { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); margin-bottom: 22px; }
      .card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
      .metric { color: var(--accent); font-size: 24px; font-weight: 700; }
      .muted { color: var(--muted); }
      .pill { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 12px; background: #e8f2ef; color: var(--accent); white-space: nowrap; }
      .pill.warn { background: #eee9df; color: var(--warn); }
      .pill.bad { background: #f8e8e3; color: var(--bad); }
      table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--line); }
      th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 9px 10px; }
      th { color: var(--muted); font-size: 12px; background: #fbfbf8; }
      tr:last-child td { border-bottom: 0; }
      details { margin-top: 8px; }
      img { max-width: min(520px, 100%); border: 1px solid var(--line); background: white; }
      pre { max-height: 280px; overflow: auto; white-space: pre-wrap; background: #1f2328; color: #f5f7fa; border-radius: 6px; padding: 12px; }
      .page-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    </style>
  </head>
  <body>
    <header>
      <h1>Gemini Ingestion Proposal</h1>
      <p class="muted">${escapeHtml(report.paper.courseName)} ${report.paper.year} using ${escapeHtml(report.model)}</p>
    </header>
    <main id="app">Loading proposal...</main>
    <script type="application/json" id="proposal-data">${embedded}</script>
    <script>
      const data = JSON.parse(document.getElementById("proposal-data").textContent);
      const app = document.getElementById("app");
      app.innerHTML = \`
        <section class="grid summary">
          <div class="card"><div class="metric">\${data.totals.examPagesProcessed}</div><div class="muted">exam pages</div></div>
          <div class="card"><div class="metric">\${data.totals.guidePagesProcessed}</div><div class="muted">guide pages</div></div>
          <div class="card"><div class="metric">\${data.questionSummaries.length}</div><div class="muted">question skeletons</div></div>
          <div class="card"><div class="metric">\${data.totals.questionsNeedingAssets}</div><div class="muted">asset candidates</div></div>
          <div class="card"><div class="metric">\${data.totals.flaggedQuestions}</div><div class="muted">flagged questions</div></div>
        </section>
        <section class="card">
          <h2>Question Reconciliation</h2>
          <table>
            <thead><tr><th>Q</th><th>Pages</th><th>Visual</th><th>Prompt</th><th>Answer</th><th>Flags</th></tr></thead>
            <tbody>\${data.questionSummaries.map(renderSummary).join("")}</tbody>
          </table>
        </section>
        <section style="margin-top:22px">
          <h2>Processed Pages</h2>
          <div class="grid page-grid">\${data.examPageProposals.map(renderPage).join("")}</div>
        </section>
      \`;

      function renderSummary(summary) {
        return \`
          <tr>
            <td>\${summary.questionNumber}</td>
            <td>Exam: \${summary.examPages.join(", ") || "-"}<br>Guide: \${summary.markingGuidePages.join(", ") || "-"}</td>
            <td>\${summary.needsAsset ? '<span class="pill warn">asset</span>' : summary.hasVisual ? '<span class="pill">visual</span>' : ""}<br>\${summary.visualDescriptions.map(escapeHtml).join("<br>")}</td>
            <td>\${escapeHtml(summary.promptPreview)}</td>
            <td>\${escapeHtml(summary.answerPreview)}</td>
            <td>\${summary.flags.length ? summary.flags.map((flag) => '<span class="pill bad">' + escapeHtml(flag) + '</span>').join("<br>") : ""}</td>
          </tr>
        \`;
      }

      function renderPage(page) {
        return \`
          <article class="card">
            <h3>Exam page \${page.page} <span class="pill \${page.status === "error" ? "bad" : ""}">\${page.status}</span></h3>
            <p class="muted">\${page.questions.length} question proposal(s), \${page.visuals.length} visual proposal(s)</p>
            <img src="\${page.imageUrl}" alt="Rendered exam page \${page.page}" loading="lazy" />
            <details><summary>JSON</summary><pre>\${escapeHtml(JSON.stringify(page, null, 2))}</pre></details>
          </article>
        \`;
      }

      function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        })[char]);
      }
    </script>
  </body>
</html>
`;
}

function publicReport(report: EngineReport): EngineReport {
  return {
    ...report,
    examPageProposals: report.examPageProposals.map((proposal) => ({
      ...proposal,
      imagePath: normalisePath(proposal.imagePath),
      imageUrl: localFileUrl(proposal.imagePath)
    })) as unknown as ExamPageProposal[],
    markingGuidePageProposals: report.markingGuidePageProposals.map((proposal) => ({
      ...proposal,
      imagePath: normalisePath(proposal.imagePath),
      imageUrl: localFileUrl(proposal.imagePath)
    })) as unknown as MarkingGuidePageProposal[]
  };
}

function localFileUrl(value: string): string {
  return `file:///${path
    .resolve(value)
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):/, "$1:")}`;
}

function serialiseForInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function printSummary(report: EngineReport, runRoot: string) {
  console.log(`Wrote ${normalisePath(path.join(runRoot, "report.json"))}`);
  console.log(`Wrote ${normalisePath(path.join(runRoot, "report.html"))}`);
  console.log(
    `Processed ${report.totals.examPagesProcessed} exam page(s), ${report.totals.guidePagesProcessed} guide page(s), ${report.questionSummaries.length} question skeleton(s).`
  );
  console.log(
    `Questions with assets: ${report.totals.questionsNeedingAssets}; flagged questions: ${report.totals.flaggedQuestions}; page errors: ${report.totals.errors}.`
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return replacements[character] ?? character;
  });
}

function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}
