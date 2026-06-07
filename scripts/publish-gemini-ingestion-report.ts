import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ReportWithAssets = {
  paper?: { id?: string; year?: number; courseName?: string; examPackUrl?: string };
  totals?: {
    flaggedQuestions?: number;
    flaggedCrops?: number;
    questionsWithPrompt?: number;
    questionsWithAnswer?: number;
  };
  questionSummaries?: QuestionSummary[];
  repairs?: { unresolvedQuestionNumbers?: number[] };
  examPageProposals?: ExamPageProposal[];
  markingGuidePageProposals?: MarkingGuidePageProposal[];
  cropQa?: {
    candidates?: CropCandidate[];
    initialSheets?: Array<{ path?: string; imageUrl?: string }>;
    sheets?: Array<{ path?: string; imageUrl?: string; results?: CropQaResult[] }>;
    flaggedCropIds?: string[];
  };
};

type QuestionSummary = {
  questionNumber: number;
  examPages: number[];
  markingGuidePages: number[];
  promptPreview: string;
  answerPreview: string;
  flags: string[];
};

type ExamPageProposal = {
  page: number;
  imagePath?: string;
  imageUrl?: string;
  questions: Array<{
    questionNumber: number | string;
    partLabels?: string[];
    promptLatex: string;
    options?: Array<{ label: string; textLatex: string }>;
    marks?: number;
    hasVisual?: boolean;
    needsAsset?: boolean;
    visualDescription?: string | null;
    notes?: string[];
  }>;
};

type MarkingGuidePageProposal = {
  page: number;
  imagePath?: string;
  imageUrl?: string;
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
  sourcePagePath?: string;
  cropPath?: string;
  cropUrl?: string;
  qa?: CropQaResult;
};

type CropQaResult = {
  cropId: string;
  status: "ok" | "too-tight" | "too-loose" | "wrong-content" | "unclear";
  issues: string[];
  recommendedAction: string;
  confidence?: number;
  rawPath?: string;
};

type DraftQuestionPreview = {
  questionNumber: number;
  questionNumberLabel: string;
  title: string;
  marksLabel: string;
  style: "Multiple choice" | "Short answer";
  promptParts: Array<{
    page: number;
    partLabels: string[];
    promptLatex: string;
    options: Array<{ label: string; textLatex: string }>;
    notes: string[];
  }>;
  assets: CropCandidate[];
  answerParts: Array<{
    page: number;
    partLabel: string;
    marks?: number;
    answerLatex: string;
    sampleAnswerLatex: string;
    markingCriteria: string[];
    notes: string[];
  }>;
  flags: string[];
  sourceRefs: string;
};

const args = parseArgs(process.argv.slice(2));
const sourceRoot = path.join("var", "gemini-ingestion-proposals", args.paperId);
const sourceHtmlPath = path.join(sourceRoot, "report.html");
const outputRoot = path.join("public", "ingestion-reports");
const outputAssetRoot = path.join(outputRoot, `${args.paperId}-assets`);
const outputHtmlPath = path.join(outputRoot, `${args.paperId}.html`);
const outputPreviewPath = path.join(outputRoot, `${args.paperId}-question-preview.html`);

const sourceHtml = await readFile(sourceHtmlPath, "utf8");
const report = extractEmbeddedReport(sourceHtml);
const assetMap = await copyReportAssets(report, outputAssetRoot, `${args.paperId}-assets`);
rewriteAssetUrls(report, assetMap);

const publishedHtml = sourceHtml.replace(
  /(<script type="application\/json" id="proposal-data">)([\s\S]*?)(<\/script>)/,
  (_match, open: string, _embedded: string, close: string) =>
    `${open}${serialiseForInlineJson(report)}${close}`
);

await mkdir(outputRoot, { recursive: true });
await writeFile(outputHtmlPath, publishedHtml, "utf8");
await writeFile(outputPreviewPath, buildQuestionPreviewHtml(report), "utf8");

console.log(`Published ${normalisePath(outputHtmlPath)}`);
console.log(`Published ${normalisePath(outputPreviewPath)}`);
console.log(`Copied ${assetMap.size} asset(s) to ${normalisePath(outputAssetRoot)}`);

function parseArgs(values: string[]): { paperId: string } {
  const paperId = values[0];
  if (!paperId) {
    throw new Error("Usage: pnpm run data:publish-gemini-ingestion-report -- <paperId>");
  }
  return { paperId };
}

