import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Question, WorkedSolution } from "../src/domain/hscSchemas";
import { getLinkedSyllabusNodes } from "../src/domain/hscSelectors";
import { database } from "../src/services/hscDatabase";

export const WORKED_SOLUTION_PROMPT_VERSION = "hsc-explanation-v1";

export const PREFERRED_LLM_MODELS = [
  { id: "minimax/minimax-m2.5:nitro", label: "MiniMax M2.5 Nitro", role: "preferred generation model" },
  { id: "z-ai/glm-4.7:nitro", label: "GLM 4.7 Nitro", role: "fast fallback with higher observed cost" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", role: "fast low-cost fallback" }
] as const;

export const LlmWorkedSolutionContentSchema = z
  .object({
    needsReview: z.boolean(),
    reviewNote: z.string(),
    summaryLatex: z.string().min(1),
    approachLatex: z.string().min(1),
    steps: z.array(z.object({ title: z.string().min(1), bodyLatex: z.string().min(1) }).strict()).min(2),
    finalAnswerLatex: z.string().min(1),
    commonMistakesLatex: z.array(z.string().min(1)).default([]),
    checkLatex: z.string().min(1).optional()
  })
  .strict();

const RawChatCompletionSchema = z.object({
  choices: z.array(z.object({ message: z.record(z.string(), z.unknown()) })).min(1)
});

export type LlmWorkedSolutionContent = z.infer<typeof LlmWorkedSolutionContentSchema>;

export type QuestionInput = {
  id: string;
  year: number;
  courseName: string;
  questionNumber: string;
  marks: number;
  style: string;
  topic: string;
  subtopic: string;
  syllabus: Array<{ code: string; title: string; content: string }>;
  promptLatex: string;
  answerLatex: string;
  workingLatex: string[];
  assets: Array<{ label: string; alt: string }>;
  source: { pageRef?: string; markingGuideRef?: string };
};

export function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
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

export function getOpenRouterApiKey(): string {
  loadDotEnv();

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env or the current shell environment.");
  }

  return apiKey;
}

export function buildQuestionInput(question: Question): QuestionInput {
  const paper = database.papers.find((candidate) => candidate.id === question.paperId);
  const syllabus = getLinkedSyllabusNodes(database, question).map((node) => ({
    code: node.code,
    title: node.title,
    content: node.content
  }));

  return {
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
    assets: question.assets.map((asset) => ({ label: asset.label, alt: asset.alt })),
    source: {
      pageRef: question.source.pageRef,
      markingGuideRef: question.source.markingGuideRef
    }
  };
}

export function hashQuestionInput(question: QuestionInput): string {
  return createHash("sha256").update(JSON.stringify(question)).digest("hex");
}

export function buildWorkedSolutionRecord({
  questionId,
  model,
  generatedAt,
  sourceQuestionHash,
  latencyMs,
  content
}: {
  questionId: string;
  model: string;
  generatedAt: string;
  sourceQuestionHash: string;
  latencyMs: number;
  content: LlmWorkedSolutionContent;
}): WorkedSolution {
  return {
    questionId,
    promptVersion: WORKED_SOLUTION_PROMPT_VERSION,
    model,
    generatedAt,
    sourceQuestionHash,
    reviewStatus: content.needsReview ? "needs-review" : "generated",
    needsReview: content.needsReview,
    reviewNote: content.reviewNote,
    latencyMs,
    summaryLatex: content.summaryLatex,
    approachLatex: content.approachLatex,
    steps: content.steps,
    finalAnswerLatex: content.finalAnswerLatex,
    commonMistakesLatex: content.commonMistakesLatex,
    checkLatex: content.checkLatex
  };
}

export async function generateWorkedSolution({
  apiKey,
  model,
  question,
  rawPath
}: {
  apiKey: string;
  model: string;
  question: QuestionInput;
  rawPath: string;
}): Promise<{ content: LlmWorkedSolutionContent; generatedAt: string; latencyMs: number }> {
  const startedAt = Date.now();
  const generatedAt = new Date().toISOString();

  const response = await callOpenRouter({ apiKey, model, question, withJsonMode: true }).catch(
    async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("response_format") && !message.includes("json") && !message.includes("null content")) {
        throw error;
      }

      return callOpenRouter({ apiKey, model, question, withJsonMode: false });
    }
  );

  await writeFile(rawPath, `${JSON.stringify(response.raw, null, 2)}\n`, "utf8");

  const parsedJson = normaliseParsedExplanation(parseModelJson(response.content));
  const content = LlmWorkedSolutionContentSchema.parse(parsedJson);

  return { content, generatedAt, latencyMs: Date.now() - startedAt };
}

export function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

export function sidecarOutputPath() {
  return path.join("src", "data", "hsc-math-advanced-worked-solutions.json");
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
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: `Question input:\n${JSON.stringify(question)}` }
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
      "X-Title": "GoalCheck HSC worked solution generator"
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
    const repaired = repairJsonEscapes(objectText);

    try {
      return JSON.parse(repaired);
    } catch {
      return JSON.parse(removeExtraTerminalArrayBracket(repaired));
    }
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

  if (value.startsWith('"Review"')) {
    return `{"needsReview"${value.slice('"Review"'.length)}`;
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
  return value.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
}

function removeExtraTerminalArrayBracket(value: string): string {
  return value.replace(/\]\s*}\s*$/, "}");
}

function normaliseParsedExplanation(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = { ...(value as Record<string, unknown>) };

  delete record.type;

  if (typeof record.needsReview === "string") {
    record.needsReview = record.needsReview.toLowerCase() === "true";
  }

  if (Array.isArray(record.steps)) {
    record.steps = record.steps.filter((step) => {
      if (!step || typeof step !== "object") {
        return false;
      }

      const candidate = step as { title?: unknown; bodyLatex?: unknown };
      return (
        typeof candidate.title === "string" &&
        candidate.title.trim().length > 0 &&
        typeof candidate.bodyLatex === "string" &&
        candidate.bodyLatex.trim().length > 0
      );
    });
  }

  if (!record.commonMistakesLatex && typeof record.commonMistake === "string") {
    record.commonMistakesLatex = [record.commonMistake];
  }

  if (!record.commonMistakesLatex && typeof record.commonMistakeLatex === "string") {
    record.commonMistakesLatex = [record.commonMistakeLatex];
  }

  delete record.commonMistake;
  delete record.commonMistakeLatex;

  return record;
}
