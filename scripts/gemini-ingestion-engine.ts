import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
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
  repairModel: string;
  visualModel: string;
  cropQaModel: string;
  force: boolean;
  forceRepair: boolean;
  forceCropQa: boolean;
  skipLlm: boolean;
  skipRepair: boolean;
  skipCropQa: boolean;
  pageConcurrency: number;
  cropQaConcurrency: number;
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
const defaultVisualModel = "anthropic/claude-sonnet-4.6";
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

const OptionalNumberSchema = z
  .number()
  .nullable()
  .optional()
  .transform((value) => value ?? undefined);

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
            marks: OptionalNumberSchema,
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

const VisualPageProposalSchema = z
  .object({
    imageSize: z
      .object({
        width: z.number(),
        height: z.number()
      })
      .optional(),
    visuals: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]).nullable().optional(),
            kind: VisualKindSchema.default("other"),
            description: z.string().default(""),
            shouldExtract: z.boolean().default(true),
            confidence: z.number().optional(),
            bbox: BBoxSchema
          })
          .passthrough()
      )
      .default([])
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
            marks: OptionalNumberSchema,
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

const AiRepairSchema = z
  .object({
    examUpdates: z
      .array(
        z
          .object({
            page: z.number(),
            questionNumber: z.union([z.number(), z.string()]),
            promptLatex: z.string().optional(),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  textLatex: z.string()
                })
              )
              .optional(),
            notes: z.array(z.string()).optional()
          })
          .passthrough()
      )
      .default([]),
    markingGuideUpdates: z
      .array(
        z
          .object({
            page: z.number(),
            questionNumber: z.union([z.number(), z.string()]),
            answerLatex: z.string().optional(),
            sampleAnswerLatex: z.string().optional(),
            markingCriteria: z.array(z.string()).optional(),
            notes: z.array(z.string()).optional()
          })
          .passthrough()
      )
      .default([]),
    judgement: z.string().default(""),
    unresolvedFlags: z.array(z.string()).default([])
  })
  .passthrough();

const SingleCropQaSchema = z
  .object({
    visuals: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]),
            goodCrop: z.boolean(),
            bbox: BBoxSchema.optional(),
            reason: z.string().default(""),
            confidence: z.number().optional()
          })
          .passthrough()
      )
      .default([])
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

type RepairAction = {
  questionNumber: number;
  source: "exam" | "marking-guide";
  page: number;
  fieldPath: string;
  before: string;
  after: string;
  method: "deterministic" | "ai";
  reason: string;
};

type RepairPassReport = {
  model?: string;
  deterministicActions: RepairAction[];
  aiActions: RepairAction[];
  aiAttempts: Array<{
    questionNumber: number;
    status: "ok" | "skipped" | "error";
    flagsBefore: string[];
    flagsAfter: string[];
    rawPath?: string;
    error?: string;
  }>;
  unresolvedQuestionNumbers: number[];
};

type CropCandidate = {
  id: string;
  questionNumber: number;
  page: number;
  visualIndex: number;
  kind: string;
  description: string;
  sourcePagePath: string;
  cropPath: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type CropRepairAttempt = {
  cropId: string;
  status: "ok" | "skipped" | "error";
  action?: "replace-bbox" | "keep" | "manual-review";
  beforeBbox: CropCandidate["bbox"];
  afterBbox?: CropCandidate["bbox"];
  beforeCropPath: string;
  afterCropPath?: string;
  qaStatus: CropQaResult["status"];
  qaIssues: string[];
  reason?: string;
  confidence?: number;
  rawPath?: string;
  error?: string;
};

type CropQaResult = {
  cropId: string;
  status: "ok" | "too-tight" | "too-loose" | "wrong-content" | "unclear";
  issues: string[];
  recommendedAction: string;
  proposedBbox?: CropCandidate["bbox"];
  confidence?: number;
  rawPath?: string;
};

type CropQaReport = {
  model?: string;
  candidates: CropCandidate[];
  initialSheets: Array<{
    id: string;
    path: string;
    rawPath?: string;
    status: "ok" | "skipped" | "error";
    results: CropQaResult[];
    error?: string;
  }>;
  repairAttempts: CropRepairAttempt[];
  sheets: Array<{
    id: string;
    path: string;
    rawPath?: string;
    status: "ok" | "skipped" | "error";
    results: CropQaResult[];
    error?: string;
  }>;
  flaggedCropIds: string[];
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
    deterministicRepairs: number;
    aiRepairs: number;
    unresolvedQuestions: number;
    cropCandidates: number;
    flaggedCrops: number;
  };
  examPageProposals: ExamPageProposal[];
  markingGuidePageProposals: MarkingGuidePageProposal[];
  questionSummaries: QuestionSummary[];
  repairs: RepairPassReport;
  cropQa: CropQaReport;
};