function extractEmbeddedReport(html: string): ReportWithAssets {
  const match = html.match(/<script type="application\/json" id="proposal-data">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("Could not find embedded proposal-data JSON in report.html");
  }

  return JSON.parse(match[1].replace(/\\u003c/g, "<")) as ReportWithAssets;
}

async function copyReportAssets(
  report: ReportWithAssets,
  outputAssetRootValue: string,
  publicAssetPrefix: string
): Promise<Map<string, string>> {
  await mkdir(outputAssetRootValue, { recursive: true });

  const paths = uniqueStrings([
    ...(report.examPageProposals ?? []).map((proposal) => proposal.imagePath),
    ...(report.markingGuidePageProposals ?? []).map((proposal) => proposal.imagePath),
    ...(report.cropQa?.candidates ?? []).flatMap((candidate) => [
      candidate.sourcePagePath,
      candidate.cropPath
    ]),
    ...(report.cropQa?.initialSheets ?? []).map((sheet) => sheet.path),
    ...(report.cropQa?.sheets ?? []).map((sheet) => sheet.path)
  ]);
  const assetMap = new Map<string, string>();

  for (const [index, sourcePath] of paths.entries()) {
    const extension = path.extname(sourcePath) || ".png";
    const outputName = `${String(index + 1).padStart(4, "0")}-${safeFileName(
      path.basename(sourcePath, extension)
    )}${extension}`;
    const outputPath = path.join(outputAssetRootValue, outputName);
    await copyFile(path.resolve(sourcePath), outputPath);
    assetMap.set(normalisePath(sourcePath), `${publicAssetPrefix}/${outputName}`);
  }

  return assetMap;
}

function rewriteAssetUrls(report: ReportWithAssets, assetMap: Map<string, string>) {
  for (const proposal of report.examPageProposals ?? []) {
    proposal.imageUrl = urlForPath(proposal.imagePath, assetMap);
  }

  for (const proposal of report.markingGuidePageProposals ?? []) {
    proposal.imageUrl = urlForPath(proposal.imagePath, assetMap);
  }

  for (const candidate of report.cropQa?.candidates ?? []) {
    candidate.cropUrl = urlForPath(candidate.cropPath, assetMap);
  }

  for (const sheet of report.cropQa?.sheets ?? []) {
    sheet.imageUrl = urlForPath(sheet.path, assetMap);
  }

  for (const sheet of report.cropQa?.initialSheets ?? []) {
    sheet.imageUrl = urlForPath(sheet.path, assetMap);
  }
}

