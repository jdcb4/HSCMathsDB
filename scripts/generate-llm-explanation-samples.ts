import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getLinkedSyllabusNodes } from "../src/domain/hscSelectors";
import { database } from "../src/services/hscDatabase";

const promptVersion = "hsc-explanation-v1";
const outputDirectory = path.join("var", "llm-explanation-samples");
const outputPath = path.join(outputDirectory, "samples.json");
const rawDirectory = path.join(outputDirectory, "raw");

const defaultModels = ["minimax/minimax-m2.5:nitro", "google/gemini-3.1-flash-lite", "z-ai/glm-4.7:nitro"];

const sampleQuestionIds = [
  "adv-2025-q14-bivariate-data",
  "adv-2025-q17-reducing-balance-loan",
  "adv-2025-q25-xsinx-area-series",
  "adv-2024-q02-two-way-counting",
  "adv-2024-q20-tower-bearing",
  "adv-2024-q31-annular-sector-perimeter",
  "adv-2023-q08-logarithmic-equation",
  "adv-2023-q23-koala-normal-distribution",
  "adv-2023-q31-conditional-probability-availability",
  "adv-2022-q13-trapezoidal-rule-root-integral",
  "adv-2022-q17-house-of-cards-series",
  "adv-2022-q21-investment-options-future-value"
];

const LlmExplanationResponseSchema = z
  .object({
    needsReview: z.boolean(),
    reviewNote: z.string(),
    summaryLatex: z.string().min(1),
    approachLatex: z.string().min(1),
    steps: z
      .array(
        z
          .object({
            title: z.string().min(1),
            bodyLatex: z.string().min(1)
          })
          .strict()
      )
      .min(2),
    finalAnswerLatex: z.string().min(1),
    commonMistakesLatex: z.array(z.string().min(1)).default([]),
    checkLatex: z.string().min(1).optional()
  })
  .strict();

const RawChatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.record(z.string(), z.unknown())
      })
    )
    .min(1)
});

type LlmExplanationResponse = z.infer<typeof LlmExplanationResponseSchema>;

type QuestionInput = {
  id: string;
  year: number;
  courseName: string;
  questionNumber: string;
  marks: number;
  style: string;
  topic: string;
  subtopic: string;
  syllabus: Array<{
    code: string;
    title: string;
    content: string;
  }>;
  promptLatex: string;
  answerLatex: string;
  workingLatex: string[];
  assets: Array<{
    label: string;
    alt: string;
  }>;
  source: {
    pageRef?: string;
    markingGuideRef?: string;
  };
};

type SampleExplanation =
  | {
      model: string;
      status: "ok";
      generatedAt: string;
      promptVersion: string;
      sourceQuestionHash: string;
      latencyMs: number;
      rawPath: string;
      content: LlmExplanationResponse;
    }
  | {
      model: string;
      status: "error";
      generatedAt: string;
      promptVersion: string;
      sourceQuestionHash: string;
      latencyMs: number;
      rawPath?: string;
      error: string;
    };

type SampleQuestion = {
  question: QuestionInput;
  explanations: SampleExplanation[];
};

type OutputFile = {
  generatedAt: string;
  promptVersion: string;
  models: string[];
  samples: SampleQuestion[];
};

type Args = {
  models: string[];
  force: boolean;
  concurrency: number;
  dryRun: boolean;
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  loadDotEnv();

  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey && !args.dryRun) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env or the current shell environment.");
  }

  const samples = buildSampleQuestions();
  const existingOutput = await readExistingOutput();
  const existingByKey = new Map<string, SampleExplanation>();

  existingOutput?.samples.forEach((sample) => {
    sample.explanations.forEach((explanation) => {
      existingByKey.set(
        `${sample.question.id}:${explanation.model}:${explanation.sourceQuestionHash}`,
        explanation
      );
    });
  });

  await mkdir(rawDirectory, { recursive: true });

  const tasks = samples.flatMap((sample) =>
    args.models.map(() => ({
      sample
    }))
  );

  let taskIndex = 0;
  const completedSamples = new Map<string, SampleQuestion>(
    samples.map((sample) => [sample.question.id, { question: sample.question, explanations: [] }])
  );

  async function worker() {
    while (taskIndex < tasks.length) {
      const currentTaskIndex = taskIndex;
      taskIndex += 1;
      const sample = tasks[currentTaskIndex].sample;
      const model = args.models[currentTaskIndex % args.models.length];
      const sourceQuestionHash = hashQuestionInput(sample.question);
      const existing = existingByKey.get(`${sample.question.id}:${model}:${sourceQuestionHash}`);

      if (existing?.status === "ok" && !args.force) {
        completedSamples.get(sample.question.id)?.explanations.push(existing);
        console.log(`Reused ${sample.question.id} via ${model}`);
        continue;
      }

      const explanation = args.dryRun
        ? createDryRunExplanation(model, sourceQuestionHash)
        : await generateExplanation({
            apiKey: apiKey ?? "",
            model,
            question: sample.question,
            sourceQuestionHash
          });

      completedSamples.get(sample.question.id)?.explanations.push(explanation);
      console.log(
        `${explanation.status === "ok" ? "Generated" : "Failed"} ${sample.question.id} via ${model}`
      );
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));

  const output: OutputFile = {
    generatedAt: new Date().toISOString(),
    promptVersion,
    models: args.models,
    samples: samples.map((sample) => completedSamples.get(sample.question.id) ?? sample)
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  const okCount = output.samples.reduce(
    (count, sample) =>
      count + sample.explanations.filter((explanation) => explanation.status === "ok").length,
    0
  );
  const errorCount = output.samples.reduce(
    (count, sample) =>
      count + sample.explanations.filter((explanation) => explanation.status === "error").length,
    0
  );

  console.log(`Wrote ${outputPath}`);
  console.log(`Successful explanations: ${okCount}`);
  console.log(`Failed explanations: ${errorCount}`);

  args.models.forEach((model) => {
    const generated = output.samples
      .flatMap((sample) => sample.explanations)
      .filter((explanation) => explanation.model === model && explanation.status === "ok");
    const averageMs =
      generated.length > 0
        ? generated.reduce((total, explanation) => total + explanation.latencyMs, 0) / generated.length
        : 0;

    console.log(
      `${model}: ${generated.length} successful, average ${Math.round(averageMs / 100) / 10}s per response`
    );
  });
}

