import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkedSolution, WorkedSolutionsDatabase } from "../src/domain/hscSchemas";
import { WorkedSolutionsDatabaseSchema } from "../src/domain/hscSchemas";
import { database } from "../src/services/hscDatabase";
import {
  buildQuestionInput,
  buildWorkedSolutionRecord,
  generateWorkedSolution,
  getOpenRouterApiKey,
  hashQuestionInput,
  PREFERRED_LLM_MODELS,
  safeFileName,
  sidecarOutputPath,
  WORKED_SOLUTION_PROMPT_VERSION
} from "./llm-worked-solution-tools";

type Args = {
  model: string;
  concurrency: number;
  force: boolean;
  dryRun: boolean;
  limit?: number;
  questionId?: string;
  paperId?: string;
  importSamples: boolean;
  missingOnly: boolean;
};

type GenerationError = {
  questionId: string;
  model: string;
  error: string;
};

const rawDirectory = path.join("var", "llm-worked-solutions", "raw");
const errorPath = path.join("var", "llm-worked-solutions", "errors.json");

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = args.dryRun ? "" : getOpenRouterApiKey();
  const existingSidecar = await readSidecar();
  const solutionsByQuestionId = new Map<string, WorkedSolution>(
    existingSidecar.workedSolutions.map((workedSolution) => [workedSolution.questionId, workedSolution])
  );
  const sampleSolutions = args.importSamples ? await readMatchingSampleSolutions(args.model) : new Map();
  const errors: GenerationError[] = [];

  await mkdir(rawDirectory, { recursive: true });

  let selectedQuestions = database.questions;

  if (args.questionId) {
    selectedQuestions = selectedQuestions.filter((question) => question.id === args.questionId);
  }

  if (args.paperId) {
    selectedQuestions = selectedQuestions.filter((question) => question.paperId === args.paperId);
  }

  if (args.limit !== undefined) {
    selectedQuestions = selectedQuestions.slice(0, args.limit);
  }

  const tasks = selectedQuestions.map((question) => ({
    question,
    questionInput: buildQuestionInput(question)
  }));
  let taskIndex = 0;

  async function worker() {
    while (taskIndex < tasks.length) {
      const currentIndex = taskIndex;
      taskIndex += 1;

      const task = tasks[currentIndex];
      const sourceQuestionHash = hashQuestionInput(task.questionInput);
      const existing = solutionsByQuestionId.get(task.question.id);

      if (args.missingOnly && existing && !args.force) {
        console.log(`Skipped existing ${task.question.id}`);
        continue;
      }

      if (
        existing &&
        !args.force &&
        existing.model === args.model &&
        existing.promptVersion === WORKED_SOLUTION_PROMPT_VERSION &&
        existing.sourceQuestionHash === sourceQuestionHash &&
        (existing.reviewStatus === "generated" || existing.reviewStatus === "reviewed")
      ) {
        console.log(`Reused ${task.question.id}`);
        continue;
      }

      const sample = sampleSolutions.get(`${task.question.id}:${sourceQuestionHash}`);

      if (sample && !args.force) {
        solutionsByQuestionId.set(task.question.id, sample);
        console.log(`Imported sample ${task.question.id}`);
        continue;
      }

      try {
        const rawPath = path.join(
          rawDirectory,
          `${safeFileName(task.question.id)}__${safeFileName(args.model)}.json`
        );
        const result = args.dryRun
          ? createDryRunResult()
          : await generateWorkedSolution({
              apiKey,
              model: args.model,
              question: task.questionInput,
              rawPath
            });

        solutionsByQuestionId.set(
          task.question.id,
          buildWorkedSolutionRecord({
            questionId: task.question.id,
            model: args.model,
            generatedAt: result.generatedAt,
            sourceQuestionHash,
            latencyMs: result.latencyMs,
            content: result.content
          })
        );
        console.log(`Generated ${task.question.id} in ${Math.round(result.latencyMs / 100) / 10}s`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ questionId: task.question.id, model: args.model, error: message });
        console.log(`Failed ${task.question.id}: ${message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  await writeSidecar(solutionsByQuestionId, args.model);
  await writeFile(errorPath, `${JSON.stringify(errors, null, 2)}\n`, "utf8");

  const generatedForModel = [...solutionsByQuestionId.values()].filter(
    (workedSolution) => workedSolution.model === args.model
  );
  const averageMs =
    generatedForModel.length > 0
      ? generatedForModel.reduce((total, workedSolution) => total + workedSolution.latencyMs, 0) /
        generatedForModel.length
      : 0;

  console.log(`Worked solutions: ${solutionsByQuestionId.size}/${database.questions.length}`);
  console.log(
    `${args.model}: ${generatedForModel.length} records, average ${Math.round(averageMs / 100) / 10}s`
  );
  console.log(`Errors: ${errors.length}`);
}

function parseArgs(values: string[]): Args {
  const args: Args = {
    model: PREFERRED_LLM_MODELS[0].id,
    concurrency: 3,
    force: false,
    dryRun: false,
    importSamples: true,
    missingOnly: false
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--model") {
      args.model = values[index + 1] ?? args.model;
      index += 1;
    } else if (value === "--concurrency") {
      args.concurrency = Math.max(1, Number(values[index + 1] ?? "3"));
      index += 1;
    } else if (value === "--limit") {
      args.limit = Math.max(0, Number(values[index + 1] ?? "0"));
      index += 1;
    } else if (value === "--question") {
      args.questionId = values[index + 1];
      index += 1;
    } else if (value === "--paper") {
      args.paperId = values[index + 1];
      index += 1;
    } else if (value === "--force") {
      args.force = true;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--no-import-samples") {
      args.importSamples = false;
    } else if (value === "--missing-only") {
      args.missingOnly = true;
    }
  }

  return args;
}

async function readSidecar(): Promise<WorkedSolutionsDatabase> {
  const outputPath = sidecarOutputPath();

  if (!existsSync(outputPath)) {
    return createEmptySidecar(PREFERRED_LLM_MODELS[0].id);
  }

  return WorkedSolutionsDatabaseSchema.parse(JSON.parse(await readFile(outputPath, "utf8")));
}

async function writeSidecar(solutionsByQuestionId: Map<string, WorkedSolution>, model: string) {
  const data: WorkedSolutionsDatabase = {
    meta: {
      version: "0.2.0",
      generatedAt: new Date().toISOString(),
      defaultModel: model,
      promptVersion: WORKED_SOLUTION_PROMPT_VERSION,
      notes:
        "Student-facing worked solutions generated from the validated question corpus. Records retain model, prompt version, source hash, timing, and review status for regeneration and QA."
    },
    workedSolutions: database.questions
      .map((question) => solutionsByQuestionId.get(question.id))
      .filter((workedSolution): workedSolution is WorkedSolution => Boolean(workedSolution))
  };

  await writeFile(sidecarOutputPath(), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createEmptySidecar(model: string): WorkedSolutionsDatabase {
  return {
    meta: {
      version: "0.2.0",
      generatedAt: new Date().toISOString(),
      defaultModel: model,
      promptVersion: WORKED_SOLUTION_PROMPT_VERSION,
      notes:
        "Student-facing worked solutions generated from the validated question corpus. Records retain model, prompt version, source hash, timing, and review status for regeneration and QA."
    },
    workedSolutions: []
  };
}

async function readMatchingSampleSolutions(model: string): Promise<Map<string, WorkedSolution>> {
  const samplePath = path.join("var", "llm-explanation-samples", "samples.json");
  const samples = new Map<string, WorkedSolution>();

  if (!existsSync(samplePath)) {
    return samples;
  }

  const sampleData = JSON.parse(await readFile(samplePath, "utf8")) as {
    samples: Array<{
      question: { id: string };
      explanations: Array<{
        model: string;
        status: "ok" | "error";
        generatedAt: string;
        sourceQuestionHash: string;
        latencyMs: number;
        content?: {
          needsReview?: boolean;
          reviewNote?: string;
          summaryLatex?: string;
          approachLatex?: string;
          steps?: Array<{ title: string; bodyLatex: string }>;
          finalAnswerLatex?: string;
          commonMistakesLatex?: string[];
          checkLatex?: string;
        };
      }>;
    }>;
  };

  sampleData.samples.forEach((sample) => {
    const explanation = sample.explanations.find(
      (candidate) => candidate.model === model && candidate.status === "ok" && candidate.content
    );

    if (!explanation?.content) {
      return;
    }

    samples.set(
      `${sample.question.id}:${explanation.sourceQuestionHash}`,
      buildWorkedSolutionRecord({
        questionId: sample.question.id,
        model,
        generatedAt: explanation.generatedAt,
        sourceQuestionHash: explanation.sourceQuestionHash,
        latencyMs: explanation.latencyMs,
        content: {
          needsReview: Boolean(explanation.content.needsReview),
          reviewNote: explanation.content.reviewNote ?? "",
          summaryLatex: explanation.content.summaryLatex ?? "",
          approachLatex: explanation.content.approachLatex ?? "",
          steps: explanation.content.steps ?? [],
          finalAnswerLatex: explanation.content.finalAnswerLatex ?? "",
          commonMistakesLatex: explanation.content.commonMistakesLatex ?? [],
          checkLatex: explanation.content.checkLatex
        }
      })
    );
  });

  return samples;
}

function createDryRunResult() {
  return {
    generatedAt: new Date().toISOString(),
    latencyMs: 0,
    content: {
      needsReview: false,
      reviewNote: "",
      summaryLatex: "Dry-run summary.",
      approachLatex: "Dry-run approach.",
      steps: [
        { title: "First step", bodyLatex: "Dry-run first step." },
        { title: "Second step", bodyLatex: "Dry-run second step." }
      ],
      finalAnswerLatex: "Dry-run final answer.",
      commonMistakesLatex: [],
      checkLatex: "Dry-run check."
    }
  };
}
