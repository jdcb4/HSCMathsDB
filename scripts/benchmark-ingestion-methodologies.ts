import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { database } from "../src/services/hscDatabase";
import { additionalMathsProfiles } from "./additional-maths-profiles";
import { getOpenRouterApiKey, loadDotEnv, safeFileName } from "./llm-worked-solution-tools";

type Args = {
  force: boolean;
  renderOnly: boolean;
  skipLlm: boolean;
  models: string[];
};

type ModelPricing = {
  prompt?: string;
  completion?: string;
  image?: string;
};

type BenchmarkQuestion = {
  questionNumber: number;
  id: string;
  promptLatex: string;
  answerLatex: string;
  assetCount: number;
  assetLabels: string[];
};

type TrialResult = {
  id: string;
  method: string;
  model?: string;
  paperId: string;
  inputScope: string;
  status: "ok" | "error" | "skipped";
  latencyMs: number;
  estimatedCostUsd?: number;
  metrics: Record<string, number | string | boolean>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  outputPreview: string;
  rawPath?: string;
  error?: string;
};

type BenchmarkReport = {
  generatedAt: string;
  promptVersion: string;
  modelCatalog: Array<{
    id: string;
    contextLength?: number;
    pricing?: ModelPricing;
  }>;
  baseline: {
    papers: Array<{
      paperId: string;
      questionCount: number;
      assetQuestionNumbers: number[];
      assetCount: number;
    }>;
  };
  methodologySummaries: Array<{
    id: string;
    title: string;
    description: string;
    automationPotential: "high" | "medium" | "low";
    reviewedImporterReplacementRisk: "high" | "medium" | "low";
    recommendation: string;
  }>;
  trials: TrialResult[];
  conclusions: string[];
};

const promptVersion = "ingestion-methodology-benchmark-v1";
const outputRoot = path.join("var", "ingestion-methodology-benchmark");
const rawRoot = path.join(outputRoot, "raw");
const reportJsonPath = path.join("public", "ingestion-methodology-benchmark-results.json");
const reportHtmlPath = path.join("public", "ingestion-methodology-benchmark-report.html");

const defaultModels = [
  "google/gemini-3.1-flash-lite",
  "google/gemini-2.5-flash-lite",
  "qwen/qwen3-vl-8b-instruct",
  "minimax/minimax-m3",
  "qwen/qwen3.7-plus"
];

const benchmarkPaperIds = ["ext1-2025", "ext2-2025"] as const;

const pageTrials = [
  {
    paperId: "ext1-2025",
    page: 6,
    questions: [9, 10],
    expectedVisualQuestions: [9],
    title: "Extension 1 page with vector-angle diagram"
  },
  {
    paperId: "ext2-2025",
    page: 5,
    questions: [8],
    expectedVisualQuestions: [8],
    title: "Extension 2 graph-choice page"
  },
  {
    paperId: "ext2-2025",
    page: 18,
    questions: [11],
    expectedVisualQuestions: [11],
    title: "Extension 2 writing-booklet complex plane"
  }
] as const;

const FullExamSchema = z
  .object({
    paperId: z.string().optional(),
    questions: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]),
            partLabels: z.array(z.string()).default([]),
            hasVisual: z.boolean().default(false),
            needsAsset: z.boolean().default(false),
            visualDescription: z.string().nullable().optional(),
            promptLatex: z.string().optional(),
            extractionRisks: z.array(z.string()).default([]),
            confidence: z.number().optional()
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

const PageExtractionSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]),
            promptLatex: z.string().default(""),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  textLatex: z.string()
                })
              )
              .default([]),
            hasVisual: z.boolean().default(false),
            needsAsset: z.boolean().default(false),
            visualDescription: z.string().nullable().optional(),
            confidence: z.number().optional(),
            notes: z.array(z.string()).default([])
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