function buildQuestionPreviewHtml(report: ReportWithAssets): string {
  const questions = buildDraftQuestions(report);
  const title = `${report.paper?.courseName ?? "HSC Mathematics"} ${report.paper?.year ?? ""} draft preview`;
  const embedded = serialiseForInlineJson({ report, questions });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <script>
      window.MathJax = {
        tex: { inlineMath: [["\\\\(", "\\\\)"]], displayMath: [["\\\\[", "\\\\]"]] },
        svg: { fontCache: "global" }
      };
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
    <style>
      :root {
        color-scheme: light;
        --surface-canvas: #f7f7f4;
        --surface-raised: #ffffff;
        --surface-sunken: #f1f2ee;
        --border-default: #d8d7ce;
        --border-subtle: #e7e6df;
        --border-strong: #9d9b8f;
        --text-primary: #202124;
        --text-secondary: #4f514c;
        --text-subtle: #696b64;
        --accent: #0b6f68;
        --warning: #7a4b00;
        --bad: #a23b2a;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--surface-canvas);
        color: var(--text-primary);
        font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      header {
        border-bottom: 1px solid var(--border-default);
        background: var(--surface-raised);
        padding: 24px clamp(18px, 4vw, 48px) 18px;
      }
      main { padding: 22px clamp(18px, 4vw, 48px) 48px; }
      h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
      h2 { margin: 0; font-size: 22px; letter-spacing: 0; }
      h3 { margin: 0 0 12px; font-size: 16px; letter-spacing: 0; }
      h4 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0; }
      p { margin: 0 0 10px; }
      a { color: var(--accent); }
      .muted { color: var(--text-subtle); }
      .layout { display: grid; grid-template-columns: minmax(0, 280px) minmax(0, 1fr); gap: 18px; align-items: start; }
      .sidebar { position: sticky; top: 12px; display: grid; gap: 10px; }
      .nav-card, .question-card {
        border: 1px solid var(--border-default);
        border-radius: 8px;
        background: var(--surface-raised);
      }
      .nav-card { padding: 12px; }
      .nav-list { display: grid; gap: 6px; max-height: calc(100vh - 180px); overflow: auto; }
      .nav-link {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 7px 9px;
        color: var(--text-secondary);
        text-decoration: none;
      }
      .nav-link:hover { border-color: var(--border-strong); color: var(--text-primary); }
      .question-list { display: grid; gap: 18px; }
      .question-card { padding: 20px; }
      .question-head { display: flex; justify-content: space-between; gap: 18px; align-items: start; margin-bottom: 16px; }
      .meta { display: flex; flex-wrap: wrap; gap: 7px; color: var(--text-subtle); font-size: 12px; font-weight: 600; }
      .pill {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        background: #e8f2ef;
        color: var(--accent);
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 600;
      }
      .pill.warn { background: #eee9df; color: var(--warning); }
      .pill.bad { background: #f8e8e3; color: var(--bad); }
      .panel {
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: var(--surface-sunken);
        padding: 14px;
      }
      .panel + .panel { margin-top: 12px; }
      .prompt-part + .prompt-part { margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 16px; }
      .options { display: grid; gap: 8px; margin-top: 12px; }
      .option {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        background: var(--surface-raised);
        padding: 8px 10px;
      }
      .asset-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-top: 14px; }
      figure {
        margin: 0;
        border: 1px solid var(--border-default);
        border-radius: 8px;
        background: var(--surface-raised);
        padding: 10px;
      }
      img { width: 100%; height: auto; border-radius: 4px; background: white; }
      figcaption { margin-top: 8px; color: var(--text-secondary); font-size: 12px; }
      details {
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: var(--surface-sunken);
        padding: 14px;
      }
      details + details { margin-top: 12px; }
      summary { cursor: pointer; font-weight: 700; }
      .answer-part + .answer-part { margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 14px; }
      ul { margin: 8px 0 0; padding-left: 20px; }
      .math-text { white-space: pre-line; }
      .quality { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
      .metric { border: 1px solid var(--border-default); border-radius: 8px; background: var(--surface-raised); padding: 10px; }
      .metric strong { display: block; color: var(--accent); font-size: 22px; }
      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
        .sidebar { position: static; }
        .quality { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Draft Corpus Preview</h1>
      <p class="muted">${escapeHtml(title)}. This shows how the Gemini proposal would read if promoted as draft question records.</p>
      <div class="quality">
        <div class="metric"><strong>${report.totals?.questionsWithPrompt ?? 0}</strong><span>prompts</span></div>
        <div class="metric"><strong>${report.totals?.questionsWithAnswer ?? 0}</strong><span>answers</span></div>
        <div class="metric"><strong>${report.totals?.flaggedQuestions ?? 0}</strong><span>question flags</span></div>
        <div class="metric"><strong>${report.totals?.flaggedCrops ?? 0}</strong><span>crop flags</span></div>
      </div>
    </header>
    <main>
      <div class="layout">
        <aside class="sidebar">
          <section class="nav-card">
            <h3>Questions</h3>
            <nav class="nav-list">
              ${questions.map(renderQuestionNav).join("")}
            </nav>
          </section>
          <section class="nav-card">
            <h3>Report Links</h3>
            <p><a href="${escapeHtml(report.paper?.id ?? "report")}.html">Diagnostics report</a></p>
          </section>
        </aside>
        <section class="question-list">
          ${questions.map(renderDraftQuestion).join("")}
        </section>
      </div>
    </main>
    <script type="application/json" id="draft-preview-data">${embedded}</script>
  </body>
</html>`;
}

function buildDraftQuestions(report: ReportWithAssets): DraftQuestionPreview[] {
  const questionNumbers = new Set<number>();
  const cropQaById = new Map(
    (report.cropQa?.sheets ?? [])
      .flatMap((sheet) => sheet.results ?? [])
      .map((result) => [result.cropId, result])
  );
  for (const summary of report.questionSummaries ?? []) {
    questionNumbers.add(summary.questionNumber);
  }
  for (const proposal of report.examPageProposals ?? []) {
    for (const question of proposal.questions) {
      const questionNumber = toQuestionNumber(question.questionNumber);
      if (questionNumber !== undefined) {
        questionNumbers.add(questionNumber);
      }
    }
  }

  return [...questionNumbers]
    .sort((left, right) => left - right)
    .map((questionNumber) => {
      const promptParts = (report.examPageProposals ?? [])
        .flatMap((proposal) =>
          proposal.questions
            .filter((question) => toQuestionNumber(question.questionNumber) === questionNumber)
            .map((question) => ({
              page: proposal.page,
              partLabels: question.partLabels ?? [],
              promptLatex: question.promptLatex,
              options: question.options ?? [],
              notes: question.notes ?? []
            }))
        )
        .sort(comparePromptParts);
      const answerParts = (report.markingGuidePageProposals ?? [])
        .flatMap((proposal) =>
          proposal.questions
            .filter((question) => toQuestionNumber(question.questionNumber) === questionNumber)
            .map((question) => ({
              page: proposal.page,
              partLabel: question.partLabel ?? "",
              marks: question.marks,
              answerLatex: question.answerLatex ?? "",
              sampleAnswerLatex: question.sampleAnswerLatex ?? "",
              markingCriteria: question.markingCriteria ?? [],
              notes: question.notes ?? []
            }))
        )
        .sort(compareAnswerParts);
      const summary = (report.questionSummaries ?? []).find((item) => item.questionNumber === questionNumber);
      const assets = (report.cropQa?.candidates ?? [])
        .filter((candidate) => candidate.questionNumber === questionNumber)
        .map((candidate) => ({ ...candidate, qa: cropQaById.get(candidate.id) }));
      const markValues = [
        ...promptParts
          .map(
            (part) =>
              (report.examPageProposals ?? [])
                .flatMap((proposal) => proposal.questions)
                .find(
                  (question) =>
                    toQuestionNumber(question.questionNumber) === questionNumber &&
                    question.promptLatex === part.promptLatex
                )?.marks
          )
          .filter((value): value is number => typeof value === "number"),
        ...answerParts.map((part) => part.marks).filter((value): value is number => typeof value === "number")
      ];
      const uniqueMarks = [...new Set(markValues)];
      const marksLabel =
        uniqueMarks.length === 0
          ? "marks unconfirmed"
          : uniqueMarks.length === 1
            ? `${uniqueMarks[0]} mark${uniqueMarks[0] === 1 ? "" : "s"}`
            : `${uniqueMarks.join(" + ")} marks extracted`;
      const hasOptions = promptParts.some((part) => part.options.length > 0);

      return {
        questionNumber,
        questionNumberLabel: `Q${questionNumber}`,
        title: `${report.paper?.courseName ?? "Mathematics"} ${report.paper?.year ?? ""} Question ${questionNumber}`,
        marksLabel,
        style: hasOptions ? "Multiple choice" : "Short answer",
        promptParts,
        assets,
        answerParts,
        flags: summary?.flags ?? [],
        sourceRefs: `Exam page(s): ${summary?.examPages.join(", ") || "-"}; marking guide page(s): ${
          summary?.markingGuidePages.join(", ") || "-"
        }`
      };
    });
}

function comparePromptParts(
  left: DraftQuestionPreview["promptParts"][number],
  right: DraftQuestionPreview["promptParts"][number]
): number {
  return left.page - right.page || (left.partLabels[0] ?? "").localeCompare(right.partLabels[0] ?? "");
}

function compareAnswerParts(
  left: DraftQuestionPreview["answerParts"][number],
  right: DraftQuestionPreview["answerParts"][number]
): number {
  return left.page - right.page || left.partLabel.localeCompare(right.partLabel);
}

function renderQuestionNav(question: DraftQuestionPreview): string {
  return `<a class="nav-link" href="#q${question.questionNumber}"><span>${escapeHtml(
    question.questionNumberLabel
  )}</span><span>${escapeHtml(question.style)}</span></a>`;
}

function renderDraftQuestion(question: DraftQuestionPreview): string {
  return `<article class="question-card" id="q${question.questionNumber}">
    <div class="question-head">
      <div>
        <div class="meta">
          <span>${escapeHtml(String(question.questionNumberLabel))}</span>
          <span>${escapeHtml(question.marksLabel)}</span>
          <span>${escapeHtml(question.style)}</span>
          <span>draft preview</span>
        </div>
        <h2>${escapeHtml(question.title)}</h2>
      </div>
      ${question.flags.length ? '<span class="pill bad">flags</span>' : '<span class="pill">ready draft</span>'}
    </div>

    <section class="panel">
      <h3>Question</h3>
      ${question.promptParts.map(renderPromptPart).join("")}
      ${question.assets.length ? `<div class="asset-grid">${question.assets.map(renderAsset).join("")}</div>` : ""}
    </section>

    <details open>
      <summary>Answer (Official HSC marking guide)</summary>
      <div style="margin-top: 14px">
        ${question.answerParts.length ? question.answerParts.map(renderAnswerPart).join("") : '<p class="muted">No answer extracted.</p>'}
      </div>
    </details>

    <details>
      <summary>Source and Ingestion Notes</summary>
      <div style="margin-top: 14px">
        <p class="muted">${escapeHtml(question.sourceRefs)}</p>
        ${
          question.flags.length
            ? `<p>${question.flags.map((flag) => `<span class="pill bad">${escapeHtml(flag)}</span>`).join(" ")}</p>`
            : '<p><span class="pill">No unresolved ingestion flags</span></p>'
        }
      </div>
    </details>
  </article>`;
}

function renderPromptPart(part: DraftQuestionPreview["promptParts"][number]): string {
  const partLabel = part.partLabels.length ? `Part ${part.partLabels.join(", ")}` : `Page ${part.page}`;
  return `<div class="prompt-part">
    <p class="muted">${escapeHtml(partLabel)} - exam page ${part.page}</p>
    <div class="math-text">${escapeHtml(formatPrompt(part.promptLatex))}</div>
    ${part.options.length ? `<div class="options">${part.options.map(renderOption).join("")}</div>` : ""}
    ${part.notes.length ? `<p>${part.notes.map((note) => `<span class="pill warn">${escapeHtml(note)}</span>`).join(" ")}</p>` : ""}
  </div>`;
}

function renderOption(option: { label: string; textLatex: string }): string {
  return `<div class="option"><strong>${escapeHtml(option.label)}.</strong><span class="math-text">${escapeHtml(
    option.textLatex
  )}</span></div>`;
}

function renderAsset(asset: CropCandidate): string {
  const qa = asset.qa;
  const statusClass = qa?.status && qa.status !== "ok" ? "bad" : "";
  return `<figure>
    <img src="${escapeHtml(asset.cropUrl ?? "")}" alt="${escapeHtml(asset.description)}" loading="lazy" />
    <figcaption>
      <span class="pill ${statusClass}">${escapeHtml(qa?.status ?? "not checked")}</span>
      ${escapeHtml(asset.kind)} - ${escapeHtml(asset.description)} - ${escapeHtml(asset.id)}
      ${
        qa && qa.status !== "ok"
          ? `<ul>${qa.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul><p class="muted">${escapeHtml(qa.recommendedAction)}</p>`
          : ""
      }
    </figcaption>
  </figure>`;
}

function renderAnswerPart(part: DraftQuestionPreview["answerParts"][number]): string {
  const partLabel = part.partLabel ? `Part ${part.partLabel}` : `Guide page ${part.page}`;
  return `<div class="answer-part">
    <p class="muted">${escapeHtml(partLabel)} - guide page ${part.page}${part.marks ? ` - ${part.marks} mark${part.marks === 1 ? "" : "s"}` : ""}</p>
    ${part.answerLatex ? `<h4>Answer</h4><div class="math-text">${escapeHtml(part.answerLatex)}</div>` : ""}
    ${part.sampleAnswerLatex ? `<h4 style="margin-top: 10px">Working / sample answer</h4><div class="math-text">${escapeHtml(part.sampleAnswerLatex)}</div>` : ""}
    ${
      part.markingCriteria.length
        ? `<h4 style="margin-top: 10px">Marking criteria</h4><ul>${part.markingCriteria
            .map((criterion) => `<li class="math-text">${escapeHtml(criterion)}</li>`)
            .join("")}</ul>`
        : ""
    }
  </div>`;
}

function formatPrompt(value: string): string {
  if (!value.includes("Options:")) {
    return value.replace(/\s+\(([a-z])\)\s+/g, "\n\n($1) ");
  }

  return value.replace(/\s+Options:\s+/, "\n\nOptions:\n").replace(/,?\s+([A-D])\.\s+/g, "\n$1. ");
}

function toQuestionNumber(value: number | string | null | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function urlForPath(value: string | undefined, assetMap: Map<string, string>): string {
  if (!value) {
    return "";
  }

  const mapped = assetMap.get(normalisePath(value));
  if (!mapped) {
    throw new Error(`No published asset path for ${value}`);
  }
  return mapped;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)).map(normalisePath))];
}

function safeFileName(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "asset";
}

function serialiseForInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
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