function parseArgs(values: string[]): Args {
  const args: Args = {
    models: defaultModels,
    force: false,
    concurrency: 2,
    dryRun: false
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--force") {
      args.force = true;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--concurrency") {
      args.concurrency = Math.max(1, Number(values[index + 1] ?? "2"));
      index += 1;
    } else if (value === "--model") {
      args.models = [values[index + 1] ?? ""].filter(Boolean);
      index += 1;
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

function buildSampleQuestions(): SampleQuestion[] {
  return sampleQuestionIds.map((questionId) => {
    const question = database.questions.find((candidate) => candidate.id === questionId);

    if (!question) {
      throw new Error(`Sample question ${questionId} was not found in the corpus.`);
    }

    const paper = database.papers.find((candidate) => candidate.id === question.paperId);
    const syllabus = getLinkedSyllabusNodes(database, question).map((node) => ({
      code: node.code,
      title: node.title,
      content: node.content
    }));

    return {
      question: {
        id: question.id,
        year: question.year,
        courseName: paper?.courseName ?? "Mathematics Advanced",
        questionNumber: question.questionNumber,
        marks: question.marks,
        style: question.style,
        topic: question.topic,
        subtopic: question.subtopic,
        syllabus,
        promptLatex: question.promptLatex,
        answerLatex: question.answerLatex,
        workingLatex: question.workingLatex,
        assets: question.assets.map((asset) => ({
          label: asset.label,
          alt: asset.alt
        })),
        source: {
          pageRef: question.source.pageRef,
          markingGuideRef: question.source.markingGuideRef
        }
      },
      explanations: []
    };
  });
}

async function generateExplanation({
  apiKey,
  model,
  question,
  sourceQuestionHash
}: {
  apiKey: string;
  model: string;
  question: QuestionInput;
  sourceQuestionHash: string;
}): Promise<SampleExplanation> {
  const startedAt = Date.now();
  const rawPath = path.join(rawDirectory, `${safeFileName(question.id)}__${safeFileName(model)}.json`);

  try {
    const response = await callOpenRouter({ apiKey, model, question, withJsonMode: true }).catch(
      async (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("response_format") && !message.includes("json")) {
          throw error;
        }
        return callOpenRouter({ apiKey, model, question, withJsonMode: false });
      }
    );

    await writeFile(rawPath, `${JSON.stringify(response.raw, null, 2)}\n`, "utf8");

    const parsedJson = normaliseParsedExplanation(parseModelJson(response.content));
    const content = LlmExplanationResponseSchema.parse(parsedJson);

    return {
      model,
      status: "ok",
      generatedAt: new Date().toISOString(),
      promptVersion,
      sourceQuestionHash,
      latencyMs: Date.now() - startedAt,
      rawPath: rawPath.replaceAll("\\", "/"),
      content
    };
  } catch (error: unknown) {
    return {
      model,
      status: "error",
      generatedAt: new Date().toISOString(),
      promptVersion,
      sourceQuestionHash,
      latencyMs: Date.now() - startedAt,
      rawPath: existsSync(rawPath) ? rawPath.replaceAll("\\", "/") : undefined,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function callOpenRouter({
  apiKey,
  model,
  question,
  withJsonMode
}: {
  apiKey: string;
  model: string;
  question: QuestionInput;
  withJsonMode: boolean;
}): Promise<{ content: string; raw: unknown }> {
  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt()
      },
      {
        role: "user",
        content: `Question input:\n${JSON.stringify(question)}`
      }
    ]
  };

  if (withJsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "GoalCheck HSC explanation sample generator"
    },
    body: JSON.stringify(body)
  });

  const raw = (await response.json().catch(async () => ({ rawText: await response.text() }))) as unknown;

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(raw)}`);
  }

  const message = RawChatCompletionSchema.parse(raw).choices[0].message;
  if (typeof message.content !== "string") {
    throw new Error(
      withJsonMode
        ? `OpenRouter returned null content for ${model} with JSON mode`
        : `OpenRouter returned null content for ${model}`
    );
  }

  return { content: message.content, raw };
}

function buildSystemPrompt(): string {
  return `You are writing a worked explanation for a NSW HSC Mathematics Advanced student aged 17-18.