const VisualDetectionSchema = z
  .object({
    visuals: z
      .array(
        z
          .object({
            questionNumber: z.union([z.number(), z.string()]).nullable().optional(),
            kind: z.enum(["diagram", "graph", "table", "image", "other"]).optional(),
            description: z.string().default(""),
            shouldExtract: z.boolean().default(false),
            confidence: z.number().optional(),
            bbox: z
              .object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number()
              })
              .optional()
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  await mkdir(rawRoot, { recursive: true });

  if (args.renderOnly) {
    const report = JSON.parse(await readFile(reportJsonPath, "utf8")) as BenchmarkReport;
    await writeFile(reportHtmlPath, buildReportHtml(report), "utf8");
    console.log(`Rendered ${reportHtmlPath} from ${reportJsonPath}`);
    return;
  }

  const modelCatalog = await fetchModelCatalog(args.models);
  const trials: TrialResult[] = [];

  for (const paperId of benchmarkPaperIds) {
    trials.push(await runGuideFirstSplitter(paperId));
    trials.push(await runLayoutVisualDetector(paperId));
  }

  if (!args.skipLlm) {
    const apiKey = getOpenRouterApiKey();
    const textModels = args.models.filter((model) => !model.includes("-vl-"));
    const visionModels = args.models.filter((model) => isVisionCandidate(model, modelCatalog));

    for (const model of textModels.slice(0, 3)) {
      trials.push(
        await runFullExamTextLlm({ apiKey, model, paperId: "ext1-2025", force: args.force, modelCatalog })
      );
    }

    for (const pageTrial of pageTrials) {
      for (const model of visionModels.slice(0, 3)) {
        trials.push(
          await runPageImageExtractionLlm({ apiKey, model, pageTrial, force: args.force, modelCatalog })
        );
        trials.push(
          await runPageImageVisualDetectorLlm({ apiKey, model, pageTrial, force: args.force, modelCatalog })
        );
      }
    }
  } else {
    trials.push({
      id: "llm-skipped",
      method: "llm",
      paperId: "ext1-2025",
      inputScope: "all LLM trials",
      status: "skipped",
      latencyMs: 0,
      metrics: {},
      strengths: [],
      weaknesses: ["LLM trials were skipped by command-line option."],
      recommendation: "Run without --skip-llm when OPENROUTER_API_KEY is available.",
      outputPreview: ""
    });
  }

  const report: BenchmarkReport = {
    generatedAt: new Date().toISOString(),
    promptVersion,
    modelCatalog,
    baseline: {
      papers: benchmarkPaperIds.map((paperId) => {
        const questions = getPaperQuestions(paperId);
        return {
          paperId,
          questionCount: questions.length,
          assetQuestionNumbers: questions
            .filter((question) => question.assetCount > 0)
            .map((question) => question.questionNumber),
          assetCount: questions.reduce((total, question) => total + question.assetCount, 0)
        };
      })
    },
    methodologySummaries: buildMethodologySummaries(),
    trials,
    conclusions: buildConclusions(trials)
  };

  const publishableReport = publicReport(report);
  await writeFile(path.join(outputRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(reportJsonPath, `${JSON.stringify(publishableReport, null, 2)}\n`, "utf8");
  await writeFile(reportHtmlPath, buildReportHtml(publishableReport), "utf8");

  printSummary(report);
}

function parseArgs(values: string[]): Args {
  const args: Args = {
    force: false,
    renderOnly: false,
    skipLlm: false,
    models: defaultModels
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--force") {
      args.force = true;
    } else if (value === "--render-only") {
      args.renderOnly = true;
    } else if (value === "--skip-llm") {
      args.skipLlm = true;
    } else if (value === "--models") {
      args.models = (values[index + 1] ?? "")
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  if (args.models.length === 0) {
    throw new Error("At least one model is required.");
  }

  return args;
}

async function fetchModelCatalog(modelIds: string[]): Promise<BenchmarkReport["modelCatalog"]> {
  try {
    const apiKey = getOpenRouterApiKey();
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const raw = (await response.json()) as {
      data?: Array<{
        id: string;
        context_length?: number;
        pricing?: ModelPricing;
      }>;
    };

    return (raw.data ?? [])
      .filter((model) => modelIds.includes(model.id))
      .map((model) => ({
        id: model.id,
        contextLength: model.context_length,
        pricing: model.pricing
      }));
  } catch {
    return modelIds.map((id) => ({ id }));
  }
}

async function runGuideFirstSplitter(paperId: string): Promise<TrialResult> {
  const startedAt = Date.now();
  const profile = getProfile(paperId);
  const guideText = await readFile(profile.markingGuideTextPath, "utf8");
  const examText = await readFile(profile.examTextPath, "utf8");
  const guideQuestions = [...guideText.matchAll(/\bQuestion\s+(\d{1,2})(?:\s+\(([a-ziv]+)\))?/gi)].map(
    (match) => ({
      questionNumber: Number(match[1]),
      partLabel: match[2]
    })
  );
  const answerKeyQuestions = [
    ...guideText
      .slice(0, Math.max(guideText.indexOf("Section II"), 0) || guideText.length)
      .matchAll(/(?:^|\n)\s*(\d{1,2})\s*\n\s*[A-D]\s*(?=\n)/g)
  ].map((match) => Number(match[1]));
  const examQuestions = [...examText.matchAll(/(?:^|\n)(?:Question\s+)?(\d{1,2})\s*(?=\n|[A-Z(])/g)].map(
    (match) => Number(match[1])
  );
  const baseline = getPaperQuestions(paperId);
  const expectedNumbers = baseline.map((question) => question.questionNumber);
  const guideNumbers = uniqueSorted([
    ...answerKeyQuestions,
    ...guideQuestions.map((question) => question.questionNumber)
  ]);
  const examNumbers = uniqueSorted(examQuestions.filter((number) => number >= 1 && number <= 20));
  const guideRecall = recall(expectedNumbers, guideNumbers);
  const guidePrecision = precision(expectedNumbers, guideNumbers);

  return {
    id: `${paperId}-guide-first-splitter`,
    method: "guide-first-splitter",
    paperId,
    inputScope: "marking guide text + exam text",
    status: "ok",
    latencyMs: Date.now() - startedAt,
    metrics: {
      expectedQuestions: expectedNumbers.length,
      guideQuestionCount: guideNumbers.length,
      answerKeyQuestionCount: answerKeyQuestions.length,
      examQuestionCandidateCount: examNumbers.length,
      guideRecall,
      guidePrecision,
      guidePartMarkers: guideQuestions.filter((question) => question.partLabel).length
    },
    strengths: [
      "Finds the authoritative question list and part labels from the marking guide before splitting the exam.",
      "Cheap, deterministic, and useful as a scaffold for the rest of the workflow."
    ],
    weaknesses: [
      "Does not recover prompt wording or visual crop bounds.",
      "Section I answer-key pages can be sparse, so exam text/layout still needs a second pass."
    ],
    recommendation:
      guideRecall >= 0.9
        ? "Use this as the first pass for question and part skeletons."
        : "Use only as a weak signal until the heading parser is improved.",
    outputPreview: JSON.stringify({ guideNumbers, examNumbers: examNumbers.slice(0, 25) }, null, 2)
  };
}

async function runLayoutVisualDetector(paperId: string): Promise<TrialResult> {
  const startedAt = Date.now();
  const profile = getProfile(paperId);
  const baselineVisuals = getPaperQuestions(paperId)
    .filter((question) => question.assetCount > 0)
    .map((question) => question.questionNumber);
  const inventory = await readLayoutInventory(profile.sourcePackId);
  const examText = await readFile(profile.examTextPath, "utf8");
  const pageVisualHints = new Set<number>();

  for (const page of inventory.pages) {
    const drawingArea = page.drawings.reduce((total, drawing) => total + drawing.width * drawing.height, 0);
    const hasVisualText = /diagram|graph|shown|table|not to scale|slope field|unit circle/i.test(
      page.textBlocks.map((block) => block.text).join(" ")
    );
    if (drawingArea > 25000 || page.images.length > 0 || hasVisualText) {
      pageVisualHints.add(page.page);
    }
  }

  const predictedQuestions = inferVisualQuestionsFromText(profile.boundaries, examText, [...pageVisualHints]);
  const visualRecall = recall(baselineVisuals, predictedQuestions);
  const visualPrecision = precision(baselineVisuals, predictedQuestions);

  return {
    id: `${paperId}-layout-visual-detector`,
    method: "layout-visual-detector",
    paperId,
    inputScope: "PyMuPDF layout inventory + raw exam text",
    status: "ok",
    latencyMs: Date.now() - startedAt,
    metrics: {
      baselineVisualQuestions: baselineVisuals.length,
      predictedVisualQuestions: predictedQuestions.length,
      visualRecall,
      visualPrecision,
      visualHintPages: pageVisualHints.size
    },
    strengths: [
      "Local, free, and transparent.",
      "Good at flagging pages where vector drawings or tables make a manual/LLM visual pass worthwhile."
    ],
    weaknesses: [
      "Question mapping is approximate unless page-aware question boundaries are added.",
      "Cannot decide whether a student-produced sketch needs no source asset."
    ],
    recommendation:
      visualRecall >= 0.8
        ? "Use before LLM calls to decide which pages/questions need image processing."
        : "Use as a page-level hint only; add question-aware boundaries before relying on it.",
    outputPreview: JSON.stringify(
      { baselineVisuals, predictedQuestions, visualHintPages: [...pageVisualHints] },
      null,
      2
    )
  };
}

async function runFullExamTextLlm({
  apiKey,
  model,
  paperId,
  force,
  modelCatalog
}: {
  apiKey: string;
  model: string;
  paperId: string;
  force: boolean;
  modelCatalog: BenchmarkReport["modelCatalog"];
}): Promise<TrialResult> {
  const startedAt = Date.now();
  const profile = getProfile(paperId);
  const rawPath = path.join(rawRoot, `${safeFileName(paperId)}__full-exam__${safeFileName(model)}.json`);
  const baselineVisuals = getPaperQuestions(paperId)
    .filter((question) => question.assetCount > 0)
    .map((question) => question.questionNumber);

  try {
    const cached = !force ? await readCachedRaw(rawPath) : undefined;
    const response =
      cached ??
      (await callOpenRouterJson({
        apiKey,
        model,
        title: "GoalCheck HSC ingestion full-exam benchmark",
        maxTokens: 12000,
        messages: [
          {
            role: "system",
            content:
              "You are extracting NSW HSC Mathematics exam records into strict JSON. Preserve exam wording where possible, normalise mathematical notation to TeX, and do not invent content."
          },
          {
            role: "user",
            content: buildFullExamPrompt({
              paperId,
              examText: truncateMiddle(await readFile(profile.examTextPath, "utf8"), 90000),
              markingGuideText: truncateMiddle(await readFile(profile.markingGuideTextPath, "utf8"), 90000)
            })
          }
        ]
      }));

    if (!cached) {
      await writeFile(rawPath, `${JSON.stringify(response.raw, null, 2)}\n`, "utf8");
    }

    const parsed = FullExamSchema.parse(parseModelJson(response.content));
    const predictedNumbers = uniqueSorted(
      parsed.questions.map((question) => toQuestionNumber(question.questionNumber))
    );
    const predictedVisuals = uniqueSorted(
      parsed.questions
        .filter((question) => question.needsAsset || question.hasVisual)
        .map((question) => toQuestionNumber(question.questionNumber))
    );
    const expectedNumbers = getPaperQuestions(paperId).map((question) => question.questionNumber);
    const questionRecall = recall(expectedNumbers, predictedNumbers);
    const visualRecall = recall(baselineVisuals, predictedVisuals);
    const visualPrecision = precision(baselineVisuals, predictedVisuals);
    const cost = estimateCost(model, modelCatalog, response.raw);

    return {
      id: `${paperId}-full-exam-text-${safeFileName(model)}`,
      method: "llm-full-exam-text-schema",
      model,
      paperId,
      inputScope: "whole extracted exam text + whole marking guide text",
      status: "ok",
      latencyMs: Date.now() - startedAt,
      estimatedCostUsd: cost,
      metrics: {
        questionsExtracted: predictedNumbers.length,
        questionRecall,
        visualRecall,
        visualPrecision,
        extractionRiskCount: parsed.questions.reduce(
          (total, question) => total + question.extractionRisks.length,
          0
        )
      },
      strengths: [
        "Can see the whole paper and marking-guide structure in one call.",
        "Useful for generating a draft skeleton and identifying risky questions."
      ],
      weaknesses: [
        "High blast radius if trusted directly.",
        "Can compress or paraphrase wording unless outputs are treated as proposals only."
      ],
      recommendation:
        questionRecall >= 0.9
          ? "Use as an integrated proposal pass after deterministic extraction, with review gates."
          : "Use for triage only until schema adherence and question recall improve.",
      outputPreview: previewJson(parsed, 4000),
      rawPath: normalisePath(rawPath)
    };
  } catch (error: unknown) {
    return trialError({
      id: `${paperId}-full-exam-text-${safeFileName(model)}`,
      method: "llm-full-exam-text-schema",
      model,
      paperId,
      inputScope: "whole extracted exam text + whole marking guide text",
      startedAt,
      error
    });
  }
}

async function runPageImageExtractionLlm({
  apiKey,
  model,
  pageTrial,
  force,
  modelCatalog
}: {
  apiKey: string;
  model: string;
  pageTrial: (typeof pageTrials)[number];
  force: boolean;
  modelCatalog: BenchmarkReport["modelCatalog"];
}): Promise<TrialResult> {
  const startedAt = Date.now();
  const rawPath = path.join(
    rawRoot,
    `${safeFileName(pageTrial.paperId)}__page-${pageTrial.page}__extract__${safeFileName(model)}.json`
  );

  try {
    const cached = !force ? await readCachedRaw(rawPath) : undefined;
    const response =
      cached ??
      (await callOpenRouterJson({
        apiKey,
        model,
        title: "GoalCheck HSC ingestion page image extraction benchmark",
        maxTokens: 6000,
        messages: [
          {
            role: "system",
            content:
              "You transcribe a single rendered NSW HSC Mathematics exam page into JSON. Use TeX for math. Preserve labels A-D and identify visuals that should become assets."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildPageExtractionPrompt(pageTrial)
              },
              {
                type: "image_url",
                image_url: { url: await pageImageDataUrl(pageTrial.paperId, pageTrial.page) }
              }
            ]
          }
        ]
      }));

    if (!cached) {
      await writeFile(rawPath, `${JSON.stringify(response.raw, null, 2)}\n`, "utf8");
    }

    const parsed = PageExtractionSchema.parse(parseModelJson(response.content));
    const predictedNumbers = uniqueSorted(
      parsed.questions.map((question) => toQuestionNumber(question.questionNumber))
    );
    const predictedVisuals = uniqueSorted(
      parsed.questions
        .filter((question) => question.needsAsset || question.hasVisual)
        .map((question) => toQuestionNumber(question.questionNumber))
    );
    const expectedNumbers = [...pageTrial.questions];
    const questionRecall = recall(expectedNumbers, predictedNumbers);
    const visualRecall = recall([...pageTrial.expectedVisualQuestions], predictedVisuals);
    const visualPrecision = precision([...pageTrial.expectedVisualQuestions], predictedVisuals);
    const texNoiseCount = countTexNoise(JSON.stringify(parsed));
    const cost = estimateCost(model, modelCatalog, response.raw);

    return {
      id: `${pageTrial.paperId}-page-${pageTrial.page}-extract-${safeFileName(model)}`,
      method: "llm-page-image-question-schema",
      model,
      paperId: pageTrial.paperId,
      inputScope: `${pageTrial.title}; page image`,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      estimatedCostUsd: cost,
      metrics: {
        questionsExtracted: predictedNumbers.length,
        questionRecall,
        visualRecall,
        visualPrecision,
        texNoiseCount
      },
      strengths: [
        "Can recover math notation and diagram context from the rendered page, bypassing damaged PDF text.",
        "Good candidate for formula-heavy pages and multiple-choice visual options."
      ],
      weaknesses: [
        "One page can contain partial questions, continuations, or booklet material.",
        "Still needs deterministic reconciliation against the marking-guide question skeleton."
      ],
      recommendation:
        questionRecall >= 0.9 && texNoiseCount === 0
          ? "Use as a high-value proposal pass for difficult pages."
          : "Use for visual/formula proposals, not as the sole question splitter.",
      outputPreview: previewJson(parsed, 3500),
      rawPath: normalisePath(rawPath)
    };
  } catch (error: unknown) {
    return trialError({
      id: `${pageTrial.paperId}-page-${pageTrial.page}-extract-${safeFileName(model)}`,
      method: "llm-page-image-question-schema",
      model,
      paperId: pageTrial.paperId,
      inputScope: `${pageTrial.title}; page image`,
      startedAt,
      error
    });
  }
}

async function runPageImageVisualDetectorLlm({
  apiKey,
  model,
  pageTrial,
  force,
  modelCatalog
}: {
  apiKey: string;
  model: string;
  pageTrial: (typeof pageTrials)[number];
  force: boolean;
  modelCatalog: BenchmarkReport["modelCatalog"];
}): Promise<TrialResult> {
  const startedAt = Date.now();
  const rawPath = path.join(
    rawRoot,
    `${safeFileName(pageTrial.paperId)}__page-${pageTrial.page}__visuals__${safeFileName(model)}.json`
  );

  try {
    const cached = !force ? await readCachedRaw(rawPath) : undefined;
    const response =
      cached ??
      (await callOpenRouterJson({
        apiKey,
        model,
        title: "GoalCheck HSC ingestion visual detector benchmark",
        maxTokens: 3000,
        messages: [
          {
            role: "system",
            content:
              "You identify which visuals on a rendered exam page should be extracted as reusable question assets. Return only JSON."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildVisualPrompt(pageTrial)
              },
              {
                type: "image_url",
                image_url: { url: await pageImageDataUrl(pageTrial.paperId, pageTrial.page) }
              }
            ]
          }
        ]
      }));

    if (!cached) {
      await writeFile(rawPath, `${JSON.stringify(response.raw, null, 2)}\n`, "utf8");
    }

    const parsed = VisualDetectionSchema.parse(parseModelJson(response.content));
    const predictedVisuals = uniqueSorted(
      parsed.visuals
        .filter((visual) => visual.shouldExtract)
        .map((visual) => toQuestionNumber(visual.questionNumber ?? 0))
        .filter((questionNumber) => questionNumber > 0)
    );
    const visualRecall = recall([...pageTrial.expectedVisualQuestions], predictedVisuals);
    const visualPrecision = precision([...pageTrial.expectedVisualQuestions], predictedVisuals);
    const bboxCount = parsed.visuals.filter((visual) => visual.bbox).length;
    const cost = estimateCost(model, modelCatalog, response.raw);

    return {
      id: `${pageTrial.paperId}-page-${pageTrial.page}-visuals-${safeFileName(model)}`,
      method: "llm-page-image-visual-detector",
      model,
      paperId: pageTrial.paperId,
      inputScope: `${pageTrial.title}; page image`,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      estimatedCostUsd: cost,
      metrics: {
        visualsDetected: parsed.visuals.length,
        extractableVisuals: predictedVisuals.length,
        visualRecall,
        visualPrecision,
        bboxCount
      },
      strengths: [
        "Targets the highest-friction manual step: deciding which diagrams/tables must become assets.",
        "Can draft crop descriptions and alt text before human review."
      ],
      weaknesses: [
        "Bounding boxes are approximate and need coordinate verification.",
        "Model may mark decorative or answer-space visuals unless constrained by the question skeleton."
      ],
      recommendation:
        visualRecall >= 0.9
          ? "Use before crop generation to prioritise pages and draft asset metadata."
          : "Use as a secondary signal alongside PyMuPDF layout inventory.",
      outputPreview: previewJson(parsed, 3000),
      rawPath: normalisePath(rawPath)
    };
  } catch (error: unknown) {
    return trialError({
      id: `${pageTrial.paperId}-page-${pageTrial.page}-visuals-${safeFileName(model)}`,
      method: "llm-page-image-visual-detector",
      model,
      paperId: pageTrial.paperId,
      inputScope: `${pageTrial.title}; page image`,
      startedAt,
      error
    });
  }
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
}): Promise<{ content: string; raw: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75_000);
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
  const raw = (await response.json().catch(async () => ({ rawText: await response.text() }))) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(raw)}`);
  }

  const content = raw.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`OpenRouter returned non-string content for ${model}`);
  }

  return { content, raw };
}

async function readCachedRaw(rawPath: string): Promise<{ content: string; raw: unknown } | undefined> {
  if (!existsSync(rawPath)) {
    return undefined;
  }

  const raw = JSON.parse(await readFile(rawPath, "utf8")) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = raw.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return undefined;
  }
  return { content, raw };
}

function buildFullExamPrompt({
  paperId,
  examText,
  markingGuideText
}: {
  paperId: string;
  examText: string;
  markingGuideText: string;
}): string {
  return `Extract a proposal for ${paperId}.

