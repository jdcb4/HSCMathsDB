import { access } from "node:fs/promises";
import path from "node:path";

import { database } from "../src/services/hscDatabase";
import type { Question } from "../src/domain/hscSchemas";

type AuditIssue = {
  severity: "error" | "warning";
  questionId: string;
  field: string;
  message: string;
};

const requestedPaperIds = new Set(process.argv.slice(2));

const selectedQuestions = database.questions.filter((question) => {
  if (question.source.transcriptionStatus === "demo") return false;
  if (requestedPaperIds.size === 0) return true;
  return requestedPaperIds.has(question.paperId);
});

if (requestedPaperIds.size > 0) {
  const foundPaperIds = new Set(selectedQuestions.map((question) => question.paperId));
  const missingPaperIds = [...requestedPaperIds].filter((paperId) => !foundPaperIds.has(paperId));
  if (missingPaperIds.length > 0) {
    throw new Error(`No imported questions found for paper id(s): ${missingPaperIds.join(", ")}`);
  }
}

const issues: AuditIssue[] = [];

for (const question of selectedQuestions) {
  auditQuestion(question, issues);
  await auditAssets(question, issues);
}

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");

for (const issue of issues) {
  console.log(`${issue.severity.toUpperCase()} ${issue.questionId} ${issue.field}: ${issue.message}`);
}

console.log(
  `Audited ${selectedQuestions.length} question(s): ${errors.length} error(s), ${warnings.length} warning(s).`
);

if (errors.length > 0) {
  process.exitCode = 1;
}

function auditQuestion(question: Question, collectedIssues: AuditIssue[]) {
  auditTextField(question, "promptLatex", question.promptLatex, collectedIssues);
  auditTextField(question, "answerLatex", question.answerLatex, collectedIssues);
  question.workingLatex.forEach((working, index) => {
    auditTextField(question, `workingLatex[${index}]`, working, collectedIssues);
  });

  if (question.style === "multiple-choice") {
    auditMultipleChoice(question, collectedIssues);
  }

  auditVisualReferences(question, collectedIssues);
  auditMarkingGuideStructure(question, collectedIssues);
  auditMathNotation(question, collectedIssues);
}

function auditTextField(question: Question, field: string, value: string, collectedIssues: AuditIssue[]) {
  if (/[�Ã]|â[€“€™€¢]/.test(value)) {
    collectedIssues.push({
      severity: "error",
      questionId: question.id,
      field,
      message: "contains mojibake or replacement-character text"
    });
  }

  if (/\s{3,}/.test(value)) {
    collectedIssues.push({
      severity: "warning",
      questionId: question.id,
      field,
      message: "contains long whitespace runs"
    });
  }
}

function auditMultipleChoice(question: Question, collectedIssues: AuditIssue[]) {
  const prompt = question.promptLatex;
  const labels = [...prompt.matchAll(/\b[A-D]\./g)].map((match) => match[0]);

  if (labels.length > 0 && labels.length !== 4) {
    collectedIssues.push({
      severity: "error",
      questionId: question.id,
      field: "promptLatex",
      message: `has ${labels.length} multiple-choice option label(s), expected 4`
    });
  }

  if (/\bA\..+\bB\..+\bC\..+\bD\./s.test(prompt) && !/\bA\.[\s\S]*\n[\s\S]*\bB\./.test(prompt)) {
    collectedIssues.push({
      severity: "error",
      questionId: question.id,
      field: "promptLatex",
      message: "has multiple-choice answers flattened onto one line"
    });
  }

  if (/Section II|Answer each question|Extra writing booklets/i.test(prompt)) {
    collectedIssues.push({
      severity: "error",
      questionId: question.id,
      field: "promptLatex",
      message: "appears to include section instruction text from outside the question"
    });
  }
}

function auditVisualReferences(question: Question, collectedIssues: AuditIssue[]) {
  const text = question.promptLatex.toLowerCase();
  const visualCue =
    /\b(graph|diagram|figure|table|scatterplot|scatter plot|box plot|network|tree diagram)\b/.test(text) ||
    /from the graph|shown below|following graphs|following diagram/.test(text);

  if (visualCue && question.assets.length === 0) {
    collectedIssues.push({
      severity: "error",
      questionId: question.id,
      field: "assets",
      message: "references a visual/table but has no attached asset"
    });
  }
}

function auditMarkingGuideStructure(question: Question, collectedIssues: AuditIssue[]) {
  const answer = question.answerLatex;
  const questionPartCount = [...answer.matchAll(/Question\s+\d{1,2}\s+\([a-ziv]+\)/gi)].length;

  if (questionPartCount >= 2 && !answer.includes("\n")) {
    collectedIssues.push({
      severity: "error",
      questionId: question.id,
      field: "answerLatex",
      message: "has a multipart marking-guide excerpt flattened into one paragraph"
    });
  }

  if (/Mathematics\s+(Standard|Extension|Advanced)\b.*Question\s+\d{1,2}/s.test(answer)) {
    collectedIssues.push({
      severity: "warning",
      questionId: question.id,
      field: "answerLatex",
      message: "includes repeated paper header/footer text inside marking-guide content"
    });
  }
}

function auditMathNotation(question: Question, collectedIssues: AuditIssue[]) {
  const fields = [
    ["promptLatex", question.promptLatex],
    ["answerLatex", question.answerLatex],
    ...question.workingLatex.map((value, index): [string, string] => [`workingLatex[${index}]`, value])
  ] as Array<[string, string]>;

  for (const [field, value] of fields) {
    if (/[A-Za-z0-9)]\s*!\s*[A-Z]/.test(value)) {
      collectedIssues.push({
        severity: "error",
        questionId: question.id,
        field,
        message: "contains extracted membership notation using ! instead of TeX"
      });
    }

    if (/\b(p|q)\b/.test(value) && /(sin|cos|tan|arg|modulus|complex|circle)/i.test(value)) {
      collectedIssues.push({
        severity: "warning",
        questionId: question.id,
        field,
        message: "may contain extracted pi/theta symbols that need TeX review"
      });
    }
  }
}

async function auditAssets(question: Question, collectedIssues: AuditIssue[]) {
  for (const asset of question.assets) {
    const publicPath = path.resolve("public", asset.path.replace(/^\//, ""));
    try {
      await access(publicPath);
    } catch {
      collectedIssues.push({
        severity: "error",
        questionId: question.id,
        field: "assets",
        message: `asset file does not exist: ${asset.path}`
      });
    }
  }
}
