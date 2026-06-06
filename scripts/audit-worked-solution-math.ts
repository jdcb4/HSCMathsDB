import { readFile, writeFile } from "node:fs/promises";
import {
  WorkedSolutionsDatabaseSchema,
  type WorkedSolution,
  type WorkedSolutionsDatabase
} from "../src/domain/hscSchemas";
import {
  auditWorkedSolutionText,
  normalizeWorkedSolutionText,
  type WorkedSolutionMathIssue
} from "./worked-solution-math-format";

const outputPath = "src/data/hsc-math-advanced-worked-solutions.json";
const args = new Set(process.argv.slice(2));
const write = args.has("--write");

const database = WorkedSolutionsDatabaseSchema.parse(JSON.parse(await readFile(outputPath, "utf8")));
const normalized: WorkedSolutionsDatabase = {
  ...database,
  workedSolutions: database.workedSolutions.map(normalizeWorkedSolution)
};

const issues = collectIssues(normalized.workedSolutions);

if (write) {
  await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

const issueCounts = issues.reduce<Record<string, number>>((counts, issue) => {
  counts[issue.issue.code] = (counts[issue.issue.code] ?? 0) + 1;
  return counts;
}, {});

console.log(`Worked solutions audited: ${normalized.workedSolutions.length}`);
console.log(`Issues after normalization: ${issues.length}`);
console.log(JSON.stringify(issueCounts, null, 2));

issues.slice(0, 25).forEach((issue) => {
  console.log(`${issue.questionId} ${issue.path}: ${issue.issue.message}`);
  console.log(`  ${issue.value}`);
});

console.log(write ? "Updated worked-solution sidecar." : "Dry run only. Pass --write to update data.");

function normalizeWorkedSolution(workedSolution: WorkedSolution): WorkedSolution {
  return {
    ...workedSolution,
    summaryLatex: normalizeWorkedSolutionText(workedSolution.summaryLatex),
    approachLatex: normalizeWorkedSolutionText(workedSolution.approachLatex),
    steps: workedSolution.steps.map((step) => ({
      ...step,
      bodyLatex: normalizeWorkedSolutionText(step.bodyLatex)
    })),
    finalAnswerLatex: normalizeWorkedSolutionText(workedSolution.finalAnswerLatex),
    commonMistakesLatex: workedSolution.commonMistakesLatex.map((mistake) =>
      normalizeWorkedSolutionText(mistake)
    ),
    checkLatex: workedSolution.checkLatex
      ? normalizeWorkedSolutionText(workedSolution.checkLatex)
      : workedSolution.checkLatex
  };
}

function collectIssues(workedSolutions: WorkedSolution[]) {
  const issues: Array<{
    questionId: string;
    path: string;
    value: string;
    issue: WorkedSolutionMathIssue;
  }> = [];

  workedSolutions.forEach((workedSolution) => {
    collectTextIssues(workedSolution.questionId, "summaryLatex", workedSolution.summaryLatex, issues);
    collectTextIssues(workedSolution.questionId, "approachLatex", workedSolution.approachLatex, issues);
    collectTextIssues(workedSolution.questionId, "finalAnswerLatex", workedSolution.finalAnswerLatex, issues);

    workedSolution.steps.forEach((step, stepIndex) => {
      collectTextIssues(workedSolution.questionId, `steps.${stepIndex}.bodyLatex`, step.bodyLatex, issues);
    });

    workedSolution.commonMistakesLatex.forEach((mistake, mistakeIndex) => {
      collectTextIssues(workedSolution.questionId, `commonMistakesLatex.${mistakeIndex}`, mistake, issues);
    });

    if (workedSolution.checkLatex) {
      collectTextIssues(workedSolution.questionId, "checkLatex", workedSolution.checkLatex, issues);
    }
  });

  return issues;
}

function collectTextIssues(
  questionId: string,
  path: string,
  value: string,
  issues: Array<{ questionId: string; path: string; value: string; issue: WorkedSolutionMathIssue }>
) {
  auditWorkedSolutionText(value).forEach((issue) => {
    issues.push({ questionId, path, value, issue });
  });
}