Return this JSON shape:
{
  "paperId": "${paperId}",
  "questions": [
    {
      "questionNumber": 1,
      "partLabels": [],
      "hasVisual": false,
      "needsAsset": false,
      "visualDescription": null,
      "promptLatex": "near-verbatim prompt with TeX math",
      "extractionRisks": ["only if relevant"],
      "confidence": 0.0
    }
  ]
}

Rules:
- Preserve source wording where possible.
- Convert math symbols to TeX.
- Mark needsAsset true for shown/provided graphs, diagrams, tables, maps, networks, and writing-booklet visuals.
- Do not mark needsAsset true when the student is asked to sketch their own graph and no source visual is provided.
- Use the marking guide primarily to confirm question numbers and part labels.

EXAM TEXT:
${examText}

MARKING GUIDE TEXT:
${markingGuideText}`;
}

function buildPageExtractionPrompt(pageTrial: (typeof pageTrials)[number]): string {
  return `Transcribe this rendered exam page into JSON.

Known context:
- paperId: ${pageTrial.paperId}
- page: ${pageTrial.page}
- likely questions: ${pageTrial.questions.join(", ")}

Return this JSON shape:
{
  "questions": [
    {
      "questionNumber": 1,
      "promptLatex": "near-verbatim prompt with TeX math",
      "options": [{"label": "A", "textLatex": "..."}],
      "hasVisual": false,
      "needsAsset": false,
      "visualDescription": null,
      "confidence": 0.0,
      "notes": []
    }
  ]
}