Your job is to explain how to get from the question to the answer. Be clearer and more helpful than a marking guide, but do not add syllabus content that is not needed for this question.

Audience:
- A capable Year 12 student revising the topic.
- They know the syllabus basics but may not see the key move immediately.

Style rules:
- Use Australian English.
- Be direct and calm.
- Explain the decision points: why this method is appropriate, what to notice first, and how each algebraic/probability/calculus step follows.
- Use TeX for all mathematical notation.
- Keep each step focused. Do not write a textbook chapter.
- Use exactly 4 worked steps unless the question genuinely needs more.
- Keep each step body under 80 words.
- Do not mention the marking guide, NESA, the prompt, JSON, or that you are an AI.
- Do not invent alternative answers.
- If a diagram is referenced, use only the supplied diagram description.
- If the supplied answer appears mathematically wrong or incomplete, set "needsReview" to true and explain the concern in "reviewNote".

Return valid JSON only, matching this shape:
{
  "needsReview": false,
  "reviewNote": "",
  "summaryLatex": "1-2 sentences naming the main idea.",
  "approachLatex": "What to notice first and why the method works.",
  "steps": [
    {
      "title": "Short step title",
      "bodyLatex": "Detailed student-facing explanation with TeX."
    }
  ],
  "finalAnswerLatex": "The final answer, stated cleanly.",
  "commonMistakesLatex": [
    "A likely mistake and how to avoid it."
  ],
  "checkLatex": "Optional quick check or sanity check."
}`;
}

function parseModelJson(value: string): unknown {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const unfenced = fenced?.[1] ?? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const withoutJsonLabel = unfenced.replace(/^json\s*/i, "").trim();
  const withOpeningBrace = addMissingOpeningBrace(withoutJsonLabel);
  const objectText = extractFirstJsonObject(withOpeningBrace);

  try {
    return JSON.parse(objectText);
  } catch {
    return JSON.parse(repairJsonEscapes(objectText));
  }
}

function addMissingOpeningBrace(value: string): string {
  if (value.startsWith("{")) {
    return value;
  }

  if (value.startsWith('"needsReview"')) {
    return `{${value}`;
  }

  if (value.startsWith("needsReview")) {
    return `{"${value}`;
  }

  if (value.startsWith('Review"')) {
    return `{"needsReview"${value.slice("Review".length)}`;
  }

  return value;
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
  return value.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
}

function normaliseParsedExplanation(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = { ...(value as Record<string, unknown>) };

  delete record.type;

  if (!record.commonMistakesLatex && typeof record.commonMistake === "string") {
    record.commonMistakesLatex = [record.commonMistake];
  }

  delete record.commonMistake;

  return record;
}

function hashQuestionInput(question: QuestionInput): string {
  return createHash("sha256").update(JSON.stringify(question)).digest("hex");
}

function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

async function readExistingOutput(): Promise<OutputFile | undefined> {
  if (!existsSync(outputPath)) {
    return undefined;
  }

  return JSON.parse(await readFile(outputPath, "utf8")) as OutputFile;
}

function createDryRunExplanation(model: string, sourceQuestionHash: string): SampleExplanation {
  return {
    model,
    status: "ok",
    generatedAt: new Date().toISOString(),
    promptVersion,
    sourceQuestionHash,
    latencyMs: 0,
    rawPath: "",
    content: {
      needsReview: false,
      reviewNote: "",
      summaryLatex: "This is a dry-run placeholder.",
      approachLatex: "Use the supplied answer and explain each step in order.",
      steps: [
        {
          title: "Identify the method",
          bodyLatex: "Read the question carefully and choose the relevant technique."
        },
        {
          title: "Work through the answer",
          bodyLatex: "Apply the method and simplify the result."
        }
      ],
      finalAnswerLatex: "See the checked answer.",
      commonMistakesLatex: ["Do not skip the reasoning between lines."],
      checkLatex: "Check that the result answers the question asked."
    }
  };
}

function loadDotEnv() {
  const envPath = ".env";

  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}