const promptVersion = "gemini-page-ingestion-v2";
const repairCacheVersion = "repair-v2";
const cropQaCacheVersion = "crop-qa-v2-single";
const defaultPageConcurrency = 8;
const defaultCropQaConcurrency = 8;

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
  const visualRawRoot = path.join(runRoot, "visual-bbox-raw");
  const parsedRoot = path.join(runRoot, "parsed");
  const repairRoot = path.join(runRoot, "repairs");
  const cropRoot = path.join(runRoot, "visual-crops");
  const sheetRoot = path.join(runRoot, "crop-contact-sheets");

  await mkdir(rawRoot, { recursive: true });
  await mkdir(visualRawRoot, { recursive: true });
  await mkdir(parsedRoot, { recursive: true });
  await mkdir(repairRoot, { recursive: true });
  await mkdir(cropRoot, { recursive: true });
  await mkdir(sheetRoot, { recursive: true });

  const sourceAssets = await discoverAssets(pack);
  const renderMetadata = await readRenderMetadata(pack);
  const examDocument = findRenderedDocument(renderMetadata, paper, "exam");
  const markingGuideDocument = findRenderedDocument(renderMetadata, paper, "marking-guide");
  const examPages = selectRenderedPages(examDocument, args.pages);
  const guidePages = markingGuideDocument ? selectRenderedPages(markingGuideDocument, args.guidePages) : [];
  const apiKey = args.skipLlm ? undefined : getOpenRouterApiKey();

  const examPageProposals = await mapWithConcurrency(examPages, args.pageConcurrency, async (page) =>
    proposeExamPage({
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

  await applyVisualBboxProposals({
    apiKey,
    model: args.visualModel,
    paper,
    pages: examPages,
    examPageProposals,
    rawRoot: visualRawRoot,
    force: args.force,
    skipLlm: args.skipLlm,
    concurrency: args.pageConcurrency
  });

  const markingGuidePageProposals = await mapWithConcurrency(guidePages, args.pageConcurrency, async (page) =>
    proposeMarkingGuidePage({
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

  const deterministicActions = applyDeterministicRepairs(examPageProposals, markingGuidePageProposals);
  let questionSummaries = reconcileQuestions(examPageProposals, markingGuidePageProposals);
  const aiRepairReport =
    args.skipRepair || args.skipLlm
      ? emptyAiRepairReport(questionSummaries)
      : await applyAiRepairs({
          apiKey: requireApiKey(apiKey),
          model: args.repairModel,
          paper,
          summaries: questionSummaries,
          examPageProposals,
          markingGuidePageProposals,
          repairRoot,
          force: args.forceRepair
        });
  const postAiDeterministicActions = applyDeterministicRepairs(examPageProposals, markingGuidePageProposals);
  const repairActions = [...deterministicActions, ...postAiDeterministicActions];

  questionSummaries = reconcileQuestions(examPageProposals, markingGuidePageProposals);

  const cropQa = await runCropQa({
    apiKey,
    model: args.cropQaModel,
    paper,
    examPageProposals,
    cropRoot,
    sheetRoot,
    concurrency: args.cropQaConcurrency,
    force: args.forceCropQa,
    skip: args.skipCropQa || args.skipLlm
  });

  const repairs: RepairPassReport = {
    model: args.skipRepair || args.skipLlm ? undefined : args.repairModel,
    deterministicActions: repairActions,
    aiActions: aiRepairReport.aiActions,
    aiAttempts: aiRepairReport.aiAttempts,
    unresolvedQuestionNumbers: questionSummaries
      .filter((summary) => summary.flags.length > 0)
      .map((summary) => summary.questionNumber)
  };

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
      ).length,
      deterministicRepairs: repairActions.length,
      aiRepairs: aiRepairReport.aiActions.length,
      unresolvedQuestions: repairs.unresolvedQuestionNumbers.length,
      cropCandidates: cropQa.candidates.length,
      flaggedCrops: cropQa.flaggedCropIds.length
    },
    examPageProposals,
    markingGuidePageProposals,
    questionSummaries,
    repairs,
    cropQa
  };

  await writeFile(path.join(runRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(runRoot, "report.html"), buildReportHtml(report), "utf8");

  printSummary(report, runRoot);
}

function parseArgs(values: string[]): Args {
  const args: Args = {
    paperId: "",
    model: defaultModel,
    repairModel: defaultModel,
    visualModel: defaultVisualModel,
    cropQaModel: defaultVisualModel,
    force: false,
    forceRepair: false,
    forceCropQa: false,
    skipLlm: false,
    skipRepair: false,
    skipCropQa: true,
    pageConcurrency: defaultPageConcurrency,
    cropQaConcurrency: defaultCropQaConcurrency
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
    } else if (value === "--repair-model") {
      args.repairModel = values[index + 1] ?? "";
      index += 1;
    } else if (value === "--visual-model") {
      args.visualModel = values[index + 1] ?? "";
      index += 1;
    } else if (value === "--crop-qa-model") {
      args.cropQaModel = values[index + 1] ?? "";
      index += 1;
    } else if (value === "--page-concurrency") {
      args.pageConcurrency = parsePositiveInteger(values[index + 1], "--page-concurrency");
      index += 1;
    } else if (value === "--crop-qa-concurrency") {
      args.cropQaConcurrency = parsePositiveInteger(values[index + 1], "--crop-qa-concurrency");
      index += 1;
    } else if (value === "--judge-model") {
      args.repairModel = values[index + 1] ?? "";
      args.cropQaModel = values[index + 1] ?? "";
      index += 1;
    } else if (value === "--force") {
      args.force = true;
    } else if (value === "--force-repair") {
      args.forceRepair = true;
    } else if (value === "--force-crop-qa") {
      args.forceCropQa = true;
    } else if (value === "--skip-llm") {
      args.skipLlm = true;
    } else if (value === "--skip-repair") {
      args.skipRepair = true;
    } else if (value === "--run-crop-qa") {
      args.skipCropQa = false;
    } else if (value === "--skip-crop-qa") {
      args.skipCropQa = true;
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

  if (!args.repairModel) {
    throw new Error("--repair-model must not be empty");
  }

  if (!args.visualModel) {
    throw new Error("--visual-model must not be empty");
  }

  if (!args.cropQaModel) {
    throw new Error("--crop-qa-model must not be empty");
  }

  return args;
}

function parsePositiveInteger(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
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

async function applyVisualBboxProposals({
  apiKey,
  model,
  paper,
  pages,
  examPageProposals,
  rawRoot,
  force,
  skipLlm,
  concurrency
}: {
  apiKey?: string;
  model: string;
  paper: Paper;
  pages: RenderedPage[];
  examPageProposals: ExamPageProposal[];
  rawRoot: string;
  force: boolean;
  skipLlm: boolean;
  concurrency: number;
}): Promise<void> {
  const pagesByNumber = new Map(pages.map((page) => [page.page, page]));

  await mapWithConcurrency(examPageProposals, concurrency, async (proposal) => {
    const page = pagesByNumber.get(proposal.page);
    if (!page || proposal.status !== "ok") {
      proposal.visuals = [];
      return;
    }

    proposal.visuals = await proposeVisualBboxes({
      apiKey,
      model,
      paper,
      page,
      rawRoot,
      force,
      skipLlm
    });
  });
}

async function proposeVisualBboxes({
  apiKey,
  model,
  paper,
  page,
  rawRoot,
  force,
  skipLlm
}: {
  apiKey?: string;
  model: string;
  paper: Paper;
  page: RenderedPage;
  rawRoot: string;
  force: boolean;
  skipLlm: boolean;
}): Promise<ExamPageProposal["visuals"]> {
  const stem = `${safeFileName(paper.id)}__visual-bbox-page-${page.page.toString().padStart(3, "0")}__${safeFileName(model)}`;
  const rawPath = path.join(rawRoot, `${stem}.json`);

  if (skipLlm) {
    return [];
  }

  try {
    const response = !force ? await readCachedRaw(rawPath) : undefined;
    const completion =
      response ??
      (await callOpenRouterJson({
        apiKey: requireApiKey(apiKey),
        model,
        title: "GoalCheck HSC visual bbox discovery",
        maxTokens: 2000,
        messages: [
          {
            role: "system",
            content:
              "You identify discrete mathematics exam visuals and return strict JSON bounding boxes. Return JSON only."
          },
          {
            role: "user",
            content: [
              { type: "text", text: buildVisualBboxPrompt(page) },
              { type: "image_url", image_url: { url: await imageDataUrl(page.path) } }
            ]
          }
        ]
      }));

    if (!response) {
      await writeFile(rawPath, `${JSON.stringify(completion.raw, null, 2)}\n`, "utf8");
    }

    const parsed = VisualPageProposalSchema.parse(parseModelJson(completion.content));
    return parsed.visuals
      .filter((visual) => visual.bbox && toQuestionNumber(visual.questionNumber ?? undefined) !== undefined)
      .map((visual) => ({
        ...visual,
        shouldExtract: true,
        description: visual.description || `${visual.kind} for question ${visual.questionNumber}`
      }));
  } catch (error: unknown) {
    return [
      {
        questionNumber: null,
        kind: "other",
        description: `Visual bbox proposal failed: ${error instanceof Error ? error.message : String(error)}`,
        shouldExtract: false,
        confidence: 0,
        bbox: undefined
      }
    ];
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
  "visuals": [],
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
- Leave visuals empty. A separate visual-bbox pass will identify crop coordinates.
- If the page has no question content, return empty arrays.`;
}

function buildVisualBboxPrompt(page: RenderedPage): string {
  return `Job:
- The attached file is a page from a Mathematics Exam.
- Your job is to identify discrete images and diagrams from within the page to be cropped out separately.
- For each discrete image you need to identify the boundary box ('bbox') that will allow me to safely and accurately crop it.
- The visuals could be things like tables, graphs, and diagrams, or other images that support a mathematics question.

Page context:
- The full source-page image size is ${page.width} x ${page.height} pixels.

Rules:
- The bbox must include the complete required visual as a standalone public-site asset.
- Include all axes, axis labels, tick labels, legends, graph labels, table headers, row/column labels, table borders, diagram endpoints, nodes, edge labels, option labels, scales, and geometry/text labels that are part of the visual.
- Exclude unrelated question prose, answer-writing lines, page headers, footers, page numbers, copyright notices, marks, office-use text, other questions, other diagrams, and excessive blank margins.
- Exclude the question text from the crop. This is intentional: do not mark a crop as bad because the surrounding question stem, instructions, or prose describing the visual has been omitted.
- Include text only when it is physically part of the visual itself, such as graph labels, table headers, option labels, diagram annotations, or a caption/title embedded in the visual block.
- Coordinates must use the full source-page image coordinate system, not the small crop image coordinate system.
- Include a small margin around the crop area, without intruding on other elements. I will crop exactly where you say and not add my own margin.
- Where multiple images relate to the same question or question part crop them all together if doing so does not include extraneous material. E.g. a series of related graphs.

Response format:
- Provide your response strictly in the JSON format below.
- Include one entry for each relevant image on the page.
- imageSize: the width and height, in pixels, of the full source-page image you are reviewing.
- questionNumber: Integer representing the question number the visual relates to, identified from the exam paper.
- kind: one of "diagram", "graph", "table", "image", or "other".
- description: short description of the visual.
- x: the x coordinate of the top left of the proposed bbox.
- y: the y coordinate of the top left of the proposed bbox.
- width: the width in pixels of the proposed bbox.
- height: the height in pixels of the proposed bbox.

JSON format:
{
  "imageSize": {"width": ${page.width}, "height": ${page.height}},
  "visuals": [
    {
      "questionNumber": 1,
      "kind": "diagram",
      "description": "what the visual shows",
      "bbox": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ]
}`;
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
    /(?<!\\)\\(?=(?:alpha|beta|theta|pi|sin|cos|tan|ln|log|frac|dfrac|sqrt|left|right|text|times|cdot|to|approx|leq|geq|neq|infty|operatorname|overline|bar|hat|vec|mathbf|mathrm|underset|sim|begin|end)\b)/g,
    "\\\\"
  );
}

async function imageDataUrl(imagePath: string): Promise<string> {
  const base64 = (await readFile(imagePath)).toString("base64");
  return `data:image/png;base64,${base64}`;
}

function applyDeterministicRepairs(
  examPageProposals: ExamPageProposal[],
  markingGuidePageProposals: MarkingGuidePageProposal[]
): RepairAction[] {
  const actions: RepairAction[] = [];

  for (const proposal of examPageProposals) {
    proposal.questions.forEach((question, questionIndex) => {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber === undefined) {
        return;
      }

      const promptRepair = repairMathText(question.promptLatex, "prompt");
      if (promptRepair.changed) {
        actions.push({
          questionNumber,
          source: "exam",
          page: proposal.page,
          fieldPath: `questions[${questionIndex}].promptLatex`,
          before: question.promptLatex,
          after: promptRepair.value,
          method: "deterministic",
          reason: promptRepair.reason
        });
        question.promptLatex = promptRepair.value;
      }

      question.options.forEach((option) => {
        const optionRepair = repairMathText(option.textLatex, "option");
        if (optionRepair.changed) {
          actions.push({
            questionNumber,
            source: "exam",
            page: proposal.page,
            fieldPath: `questions[${questionIndex}].options[${option.label}].textLatex`,
            before: option.textLatex,
            after: optionRepair.value,
            method: "deterministic",
            reason: optionRepair.reason
          });
          option.textLatex = optionRepair.value;
        }
      });
    });
  }

  actions.push(...clearResolvedSplitPageNotes(examPageProposals));

  for (const proposal of markingGuidePageProposals) {
    proposal.questions.forEach((question, questionIndex) => {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber === undefined) {
        return;
      }

      const answerRepair = repairMathText(question.answerLatex, "answer");
      if (answerRepair.changed) {
        actions.push({
          questionNumber,
          source: "marking-guide",
          page: proposal.page,
          fieldPath: `questions[${questionIndex}].answerLatex`,
          before: question.answerLatex,
          after: answerRepair.value,
          method: "deterministic",
          reason: answerRepair.reason
        });
        question.answerLatex = answerRepair.value;
      }

      const sampleRepair = repairMathText(question.sampleAnswerLatex, "answer");
      if (sampleRepair.changed) {
        actions.push({
          questionNumber,
          source: "marking-guide",
          page: proposal.page,
          fieldPath: `questions[${questionIndex}].sampleAnswerLatex`,
          before: question.sampleAnswerLatex,
          after: sampleRepair.value,
          method: "deterministic",
          reason: sampleRepair.reason
        });
        question.sampleAnswerLatex = sampleRepair.value;
      }

      question.markingCriteria.forEach((criterion, criterionIndex) => {
        const criterionRepair = repairMathText(criterion, "criterion");
        if (criterionRepair.changed) {
          actions.push({
            questionNumber,
            source: "marking-guide",
            page: proposal.page,
            fieldPath: `questions[${questionIndex}].markingCriteria[${criterionIndex}]`,
            before: criterion,
            after: criterionRepair.value,
            method: "deterministic",
            reason: criterionRepair.reason
          });
          question.markingCriteria[criterionIndex] = criterionRepair.value;
        }
      });
    });
  }

  return actions;
}

function repairMathText(
  value: string,
  context: "prompt" | "option" | "answer" | "criterion"
): { value: string; changed: boolean; reason: string } {
  let repaired = value;
  const reasons: string[] = [];

  const delimiterFixed = repaired.replace(/\\\(\$/g, "\\(\\$");
  if (delimiterFixed !== repaired) {
    repaired = delimiterFixed;
    reasons.push("Escaped currency notation inside inline MathJax delimiters.");
  }

  const malformedDelimiterFixed = normaliseMalformedMathDelimiters(repaired);
  if (malformedDelimiterFixed !== repaired) {
    repaired = malformedDelimiterFixed;
    reasons.push("Normalised malformed MathJax delimiters around marking-guide formulae.");
  }

  const environmentFixed = wrapRawTexEnvironments(repaired);
  if (environmentFixed !== repaired) {
    repaired = environmentFixed;
    reasons.push("Wrapped raw TeX table/array environments in display MathJax delimiters.");
  }

  const inlineFragmentFixed = wrapRawInlineTexFragments(repaired);
  if (inlineFragmentFixed !== repaired) {
    repaired = inlineFragmentFixed;
    reasons.push("Wrapped inline raw TeX fragments in MathJax delimiters.");
  }

  const mixedExpressionFixed = wrapMixedAnswerExpressions(repaired, context);
  if (mixedExpressionFixed !== repaired) {
    repaired = mixedExpressionFixed;
    reasons.push("Wrapped mixed prose/calculation answer lines in MathJax delimiters.");
  }

  const calculationBlockFixed = wrapRawCalculationAnswerBlock(repaired, context);
  if (calculationBlockFixed !== repaired) {
    repaired = calculationBlockFixed;
    reasons.push("Wrapped calculation-only answer block in display MathJax delimiters.");
  }

  const withoutMath = stripDelimitedMath(repaired);
  if (containsRawTex(withoutMath) && shouldWrapWholeValue(repaired, context)) {
    repaired = `\\(${repaired.trim()}\\)`;
    reasons.push("Wrapped raw TeX expression in inline MathJax delimiters.");
  } else {
    const currencyFixed = replaceOutsideDelimitedMath(repaired, (outsideMath) =>
      outsideMath
        .replace(/\(\s*\$\s*\)/g, "(dollars)")
        .replace(/\\\$([0-9][0-9,]*(?:\\,[0-9]{3})*(?:\.\d+)?)/g, (_match, amount: string) => {
          return `\\(\\$${amount}\\)`;
        })
        .replace(/(?<!\\)\$([0-9][0-9,]*(?:\\,[0-9]{3})*(?:\.\d+)?)/g, (_match, amount: string) => {
          return `\\(\\$${amount}\\)`;
        })
    );

    if (currencyFixed !== repaired) {
      repaired = currencyFixed;
      reasons.push("Escaped currency amounts in MathJax and normalised prose currency units.");
    }
  }

  return {
    value: repaired,
    changed: repaired !== value,
    reason: reasons.join(" ") || "No deterministic repair applied."
  };
}

function replaceOutsideDelimitedMath(value: string, replacer: (outsideMath: string) => string): string {
  const mathPattern = /\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(value)) !== null) {
    result += replacer(value.slice(lastIndex, match.index));
    result += match[0];
    lastIndex = match.index + match[0].length;
  }

  result += replacer(value.slice(lastIndex));
  return result;
}

function clearResolvedSplitPageNotes(examPageProposals: ExamPageProposal[]): RepairAction[] {
  const actions: RepairAction[] = [];

  for (const proposal of examPageProposals) {
    proposal.questions.forEach((question, questionIndex) => {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber === undefined || question.notes.length === 0) {
        return;
      }

      const hasContinuation = examPageProposals.some(
        (candidate) =>
          candidate.page > proposal.page &&
          candidate.questions.some(
            (candidateQuestion) => toQuestionNumber(candidateQuestion.questionNumber) === questionNumber
          )
      );
      if (!hasContinuation) {
        return;
      }

      const before = [...question.notes];
      question.notes = question.notes.filter(
        (note) =>
          !/implied by the text and graph provided.*(?:following|next) page/i.test(note) &&
          !/this part.*implied by.*text.*graph provided/i.test(note) &&
          !/prompt for part .*implied by.*context.*graph provided/i.test(note)
      );

      if (question.notes.length !== before.length) {
        actions.push({
          questionNumber,
          source: "exam",
          page: proposal.page,
          fieldPath: `questions[${questionIndex}].notes`,
          before: JSON.stringify(before),
          after: JSON.stringify(question.notes),
          method: "deterministic",
          reason: "Cleared split-page risk note after a continuation for the same question was found."
        });
      }
    });
  }

  return actions;
}

function normaliseMalformedMathDelimiters(value: string): string {
  return value
    .replace(/\\\]\\\)/g, "\\]")
    .replace(/= \\\(([^\\\n]*?&\s*\(\d+\))/g, (_match: string, expression: string) => `= ${expression}`);
}

function wrapRawTexEnvironments(value: string): string {
  return value.replace(
    /\\begin\{(tabular|array|aligned|cases|matrix)\}(?:\{[^}]*\})?[\s\S]*?\\end\{\1\}/g,
    (match: string, _environment: string, offset: number, fullValue: string) => {
      const before = fullValue.slice(Math.max(0, offset - 2), offset);
      const after = fullValue.slice(offset + match.length, offset + match.length + 2);
      if (before === "\\[" && after === "\\]") {
        return match;
      }

      return `\\[${match}\\]`;
    }
  );
}

function wrapRawInlineTexFragments(value: string): string {
  return replaceOutsideDelimitedMath(value, (outsideMath) =>
    outsideMath.replace(
      /(^|[^\w\\])((?:\d+(?:\.\d+)?|[A-Za-z])(?:\s*\^\s*)?\\circ(?:\s*\\text\{[^}]+\})?)/g,
      (_match: string, prefix: string, expression: string) => `${prefix}\\(${expression.trim()}\\)`
    )
  );
}

function wrapMixedAnswerExpressions(
  value: string,
  context: "prompt" | "option" | "answer" | "criterion"
): string {
  if (context !== "answer") {
    return value;
  }

  return replaceOutsideDelimitedMath(value, (outsideMath) =>
    outsideMath
      .split(/(\s*\\\\\s*)/)
      .map((segment) => {
        if (/^(\s*\\\\\s*)$/.test(segment)) {
          return segment;
        }

        if (!containsRawTex(segment) || !/\s=\s/.test(segment)) {
          return segment;
        }

        const equalsIndex = segment.indexOf("=");
        const label = segment.slice(0, equalsIndex).trim();
        const expression = segment.slice(equalsIndex + 1).trim();
        if (!label || /\\/.test(label) || label.length > 70) {
          return segment;
        }

        return `${label} = \\(${unwrapInlineMath(expression)}\\)`;
      })
      .join("")
  );
}

function wrapRawCalculationAnswerBlock(
  value: string,
  context: "prompt" | "option" | "answer" | "criterion"
): string {
  if (context !== "answer") {
    return value;
  }

  if (!containsRawTex(stripDelimitedMath(value))) {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) {
    return value;
  }

  const unwrapped = unwrapInlineMath(trimmed);
  const proseWords =
    unwrapped
      .replace(/\\text\{[^}]*\}/g, "")
      .replace(/\\[A-Za-z]+/g, "")
      .replace(/\b[A-Za-z]\b/g, "")
      .match(/\b[A-Za-z]{4,}\b/g) ?? [];

  if (proseWords.length > 2) {
    return value;
  }

  if (!/(?:\\\\|\\frac|\\therefore|\\left|\\right|=)/.test(unwrapped)) {
    return value;
  }

  return `\\[${unwrapped}\\]`;
}

function unwrapInlineMath(value: string): string {
  return value.replace(/\\\(([\s\S]*?)\\\)/g, (_match: string, expression: string) => expression.trim());
}

function shouldWrapWholeValue(value: string, context: "prompt" | "option" | "answer" | "criterion"): boolean {
  if (/\\\(|\\\[/.test(value)) {
    return false;
  }

  if (context === "prompt" && value.length > 90) {
    return false;
  }

  if (context === "criterion" && /\b[A-Za-z]{4,}\b.*\\/.test(value)) {
    return false;
  }

  const plainWords = value
    .replace(/\\text\{[^}]*\}/g, "")
    .replace(/\\[A-Za-z]+/g, "")
    .match(/\b[A-Za-z]{4,}\b/g);

  return (plainWords?.length ?? 0) <= 2;
}

function stripDelimitedMath(value: string): string {
  return value.replace(/\\\([\s\S]*?\\\)/g, "").replace(/\\\[[\s\S]*?\\\]/g, "");
}

function containsRawTex(value: string): boolean {
  return /\\(?:frac|dfrac|sqrt|text|times|cdot|approx|leq|geq|neq|infty|operatorname|overline|bar|hat|vec|mathbf|mathrm|begin|end|,|\$)/.test(
    value
  );
}

function emptyAiRepairReport(
  summaries: QuestionSummary[]
): Pick<RepairPassReport, "aiActions" | "aiAttempts"> {
  return {
    aiActions: [],
    aiAttempts: summaries
      .filter((summary) => summary.flags.length > 0)
      .map((summary) => ({
        questionNumber: summary.questionNumber,
        status: "skipped",
        flagsBefore: summary.flags,
        flagsAfter: summary.flags
      }))
  };
}

async function applyAiRepairs({
  apiKey,
  model,
  paper,
  summaries,
  examPageProposals,
  markingGuidePageProposals,
  repairRoot,
  force
}: {
  apiKey: string;
  model: string;
  paper: Paper;
  summaries: QuestionSummary[];
  examPageProposals: ExamPageProposal[];
  markingGuidePageProposals: MarkingGuidePageProposal[];
  repairRoot: string;
  force: boolean;
}): Promise<Pick<RepairPassReport, "aiActions" | "aiAttempts">> {
  const aiActions: RepairAction[] = [];
  const aiAttempts: RepairPassReport["aiAttempts"] = [];

  for (const summary of summaries.filter((candidate) => candidate.flags.length > 0)) {
    const stem = `${safeFileName(paper.id)}__${repairCacheVersion}-q${summary.questionNumber.toString().padStart(2, "0")}__${safeFileName(model)}`;
    const rawPath = path.join(repairRoot, `${stem}.json`);

    try {
      const examContext = contextPagesForQuestion(examPageProposals, summary.examPages);
      const guideContext = contextPagesForQuestion(markingGuidePageProposals, summary.markingGuidePages);
      const response = !force ? await readCachedRaw(rawPath) : undefined;
      const completion =
        response ??
        (await callOpenRouterJson({
          apiKey,
          model,
          title: "GoalCheck HSC Gemini ingestion repair",
          maxTokens: 5000,
          messages: [
            {
              role: "system",
              content:
                "You repair structured NSW HSC mathematics ingestion proposals. Return JSON only and do not invent source content."
            },
            {
              role: "user",
              content: await buildRepairMessageContent({
                paper,
                summary,
                examContext,
                guideContext
              })
            }
          ]
        }));

      if (!response) {
        await writeFile(rawPath, `${JSON.stringify(completion.raw, null, 2)}\n`, "utf8");
      }

      const parsed = AiRepairSchema.parse(parseModelJson(completion.content));
      aiActions.push(
        ...applyAiRepairUpdates({
          parsed,
          summary,
          examPageProposals,
          markingGuidePageProposals
        })
      );

      const flagsAfter =
        reconcileQuestions(examPageProposals, markingGuidePageProposals).find(
          (candidate) => candidate.questionNumber === summary.questionNumber
        )?.flags ?? [];

      aiAttempts.push({
        questionNumber: summary.questionNumber,
        status: "ok",
        flagsBefore: summary.flags,
        flagsAfter,
        rawPath: normalisePath(rawPath)
      });
    } catch (error: unknown) {
      aiAttempts.push({
        questionNumber: summary.questionNumber,
        status: "error",
        flagsBefore: summary.flags,
        flagsAfter: summary.flags,
        rawPath: normalisePath(rawPath),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { aiActions, aiAttempts };
}

async function buildRepairMessageContent({
  paper,
  summary,
  examContext,
  guideContext
}: {
  paper: Paper;
  summary: QuestionSummary;
  examContext: ExamPageProposal[];
  guideContext: MarkingGuidePageProposal[];
}): Promise<unknown[]> {
  const context = {
    paper: {
      id: paper.id,
      year: paper.year,
      courseName: paper.courseName
    },
    question: summary,
    examPages: examContext.map((page) => ({
      page: page.page,
      pageRisks: page.pageRisks,
      questions: page.questions,
      visuals: page.visuals
    })),
    markingGuidePages: guideContext.map((page) => ({
      page: page.page,
      pageRisks: page.pageRisks,
      questions: page.questions
    }))
  };

  const content: unknown[] = [
    {
      type: "text",
      text: `Repair unresolved ingestion issues for question ${summary.questionNumber}.

Return this JSON shape:
{
  "examUpdates": [
    {
      "page": 2,
      "questionNumber": ${summary.questionNumber},
      "promptLatex": "replacement prompt when needed",
      "options": [{"label": "A", "textLatex": "replacement option text"}],
      "notes": []
    }
  ],
  "markingGuideUpdates": [
    {
      "page": 1,
      "questionNumber": ${summary.questionNumber},
      "answerLatex": "replacement answer when needed",
      "sampleAnswerLatex": "replacement sample answer when needed",
      "markingCriteria": ["replacement criteria when needed"],
      "notes": []
    }
  ],
  "judgement": "brief source-faithfulness judgement",
  "unresolvedFlags": []
}

Rules:
- Fix only fields needed to resolve the supplied flags or obvious source-fidelity problems.
- Preserve official wording and numeric values. Do not shorten marking-guide answers into an explanation.
- Use MathJax-ready TeX: \\( ... \\) inline, \\[ ... \\] display. Never use dollar delimiters.
- Currency inside MathJax must escape the dollar sign, for example \\(\\$15\\,000\\).
- Mixed text and mathematics must keep prose outside MathJax and wrap each mathematical expression separately; do not return raw \\times, \\div, \\$, \\begin, or \\bar outside MathJax.
- If a question appears split across pages, use both supplied pages and return the combined field on the source question entry.
- Check currency notation against the source page and the GoalCheck standard.
- Leave fields absent when no change is needed.

Context JSON:
${JSON.stringify(context, null, 2)}`
    }
  ];

  for (const page of [...examContext, ...guideContext]) {
    content.push({ type: "text", text: `Rendered page ${page.page}:` });
    content.push({ type: "image_url", image_url: { url: await imageDataUrl(page.imagePath) } });
  }

  return content;
}

function contextPagesForQuestion<T extends { page: number }>(proposals: T[], sourcePages: number[]): T[] {
  const availablePages = new Set(proposals.map((proposal) => proposal.page));
  const selectedPages = new Set<number>();

  for (const page of sourcePages) {
    [page - 1, page, page + 1].forEach((candidate) => {
      if (availablePages.has(candidate)) {
        selectedPages.add(candidate);
      }
    });
  }

  if (selectedPages.size === 0 && proposals.length > 0) {
    selectedPages.add(proposals[0].page);
  }

  return proposals.filter((proposal) => selectedPages.has(proposal.page));
}

function applyAiRepairUpdates({
  parsed,
  summary,
  examPageProposals,
  markingGuidePageProposals
}: {
  parsed: z.infer<typeof AiRepairSchema>;
  summary: QuestionSummary;
  examPageProposals: ExamPageProposal[];
  markingGuidePageProposals: MarkingGuidePageProposal[];
}): RepairAction[] {
  const actions: RepairAction[] = [];

  for (const update of parsed.examUpdates) {
    const proposal = examPageProposals.find((candidate) => candidate.page === update.page);
    if (!proposal || toQuestionNumber(update.questionNumber) !== summary.questionNumber) {
      continue;
    }

    const questionIndex = proposal.questions.findIndex(
      (candidate) => toQuestionNumber(candidate.questionNumber) === summary.questionNumber
    );
    const question = proposal.questions[questionIndex];
    if (!question) {
      continue;
    }

    if (update.promptLatex !== undefined && update.promptLatex !== question.promptLatex) {
      actions.push({
        questionNumber: summary.questionNumber,
        source: "exam",
        page: proposal.page,
        fieldPath: `questions[${questionIndex}].promptLatex`,
        before: question.promptLatex,
        after: update.promptLatex,
        method: "ai",
        reason: parsed.judgement || "AI repair update."
      });
      question.promptLatex = update.promptLatex;
    }

    for (const optionUpdate of update.options ?? []) {
      const option = question.options.find((candidate) => candidate.label === optionUpdate.label);
      if (option && option.textLatex !== optionUpdate.textLatex) {
        actions.push({
          questionNumber: summary.questionNumber,
          source: "exam",
          page: proposal.page,
          fieldPath: `questions[${questionIndex}].options[${option.label}].textLatex`,
          before: option.textLatex,
          after: optionUpdate.textLatex,
          method: "ai",
          reason: parsed.judgement || "AI repair update."
        });
        option.textLatex = optionUpdate.textLatex;
      }
    }

    question.notes = parsed.unresolvedFlags.length > 0 ? parsed.unresolvedFlags : [];
  }

  for (const update of parsed.markingGuideUpdates) {
    const proposal = markingGuidePageProposals.find((candidate) => candidate.page === update.page);
    if (!proposal || toQuestionNumber(update.questionNumber) !== summary.questionNumber) {
      continue;
    }

    const questionIndex = proposal.questions.findIndex(
      (candidate) => toQuestionNumber(candidate.questionNumber) === summary.questionNumber
    );
    const question = proposal.questions[questionIndex];
    if (!question) {
      continue;
    }

    if (update.answerLatex !== undefined && update.answerLatex !== question.answerLatex) {
      actions.push({
        questionNumber: summary.questionNumber,
        source: "marking-guide",
        page: proposal.page,
        fieldPath: `questions[${questionIndex}].answerLatex`,
        before: question.answerLatex,
        after: update.answerLatex,
        method: "ai",
        reason: parsed.judgement || "AI repair update."
      });
      question.answerLatex = update.answerLatex;
    }

    if (update.sampleAnswerLatex !== undefined && update.sampleAnswerLatex !== question.sampleAnswerLatex) {
      actions.push({
        questionNumber: summary.questionNumber,
        source: "marking-guide",
        page: proposal.page,
        fieldPath: `questions[${questionIndex}].sampleAnswerLatex`,
        before: question.sampleAnswerLatex,
        after: update.sampleAnswerLatex,
        method: "ai",
        reason: parsed.judgement || "AI repair update."
      });
      question.sampleAnswerLatex = update.sampleAnswerLatex;
    }

    if (update.markingCriteria !== undefined) {
      const before = JSON.stringify(question.markingCriteria);
      const after = JSON.stringify(update.markingCriteria);
      if (before !== after) {
        actions.push({
          questionNumber: summary.questionNumber,
          source: "marking-guide",
          page: proposal.page,
          fieldPath: `questions[${questionIndex}].markingCriteria`,
          before,
          after,
          method: "ai",
          reason: parsed.judgement || "AI repair update."
        });
        question.markingCriteria = update.markingCriteria;
      }
    }

    question.notes = parsed.unresolvedFlags.length > 0 ? parsed.unresolvedFlags : [];
  }

  return actions;
}

async function runCropQa({
  apiKey,
  model,
  paper,
  examPageProposals,
  cropRoot,
  sheetRoot,
  concurrency,
  force,
  skip
}: {
  apiKey?: string;
  model: string;
  paper: Paper;
  examPageProposals: ExamPageProposal[];
  cropRoot: string;
  sheetRoot: string;
  concurrency: number;
  force: boolean;
  skip: boolean;
}): Promise<CropQaReport> {
  const candidates = await createCropCandidates(paper, examPageProposals, cropRoot);
  const initialSheets = await evaluateCropCandidates({
    apiKey,
    model,
    paper,
    candidates,
    sheetRoot,
    sheetPrefix: "crop-qa-pass-1",
    concurrency,
    force,
    skip
  });
  const initialFlaggedResults = initialSheets
    .flatMap((sheet) => sheet.results)
    .filter((result) => result.status !== "ok");
  const flaggedCropIds = initialFlaggedResults.map((result) => result.cropId);

  return {
    model: skip ? undefined : model,
    candidates,
    initialSheets,
    repairAttempts: [],
    sheets: initialSheets,
    flaggedCropIds
  };
}

async function evaluateCropCandidates({
  apiKey,
  model,
  paper,
  candidates,
  sheetRoot,
  sheetPrefix,
  concurrency,
  force,
  skip
}: {
  apiKey?: string;
  model: string;
  paper: Paper;
  candidates: CropCandidate[];
  sheetRoot: string;
  sheetPrefix: string;
  concurrency: number;
  force: boolean;
  skip: boolean;
}): Promise<CropQaReport["sheets"]> {
  const batches = chunk(candidates, 16);
  const sheets: CropQaReport["sheets"] = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const sheetId = `${safeFileName(paper.id)}__${sheetPrefix}-${(index + 1).toString().padStart(2, "0")}`;
    const sheetPath = path.join(sheetRoot, `${sheetId}.png`);
    await createCropContactSheet(batch, sheetPath);

    if (skip || !apiKey) {
      sheets.push({
        id: sheetId,
        path: normalisePath(sheetPath),
        status: "skipped",
        results: []
      });
      continue;
    }

    const results = await mapWithConcurrency(batch, concurrency, async (candidate) =>
      evaluateSingleCropCandidate({
        apiKey,
        model,
        paper,
        candidate,
        rawRoot: sheetRoot,
        rawPrefix: sheetPrefix,
        force
      })
    );
    const erroredResults = results.filter(
      (result) =>
        result.status === "unclear" && result.issues.some((issue) => issue.startsWith("Crop QA error:"))
    );

    sheets.push({
      id: sheetId,
      path: normalisePath(sheetPath),
      status: erroredResults.length === results.length && results.length > 0 ? "error" : "ok",
      results,
      error:
        erroredResults.length > 0
          ? `${erroredResults.length} crop-level QA call(s) failed; see result issues.`
          : undefined
    });
  }

  return sheets;
}

async function evaluateSingleCropCandidate({
  apiKey,
  model,
  paper,
  candidate,
  rawRoot,
  rawPrefix,
  force
}: {
  apiKey: string;
  model: string;
  paper: Paper;
  candidate: CropCandidate;
  rawRoot: string;
  rawPrefix: string;
  force: boolean;
}): Promise<CropQaResult> {
  const rawPath = path.join(
    rawRoot,
    `${safeFileName(paper.id)}__${safeFileName(rawPrefix)}__qa-${safeFileName(candidate.id)}__${cropQaCacheVersion}__${safeFileName(model)}.json`
  );

  try {
    const response = !force ? await readCachedRaw(rawPath) : undefined;
    const completion =
      response ??
      (await callOpenRouterJson({
        apiKey,
        model,
        title: "GoalCheck HSC single crop QA",
        maxTokens: 1500,
        messages: [
          {
            role: "system",
            content:
              "You are a strict visual crop quality inspector for NSW HSC mathematics exam assets. Return JSON only."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildSingleCropQaPrompt(candidate)
              },
              {
                type: "image_url",
                image_url: { url: await imageDataUrl(candidate.sourcePagePath) }
              },
              {
                type: "image_url",
                image_url: { url: await imageDataUrl(candidate.cropPath) }
              }
            ]
          }
        ]
      }));

    if (!response) {
      await writeFile(rawPath, `${JSON.stringify(completion.raw, null, 2)}\n`, "utf8");
    }

    const parsed = SingleCropQaSchema.parse(parseModelJson(completion.content));
    const visualResult = parsed.visuals[0];
    const sourceImage = await loadImage(await readFile(candidate.sourcePagePath));
    const proposedBbox = visualResult?.bbox
      ? clampBbox(visualResult.bbox, sourceImage.width, sourceImage.height)
      : undefined;
    return {
      cropId: candidate.id,
      status: visualResult?.goodCrop ? "ok" : "unclear",
      issues: visualResult?.goodCrop
        ? []
        : [visualResult?.reason || "Crop check proposed a replacement bbox."],
      recommendedAction: visualResult?.goodCrop
        ? "Existing crop accepted by crop check."
        : "Use proposedBbox as the replacement crop if crop check/repair is enabled for promotion.",
      proposedBbox,
      confidence: visualResult?.confidence,
      rawPath: normalisePath(rawPath)
    };
  } catch (error: unknown) {
    return {
      cropId: candidate.id,
      status: "unclear",
      issues: [`Crop QA error: ${error instanceof Error ? error.message : String(error)}`],
      recommendedAction: "Retry crop QA or inspect manually.",
      rawPath: normalisePath(rawPath)
    };
  }
}

async function createCropCandidates(
  paper: Paper,
  examPageProposals: ExamPageProposal[],
  cropRoot: string
): Promise<CropCandidate[]> {
  const candidates: CropCandidate[] = [];

  for (const proposal of examPageProposals) {
    const sourceImage = await loadImage(await readFile(proposal.imagePath));
    let visualIndex = 0;

    for (const visual of proposal.visuals) {
      const questionNumber = toQuestionNumber(visual.questionNumber ?? undefined);
      if (!visual.shouldExtract || questionNumber === undefined || !visual.bbox) {
        continue;
      }

      visualIndex += 1;
      const bbox = clampBbox(visual.bbox, sourceImage.width, sourceImage.height);
      if (bbox.width < 8 || bbox.height < 8) {
        continue;
      }

      const id = `q${questionNumber}-p${proposal.page}-v${visualIndex}`;
      const cropPath = path.join(cropRoot, `${safeFileName(paper.id)}__${id}.png`);
      await writeCropImage(proposal.imagePath, bbox, cropPath);

      candidates.push({
        id,
        questionNumber,
        page: proposal.page,
        visualIndex,
        kind: visual.kind,
        description: visual.description,
        sourcePagePath: proposal.imagePath,
        cropPath: normalisePath(cropPath),
        bbox
      });
    }
  }

  return candidates;
}

async function writeCropImage(
  sourcePagePath: string,
  bbox: CropCandidate["bbox"],
  cropPath: string
): Promise<void> {
  const sourceImage = await loadImage(await readFile(sourcePagePath));
  const canvas = createCanvas(bbox.width, bbox.height);
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width, bbox.height);
  await writeFile(cropPath, canvas.toBuffer("image/png"));
}

function clampBbox(
  bbox: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number
): CropCandidate["bbox"] {
  const x = clamp(Math.round(bbox.x), 0, imageWidth - 1);
  const y = clamp(Math.round(bbox.y), 0, imageHeight - 1);
  const right = clamp(Math.round(bbox.x + bbox.width), x + 1, imageWidth);
  const bottom = clamp(Math.round(bbox.y + bbox.height), y + 1, imageHeight);

  return {
    x,
    y,
    width: right - x,
    height: bottom - y
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function createCropContactSheet(candidates: CropCandidate[], outputPath: string): Promise<void> {
  const columns = 4;
  const tileWidth = 340;
  const tileHeight = 280;
  const labelHeight = 30;
  const rows = Math.max(1, Math.ceil(candidates.length / columns));
  const canvas = createCanvas(columns * tileWidth, rows * tileHeight);
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "16px system-ui, sans-serif";
  context.textBaseline = "top";

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = column * tileWidth;
    const top = row * tileHeight;
    const image = await loadImage(await readFile(candidate.cropPath));
    const maxWidth = tileWidth - 24;
    const maxHeight = tileHeight - labelHeight - 24;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const drawWidth = Math.max(1, Math.round(image.width * scale));
    const drawHeight = Math.max(1, Math.round(image.height * scale));
    const drawX = left + Math.round((tileWidth - drawWidth) / 2);
    const drawY = top + labelHeight + Math.round((tileHeight - labelHeight - drawHeight) / 2);

    context.strokeStyle = "#d8d7ce";
    context.strokeRect(left + 0.5, top + 0.5, tileWidth - 1, tileHeight - 1);
    context.fillStyle = "#202124";
    context.fillText(`${candidate.id} | Q${candidate.questionNumber} p${candidate.page}`, left + 10, top + 8);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  await writeFile(outputPath, canvas.toBuffer("image/png"));
}

function buildSingleCropQaPrompt(candidate: CropCandidate): string {
  return `Crop check and repair
Job:
- I have attached two files: a page from a Mathematics Exam, and a diagram I have cropped from it.
- Your job is to check whether the crop is a good crop that includes the whole image and no extraneous material.
- If it is not a good crop, your job is to identify the boundary box ('bbox') that will allow me to safely and accurately crop the image.
- The visuals could be things like tables, graphs, and diagrams, or other images that support a mathematics question.

Rules:
- The bbox must include the complete required visual as a standalone public-site asset.
- Include all axes, axis labels, tick labels, legends, graph labels, table headers, row/column labels, table borders, diagram endpoints, nodes, edge labels, option labels, scales, and geometry/text labels that are part of the visual.
- Exclude unrelated question prose, answer-writing lines, page headers, footers, page numbers, copyright notices, marks, office-use text, other questions, other diagrams, and excessive blank margins.
- Coordinates must use the full source-page image coordinate system, not the small crop image coordinate system.
- Include any header, footer, or explanatory text that is directly linked to the visual, such as a heading describing the visual.
- Include a small margin around the crop area, without intruding on other elements. I will crop exactly where you say and not add my own margin.
- Where multiple images relate to the same question or question part crop them all together if doing so does not include extraneous material. E.g. a series of related graphs.

Response format:
- Provide your response strictly in the JSON format below.
- Include one entry for the crop being checked.
- questionNumber: Integer representing the question number the question relates to, identified from the exam paper.
- goodCrop: return true if the existing crop meets the criteria above, return false if it does not.
- bbox: If you return false for goodCrop, also return a bbox specification for the new proposed crop.
- x: the x coordinate of the top left of the proposed bbox.
- y: the y coordinate of the top left of the proposed bbox.
- width: the width in pixels of the proposed bbox.
- height: the height in pixels of the proposed bbox.

JSON format:
{
  "visuals": [
    {
      "questionNumber": ${candidate.questionNumber},
      "goodCrop": false,
      "bbox": {"x": 0, "y": 0, "width": 100, "height": 100},
      "reason": "why the existing crop is or is not acceptable",
      "confidence": 0.0
    }
  ]
}

Metadata:
${JSON.stringify(
  {
    cropId: candidate.id,
    questionNumber: candidate.questionNumber,
    page: candidate.page,
    kind: candidate.kind,
    description: candidate.description,
    bbox: candidate.bbox
  },
  null,
  2
)}`;
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<U>
): Promise<U[]> {
  const results = new Array<U>(values.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, values.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(values[currentIndex], currentIndex);
      }
    })
  );

  return results;
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
    return value > 0 ? value : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.match(/\d+/);
  if (!match) {
    return undefined;
  }

  const questionNumber = Number(match[0]);
  return questionNumber > 0 ? questionNumber : undefined;
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
          <div class="card"><div class="metric">\${data.totals.deterministicRepairs}</div><div class="muted">deterministic repairs</div></div>
          <div class="card"><div class="metric">\${data.totals.aiRepairs}</div><div class="muted">AI repairs</div></div>
          <div class="card"><div class="metric">\${data.totals.flaggedCrops}</div><div class="muted">flagged crops</div></div>
        </section>
        <section class="card" style="margin-bottom:22px">
          <h2>Autonomous Repair Pass</h2>
          <p class="muted">Model: \${escapeHtml(data.repairs.model || "skipped")}. Unresolved questions: \${data.repairs.unresolvedQuestionNumbers.join(", ") || "none"}.</p>
          <div class="grid summary">
            <div><h3>Deterministic</h3>\${renderActions(data.repairs.deterministicActions)}</div>
            <div><h3>AI</h3>\${renderActions(data.repairs.aiActions)}</div>
          </div>
          <details><summary>AI attempts</summary><pre>\${escapeHtml(JSON.stringify(data.repairs.aiAttempts, null, 2))}</pre></details>
        </section>
        <section class="card" style="margin-bottom:22px">
          <h2>Crop QA</h2>
          <p class="muted">Model: \${escapeHtml(data.cropQa.model || "skipped")}. \${data.cropQa.candidates.length} candidate crop(s), \${data.cropQa.flaggedCropIds.length} flagged after repair.</p>
          <h3>Repair Attempts</h3>
          \${renderCropRepairAttempts(data.cropQa.repairAttempts)}
          <h3 style="margin-top:16px">Final Crop Sheets</h3>
          <div class="grid page-grid">\${data.cropQa.sheets.map(renderCropSheet).join("")}</div>
          <details><summary>Initial crop QA sheets</summary><div class="grid page-grid">\${data.cropQa.initialSheets.map(renderCropSheet).join("")}</div></details>
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

      function renderActions(actions) {
        if (!actions.length) {
          return '<p class="muted">No changes.</p>';
        }

        return \`
          <table>
            <thead><tr><th>Q</th><th>Source</th><th>Field</th><th>Reason</th></tr></thead>
            <tbody>\${actions.map((action) => \`
              <tr>
                <td>\${action.questionNumber}</td>
                <td>\${escapeHtml(action.source)} p\${action.page}</td>
                <td>\${escapeHtml(action.fieldPath)}</td>
                <td>\${escapeHtml(action.reason)}</td>
              </tr>
            \`).join("")}</tbody>
          </table>
        \`;
      }

      function renderCropSheet(sheet) {
        return \`
          <article class="card">
            <h3>\${escapeHtml(sheet.id)} <span class="pill \${sheet.status === "error" ? "bad" : sheet.status === "skipped" ? "warn" : ""}">\${sheet.status}</span></h3>
            <img src="\${sheet.imageUrl}" alt="Crop QA contact sheet \${escapeHtml(sheet.id)}" loading="lazy" />
            <details><summary>Results</summary><pre>\${escapeHtml(JSON.stringify(sheet.results, null, 2))}</pre></details>
            \${sheet.error ? '<p><span class="pill bad">' + escapeHtml(sheet.error) + '</span></p>' : ""}
          </article>
        \`;
      }

      function renderCropRepairAttempts(attempts) {
        if (!attempts.length) {
          return '<p class="muted">No crop repair attempts.</p>';
        }

        return \`
          <table>
            <thead><tr><th>Crop</th><th>QA</th><th>Action</th><th>Before</th><th>After</th><th>Reason</th></tr></thead>
            <tbody>\${attempts.map((attempt) => \`
              <tr>
                <td>\${escapeHtml(attempt.cropId)}</td>
                <td><span class="pill warn">\${escapeHtml(attempt.qaStatus)}</span><br>\${attempt.qaIssues.map(escapeHtml).join("<br>")}</td>
                <td><span class="pill \${attempt.status === "error" ? "bad" : ""}">\${escapeHtml(attempt.action || attempt.status)}</span></td>
                <td>\${escapeHtml(JSON.stringify(attempt.beforeBbox))}</td>
                <td>\${escapeHtml(JSON.stringify(attempt.afterBbox || null))}</td>
                <td>\${escapeHtml(attempt.reason || attempt.error || "")}</td>
              </tr>
            \`).join("")}</tbody>
          </table>
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
    })) as unknown as MarkingGuidePageProposal[],
    cropQa: {
      ...report.cropQa,
      candidates: report.cropQa.candidates.map((candidate) => ({
        ...candidate,
        sourcePagePath: normalisePath(candidate.sourcePagePath),
        cropPath: normalisePath(candidate.cropPath),
        cropUrl: localFileUrl(candidate.cropPath)
      })),
      initialSheets: report.cropQa.initialSheets.map((sheet) => ({
        ...sheet,
        path: normalisePath(sheet.path),
        imageUrl: localFileUrl(sheet.path)
      })),
      sheets: report.cropQa.sheets.map((sheet) => ({
        ...sheet,
        path: normalisePath(sheet.path),
        imageUrl: localFileUrl(sheet.path)
      }))
    } as unknown as CropQaReport
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
  console.log(
    `Repairs: ${report.totals.deterministicRepairs} deterministic, ${report.totals.aiRepairs} AI; unresolved questions: ${report.totals.unresolvedQuestions}.`
  );
  console.log(
    `Crop QA: ${report.totals.cropCandidates} candidate crop(s), ${report.totals.flaggedCrops} flagged.`
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