Rules:
- Use TeX for all mathematical notation.
- Do not include page headers, footers, copyright text, or answer-space instructions unless they are needed for the question.
- If a graph/table/diagram is shown and is needed to answer, set hasVisual and needsAsset true.
- If the page contains answer-writing lines, ignore them unless a question diagram appears on them.`;
}

function buildVisualPrompt(pageTrial: (typeof pageTrials)[number]): string {
  return `Identify reusable visual assets on this rendered exam page.

Known context:
- paperId: ${pageTrial.paperId}
- page: ${pageTrial.page}
- likely questions: ${pageTrial.questions.join(", ")}

Return this JSON shape:
{
  "visuals": [
    {
      "questionNumber": 1,
      "kind": "graph",
      "description": "what the visual shows",
      "shouldExtract": true,
      "confidence": 0.0,
      "bbox": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ]
}

Rules:
- shouldExtract is true only when the visual is part of the source question and should become an app asset.
- Include approximate bbox coordinates in rendered image pixels where possible.
- Ignore blank writing lines and administrative page furniture.`;
}

async function pageImageDataUrl(paperId: string, page: number): Promise<string> {
  const profile = getProfile(paperId);
  const renderDirectory = path.join("var", "rendered-pages", profile.sourcePackId);
  const documentDirectory = (await readdir(renderDirectory, { withFileTypes: true })).find((entry) =>
    entry.isDirectory()
  );
  if (!documentDirectory) {
    throw new Error(`No rendered document directory found for ${paperId}`);
  }
  const imagePath = path.join(
    renderDirectory,
    documentDirectory.name,
    `page-${page.toString().padStart(3, "0")}.png`
  );
  const base64 = (await readFile(imagePath)).toString("base64");
  return `data:image/png;base64,${base64}`;
}

function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    return JSON.parse(fenced[1]);
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
  throw new Error("Model response did not contain JSON.");
}

async function readLayoutInventory(sourcePackId: string): Promise<{
  pages: Array<{
    page: number;
    textBlocks: Array<{ text: string }>;
    images: unknown[];
    drawings: Array<{ width: number; height: number }>;
  }>;
}> {
  const inventoryDirectory = path.join("var", "layout-inventory", sourcePackId);
  const inventoryFile = (await readdir(inventoryDirectory)).find(
    (file) => file.endsWith(".json") && file !== "metadata.json"
  );
  if (!inventoryFile) {
    return { pages: [] };
  }

  const raw = JSON.parse(await readFile(path.join(inventoryDirectory, inventoryFile), "utf8")) as {
    pages?: Array<{
      page_number?: number;
      page?: number;
      text_blocks?: Array<{ text?: string }>;
      image_blocks?: unknown[];
      images?: unknown[];
      drawings?: Array<{ bbox?: [number, number, number, number] }>;
      drawing_clusters?: Array<{ bbox?: [number, number, number, number] }>;
    }>;
  };

  return {
    pages: (raw.pages ?? []).map((page) => ({
      page: page.page_number ?? page.page ?? 0,
      textBlocks: (page.text_blocks ?? []).map((block) => ({ text: block.text ?? "" })),
      images: page.image_blocks ?? page.images ?? [],
      drawings: [...(page.drawings ?? []), ...(page.drawing_clusters ?? [])].map((drawing) => {
        const bbox = drawing.bbox ?? [0, 0, 0, 0];
        return {
          width: Math.abs(bbox[2] - bbox[0]),
          height: Math.abs(bbox[3] - bbox[1])
        };
      })
    }))
  };
}

function inferVisualQuestionsFromText(
  boundaries: Array<{ questionNumber: number; startIndex: number; endIndex: number }>,
  examText: string,
  visualPages: number[]
): number[] {
  const lines = examText.split(/\r?\n/);
  const predicted = new Set<number>();

  for (const boundary of boundaries) {
    const block = lines.slice(boundary.startIndex, boundary.endIndex).join(" ");
    const pageNumbers = [...block.matchAll(/--- page (\d+) ---/g)].map((match) => Number(match[1]));
    const hasVisualPage = pageNumbers.some((page) => visualPages.includes(page));
    const hasVisualCue =
      /diagram|graph|shown|table|not to scale|slope field|unit circle|writing booklet/i.test(block);
    if (hasVisualPage || hasVisualCue) {
      predicted.add(boundary.questionNumber);
    }
  }

  return uniqueSorted([...predicted]);
}

function getProfile(paperId: string) {
  const profile = additionalMathsProfiles.find((candidate) => candidate.paperId === paperId);
  if (!profile) {
    throw new Error(`No ingestion profile found for ${paperId}`);
  }
  return profile;
}

function getPaperQuestions(paperId: string): BenchmarkQuestion[] {
  return database.questions
    .filter((question) => question.paperId === paperId)
    .map((question) => ({
      id: question.id,
      questionNumber: toQuestionNumber(question.questionNumber),
      promptLatex: question.promptLatex,
      answerLatex: question.answerLatex,
      assetCount: question.assets.length,
      assetLabels: question.assets.map((asset) => asset.label)
    }))
    .sort((left, right) => left.questionNumber - right.questionNumber);
}

function isVisionCandidate(model: string, catalog: BenchmarkReport["modelCatalog"]): boolean {
  if (/gemini|vl|vision|image/i.test(model)) {
    return true;
  }

  const pricing = catalog.find((entry) => entry.id === model)?.pricing;
  return Boolean(pricing?.image && Number(pricing.image) > 0);
}

function toQuestionNumber(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }
  return Number(value.replace(/\D/g, ""));
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))].sort((a, b) => a - b);
}

function recall(expected: number[], actual: number[]): number {
  if (expected.length === 0) {
    return actual.length === 0 ? 1 : 0;
  }
  const actualSet = new Set(actual);
  return round(expected.filter((value) => actualSet.has(value)).length / expected.length);
}

function precision(expected: number[], actual: number[]): number {
  if (actual.length === 0) {
    return expected.length === 0 ? 1 : 0;
  }
  const expectedSet = new Set(expected);
  return round(actual.filter((value) => expectedSet.has(value)).length / actual.length);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function countTexNoise(value: string): number {
  return (value.match(/(?:\u0192|\u0330|Ã|ï¿½|\bp\b|\bq\b)/g) ?? []).length;
}

function estimateCost(
  model: string,
  catalog: BenchmarkReport["modelCatalog"],
  raw: unknown
): number | undefined {
  const pricing = catalog.find((entry) => entry.id === model)?.pricing;
  const usage = raw as {
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  if (!pricing || !usage.usage) {
    return undefined;
  }

  const promptPrice = Number(pricing.prompt ?? 0);
  const completionPrice = Number(pricing.completion ?? 0);
  const promptTokens = usage.usage.prompt_tokens ?? 0;
  const completionTokens = usage.usage.completion_tokens ?? 0;
  return round(promptTokens * promptPrice + completionTokens * completionPrice);
}

function trialError({
  id,
  method,
  model,
  paperId,
  inputScope,
  startedAt,
  error
}: {
  id: string;
  method: string;
  model?: string;
  paperId: string;
  inputScope: string;
  startedAt: number;
  error: unknown;
}): TrialResult {
  return {
    id,
    method,
    model,
    paperId,
    inputScope,
    status: "error",
    latencyMs: Date.now() - startedAt,
    metrics: {},
    strengths: [],
    weaknesses: ["Trial failed before producing a parseable proposal."],
    recommendation: "Inspect the raw error before using this method.",
    outputPreview: "",
    error: error instanceof Error ? error.message : String(error)
  };
}

function previewJson(value: unknown, maxLength: number): string {
  return truncateMiddle(JSON.stringify(value, null, 2), maxLength);
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  const half = Math.floor((maxLength - 28) / 2);
  return `${value.slice(0, half)}\n\n... [truncated for benchmark prompt/report] ...\n\n${value.slice(-half)}`;
}

function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function buildMethodologySummaries(): BenchmarkReport["methodologySummaries"] {
  return [
    {
      id: "guide-first-splitter",
      title: "Marking Guide First Splitter",
      description:
        "Uses the marking guide as the authoritative skeleton for question numbers and part labels before aligning exam text.",
      automationPotential: "high",
      reviewedImporterReplacementRisk: "low",
      recommendation: "Promote into the default pipeline as a skeleton stage."
    },
    {
      id: "layout-visual-detector",
      title: "Question-Aware Layout Visual Detector",
      description:
        "Combines PyMuPDF layout hints, rendered-page drawings, and visual cue text to decide which questions need assets.",
      automationPotential: "medium",
      reviewedImporterReplacementRisk: "low",
      recommendation: "Use as a cheap pre-filter before LLM vision calls."
    },
    {
      id: "llm-full-exam-text-schema",
      title: "LLM Whole Exam Text to Schema",
      description:
        "Sends extracted exam and marking-guide text to an LLM with a strict schema for question skeletons, visual flags, and risks.",
      automationPotential: "medium",
      reviewedImporterReplacementRisk: "medium",
      recommendation: "Use as an integrated proposal layer, not as direct corpus writes."
    },
    {
      id: "llm-page-image-question-schema",
      title: "LLM Page Image to Question Schema",
      description:
        "Sends rendered page images to vision models to recover TeX, multiple-choice options, and visual dependencies.",
      automationPotential: "high",
      reviewedImporterReplacementRisk: "medium",
      recommendation: "Use for pages flagged by deterministic audit/layout heuristics."
    },
    {
      id: "llm-page-image-visual-detector",
      title: "LLM Page Image Visual Detector",
      description:
        "Asks vision models to identify extractable visuals and draft crop descriptions or bounding boxes.",
      automationPotential: "high",
      reviewedImporterReplacementRisk: "low",
      recommendation: "Use to prioritise crops and draft asset metadata before human review."
    }
  ];
}

function buildConclusions(trials: TrialResult[]): string[] {
  const okTrials = trials.filter((trial) => trial.status === "ok");
  const pageVisionTrials = okTrials.filter((trial) => trial.method === "llm-page-image-question-schema");
  const visualTrials = okTrials.filter((trial) => trial.method === "llm-page-image-visual-detector");
  const fullExamTrials = okTrials.filter((trial) => trial.method === "llm-full-exam-text-schema");

  return [
    "A near-autonomous ingestion path should be staged: marking-guide skeleton, deterministic layout visual filter, selective LLM page-image extraction, then reviewed profile promotion.",
    "The LLM should be allowed into the integrated flow as a proposal generator for page images and visual metadata, but direct writes to the canonical corpus remain too risky without review gates.",
    `This run completed ${okTrials.length}/${trials.length} trials successfully.`,
    pageVisionTrials.length > 0
      ? "Page-image extraction is the most promising replacement for question-specific notation overrides because it reads the rendered math instead of damaged PDF glyph text."
      : "Page-image extraction could not be assessed in this run.",
    visualTrials.length > 0
      ? "Vision-based visual detection is a good companion to PyMuPDF because it can distinguish meaningful question diagrams from page furniture."
      : "Vision-based visual detection could not be assessed in this run.",
    fullExamTrials.length > 0
      ? "Whole-exam LLM extraction is useful for triage and skeleton proposals, but its output should be reconciled against marking-guide and page-level passes."
      : "Whole-exam LLM extraction could not be assessed in this run."
  ];
}

function publicReport(report: BenchmarkReport): BenchmarkReport {
  return {
    ...report,
    trials: report.trials.map((trial) => ({
      ...trial,
      rawPath: trial.rawPath ? undefined : undefined,
      outputPreview: truncateMiddle(trial.outputPreview, 1800),
      error: trial.error ? truncateMiddle(trial.error, 900) : undefined
    }))
  };
}

function printSummary(report: BenchmarkReport) {
  console.log(`Wrote ${reportJsonPath}`);
  console.log(`Wrote ${reportHtmlPath}`);
  console.log(`Trials: ${report.trials.length}`);
  for (const trial of report.trials) {
    const cost = trial.estimatedCostUsd === undefined ? "" : ` cost=$${trial.estimatedCostUsd.toFixed(5)}`;
    console.log(
      `${trial.status.toUpperCase()} ${trial.method} ${trial.model ?? ""} ${trial.inputScope}${cost}`
    );
  }
}

function buildReportHtml(report: BenchmarkReport): string {
  const jsonPath = "ingestion-methodology-benchmark-results.json";
  const embeddedReport = serialiseForInlineJson(report);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ingestion Methodology Benchmark</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f7f4;
        --ink: #202124;
        --muted: #62625c;
        --line: #d8d7ce;
        --panel: #ffffff;
        --accent: #0b6f68;
        --accent-2: #7a4b00;
        --bad: #a23b2a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      header {
        padding: 24px clamp(18px, 4vw, 48px) 18px;
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }
      h1 { margin: 0 0 8px; font-size: 28px; font-weight: 650; letter-spacing: 0; }
      h2 { margin: 0 0 12px; font-size: 18px; }
      h3 { margin: 0 0 8px; font-size: 15px; }
      p { margin: 0 0 10px; }
      main { padding: 22px clamp(18px, 4vw, 48px) 48px; }
      .grid { display: grid; gap: 14px; }
      .summary { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); margin-bottom: 22px; }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
      }
      .metric { font-size: 24px; font-weight: 700; color: var(--accent); }
      .muted { color: var(--muted); }
      .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
      button {
        border: 1px solid var(--line);
        background: var(--panel);
        color: var(--ink);
        border-radius: 6px;
        padding: 8px 10px;
        cursor: pointer;
      }
      button.active { border-color: var(--accent); color: var(--accent); font-weight: 650; }
      table {
        width: 100%;
        border-collapse: collapse;
        background: var(--panel);
        border: 1px solid var(--line);
      }
      th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
      th { font-size: 12px; color: var(--muted); background: #fbfbf8; }
      tr:last-child td { border-bottom: 0; }
      .pill {
        display: inline-block;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 12px;
        background: #e8f2ef;
        color: var(--accent);
        white-space: nowrap;
      }
      .pill.error { background: #f8e8e3; color: var(--bad); }
      .pill.skipped { background: #eee9df; color: var(--accent-2); }
      details { margin-top: 8px; }
      pre {
        overflow: auto;
        background: #1f2328;
        color: #f5f7fa;
        border-radius: 6px;
        padding: 12px;
        max-height: 320px;
        white-space: pre-wrap;
      }
      .method-list { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
      .hidden { display: none; }
      @media (max-width: 760px) {
        table, thead, tbody, th, td, tr { display: block; }
        thead { display: none; }
        td { border-bottom: 0; padding: 6px 10px; }
        tr { border-bottom: 1px solid var(--line); padding: 8px 0; }
        td::before { content: attr(data-label); display: block; color: var(--muted); font-size: 12px; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Ingestion Methodology Benchmark</h1>
      <p class="muted">A review surface for deterministic and LLM-assisted exam ingestion experiments.</p>
    </header>
    <main id="app">Loading benchmark results...</main>
    <script type="application/json" id="benchmark-data">${embeddedReport}</script>
    <script>
      const app = document.getElementById("app");
      const embeddedData = document.getElementById("benchmark-data");

      try {
        render(JSON.parse(embeddedData.textContent));
        if (location.protocol !== "file:") {
          fetch("${jsonPath}").then((response) => response.json()).then(render).catch(() => {});
        }
      } catch (error) {
        app.textContent = "Could not load embedded benchmark results: " + error.message;
      }

      function render(data) {
        const ok = data.trials.filter((trial) => trial.status === "ok").length;
        const errors = data.trials.filter((trial) => trial.status === "error").length;
        const totalCost = data.trials.reduce((sum, trial) => sum + (trial.estimatedCostUsd || 0), 0);
        const methods = [...new Set(data.trials.map((trial) => trial.method))];
        app.innerHTML = \`
          <section class="grid summary">
            <div class="card"><div class="metric">\${ok}/\${data.trials.length}</div><div class="muted">successful trials</div></div>
            <div class="card"><div class="metric">\${errors}</div><div class="muted">failed trials</div></div>
            <div class="card"><div class="metric">$\${totalCost.toFixed(4)}</div><div class="muted">estimated OpenRouter cost</div></div>
            <div class="card"><div class="metric">\${data.baseline.papers.map((paper) => paper.questionCount).reduce((a,b)=>a+b,0)}</div><div class="muted">baseline questions compared</div></div>
          </section>
          <section class="card">
            <h2>Conclusions</h2>
            <ul>\${data.conclusions.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("")}</ul>
          </section>
          <section>
            <div class="tabs">
              <button class="active" data-filter="all">All</button>
              \${methods.map((method) => \`<button data-filter="\${escapeHtml(method)}">\${escapeHtml(method)}</button>\`).join("")}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Model</th>
                  <th>Scope</th>
                  <th>Metrics</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                \${data.trials.map(renderTrial).join("")}
              </tbody>
            </table>
          </section>
          <section style="margin-top:22px">
            <h2>Method Notes</h2>
            <div class="grid method-list">
              \${data.methodologySummaries.map(renderMethod).join("")}
            </div>
          </section>
        \`;
        document.querySelectorAll("button[data-filter]").forEach((button) => {
          button.addEventListener("click", () => {
            document.querySelectorAll("button[data-filter]").forEach((candidate) => candidate.classList.remove("active"));
            button.classList.add("active");
            const filter = button.getAttribute("data-filter");
            document.querySelectorAll("tr[data-method]").forEach((row) => {
              row.classList.toggle("hidden", filter !== "all" && row.getAttribute("data-method") !== filter);
            });
          });
        });
      }

      function renderTrial(trial) {
        const metricText = Object.entries(trial.metrics || {}).map(([key, value]) => \`\${key}: \${value}\`).join("<br>");
        const statusClass = trial.status === "error" ? " error" : trial.status === "skipped" ? " skipped" : "";
        return \`
          <tr data-method="\${escapeHtml(trial.method)}">
            <td data-label="Status"><span class="pill\${statusClass}">\${escapeHtml(trial.status)}</span></td>
            <td data-label="Method">\${escapeHtml(trial.method)}</td>
            <td data-label="Model">\${escapeHtml(trial.model || "local")}</td>
            <td data-label="Scope">\${escapeHtml(trial.inputScope)}<br><span class="muted">\${trial.latencyMs} ms\${trial.estimatedCostUsd ? " · $" + trial.estimatedCostUsd.toFixed(5) : ""}</span></td>
            <td data-label="Metrics">\${metricText}</td>
            <td data-label="Recommendation">\${escapeHtml(trial.recommendation)}
              \${trial.outputPreview ? \`<details><summary>Preview</summary><pre>\${escapeHtml(trial.outputPreview)}</pre></details>\` : ""}
              \${trial.error ? \`<details><summary>Error</summary><pre>\${escapeHtml(trial.error)}</pre></details>\` : ""}
            </td>
          </tr>
        \`;
      }

      function renderMethod(method) {
        return \`
          <article class="card">
            <h3>\${escapeHtml(method.title)}</h3>
            <p>\${escapeHtml(method.description)}</p>
            <p><span class="pill">automation: \${escapeHtml(method.automationPotential)}</span></p>
            <p class="muted">\${escapeHtml(method.recommendation)}</p>
          </article>
        \`;
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
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

function serialiseForInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
