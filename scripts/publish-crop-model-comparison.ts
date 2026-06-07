import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type CropQaStatus = "ok" | "too-tight" | "too-loose" | "wrong-content" | "unclear";

type VariantPreview = {
  label: string;
  outputId: string;
  questions: Array<{ flags?: string[] }>;
  report: {
    generatedAt?: string;
    cropQa?: {
      model?: string;
      candidates?: CropCandidate[];
      sheets?: Array<{ results?: CropQaResult[] }>;
      flaggedCropIds?: string[];
    };
    totals?: {
      cropCandidates?: number;
      flaggedCrops?: number;
      flaggedQuestions?: number;
      questionsWithPrompt?: number;
      questionsWithAnswer?: number;
    };
  };
};

type CropCandidate = {
  id: string;
  questionNumber: number;
  page: number;
  kind: string;
  description: string;
  cropUrl?: string;
};

type CropQaResult = {
  cropId: string;
  status: CropQaStatus;
  issues: string[];
  recommendedAction: string;
  confidence?: number;
};

type ComparisonCrop = {
  id: string;
  questionNumber: number;
  page: number;
  kind: string;
  description: string;
};

const args = parseArgs(process.argv.slice(2));
const outputRoot = path.join("public", "ingestion-reports");
const variants = await Promise.all(args.variants.map(readVariantPreview));
const crops = buildCropRows(variants);
const outputPath = path.join(outputRoot, `${args.comparisonId}.html`);

await writeFile(outputPath, buildHtml(args.comparisonId, variants, crops), "utf8");
console.log(`Published ${normalisePath(outputPath)}`);

function parseArgs(values: string[]): {
  comparisonId: string;
  variants: Array<{ label: string; outputId: string }>;
} {
  const comparisonId = values[0];
  const variantArgs = values.slice(1);
  if (!comparisonId || variantArgs.length === 0) {
    throw new Error(
      "Usage: pnpm exec tsx scripts/publish-crop-model-comparison.ts <comparisonId> <label=outputId>..."
    );
  }

  return {
    comparisonId,
    variants: variantArgs.map((value) => {
      const separatorIndex = value.indexOf("=");
      if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
        throw new Error(`Invalid variant "${value}". Use label=outputId.`);
      }
      return {
        label: value.slice(0, separatorIndex),
        outputId: value.slice(separatorIndex + 1)
      };
    })
  };
}

async function readVariantPreview(variant: { label: string; outputId: string }): Promise<VariantPreview> {
  const previewPath = path.join(outputRoot, `${variant.outputId}-question-preview.html`);
  const html = await readFile(previewPath, "utf8");
  const match = html.match(/<script type="application\/json" id="draft-preview-data">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`Could not find draft-preview-data in ${normalisePath(previewPath)}`);
  }
  const parsed = JSON.parse(match[1].replace(/\\u003c/g, "<")) as {
    report: VariantPreview["report"];
    questions?: VariantPreview["questions"];
  };
  return { ...variant, report: parsed.report, questions: parsed.questions ?? [] };
}

function buildCropRows(variants: VariantPreview[]): ComparisonCrop[] {
  const cropsById = new Map<string, ComparisonCrop>();
  for (const variant of variants) {
    for (const crop of variant.report.cropQa?.candidates ?? []) {
      if (!cropsById.has(crop.id)) {
        cropsById.set(crop.id, {
          id: crop.id,
          questionNumber: crop.questionNumber,
          page: crop.page,
          kind: crop.kind,
          description: crop.description
        });
      }
    }
  }
  return [...cropsById.values()].sort(
    (left, right) =>
      left.questionNumber - right.questionNumber || left.page - right.page || left.id.localeCompare(right.id)
  );
}

function buildHtml(comparisonId: string, variants: VariantPreview[], crops: ComparisonCrop[]): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Crop Model Comparison</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #f7f7f4;
        --surface: #ffffff;
        --sunken: #f1f2ee;
        --border: #d8d7ce;
        --subtle: #696b64;
        --text: #202124;
        --accent: #0b6f68;
        --bad: #a23b2a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--canvas);
        color: var(--text);
        font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      header {
        position: sticky;
        top: 0;
        z-index: 5;
        border-bottom: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.96);
        padding: 18px clamp(16px, 3vw, 36px);
      }
      main { padding: 18px clamp(16px, 3vw, 36px) 36px; }
      h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
      h2 { margin: 0; font-size: 16px; letter-spacing: 0; }
      p { margin: 0 0 8px; }
      a { color: var(--accent); }
      .muted { color: var(--subtle); }
      .summary {
        display: grid;
        grid-template-columns: repeat(${variants.length}, minmax(220px, 1fr));
        gap: 10px;
        overflow-x: auto;
      }
      .model-card, .crop-row {
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
      }
      .model-card { padding: 10px; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
      .metric { border: 1px solid var(--border); border-radius: 6px; background: var(--sunken); padding: 6px; }
      .metric strong { display: block; color: var(--accent); font-size: 16px; }
      .crop-list { display: grid; gap: 14px; }
      .crop-row { overflow: hidden; }
      .crop-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--border);
        background: var(--sunken);
        padding: 10px 12px;
      }
      .variant-grid {
        display: grid;
        grid-template-columns: repeat(${variants.length}, minmax(260px, 1fr));
        gap: 0;
        overflow-x: auto;
      }
      .variant-cell {
        min-width: 260px;
        border-right: 1px solid var(--border);
        padding: 10px;
      }
      .variant-cell:last-child { border-right: 0; }
      .label-line { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
      .pill {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        background: #e8f2ef;
        color: var(--accent);
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 700;
      }
      .pill.bad { background: #f8e8e3; color: var(--bad); }
      img {
        width: 100%;
        height: auto;
        max-height: 420px;
        object-fit: contain;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: white;
      }
      ul { margin: 8px 0 0; padding-left: 18px; }
      @media (max-width: 900px) {
        .summary, .variant-grid { grid-template-columns: 1fr; }
        .variant-cell { border-right: 0; border-bottom: 1px solid var(--border); }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Crop Model Comparison</h1>
      <p class="muted">${escapeHtml(comparisonId)}. Text extraction is held on Gemini 3.1 Flash Lite; crop QA and crop repair vary by model.</p>
      <div class="summary">${variants.map(renderModelCard).join("")}</div>
    </header>
    <main>
      <section class="crop-list">
        ${crops.map((crop) => renderCropRow(crop, variants)).join("")}
      </section>
    </main>
  </body>
</html>`;
}

function renderModelCard(variant: VariantPreview): string {
  const totals = variant.report.totals ?? {};
  const textFlags = countActiveQuestionFlags(variant);
  return `<article class="model-card">
    <h2>${escapeHtml(variant.label)}</h2>
    <p class="muted">${escapeHtml(variant.report.cropQa?.model ?? "unknown model")}</p>
    <p><a href="${escapeHtml(variant.outputId)}-question-preview.html">Question preview</a> - <a href="${escapeHtml(variant.outputId)}.html">Diagnostics</a></p>
    <div class="metrics">
      <div class="metric"><strong>${totals.questionsWithPrompt ?? "-"}</strong><span>prompts</span></div>
      <div class="metric"><strong>${totals.questionsWithAnswer ?? "-"}</strong><span>answers</span></div>
      <div class="metric"><strong>${textFlags}</strong><span>q flags</span></div>
      <div class="metric"><strong>${totals.flaggedCrops ?? "-"}</strong><span>crop flags</span></div>
    </div>
  </article>`;
}

function countActiveQuestionFlags(variant: VariantPreview): number {
  if (variant.questions.length === 0) {
    return variant.report.totals?.flaggedQuestions ?? 0;
  }

  return variant.questions.filter((question) => (question.flags ?? []).some(isActiveQuestionFlag)).length;
}

function isActiveQuestionFlag(flag: string): boolean {
  return (
    !/implied by the text and graph provided.*(?:following|next) page/i.test(flag) &&
    !/this part.*implied by.*text.*graph provided/i.test(flag) &&
    !/prompt for part .*implied by.*context.*graph provided/i.test(flag)
  );
}

function renderCropRow(crop: ComparisonCrop, variants: VariantPreview[]): string {
  return `<article class="crop-row" id="${escapeHtml(crop.id)}">
    <div class="crop-head">
      <div>
        <strong>Q${crop.questionNumber} - ${escapeHtml(crop.id)}</strong>
        <p class="muted">${escapeHtml(crop.kind)} - page ${crop.page} - ${escapeHtml(crop.description)}</p>
      </div>
      <a href="#${escapeHtml(crop.id)}">link</a>
    </div>
    <div class="variant-grid">
      ${variants.map((variant) => renderVariantCrop(crop, variant)).join("")}
    </div>
  </article>`;
}

function renderVariantCrop(crop: ComparisonCrop, variant: VariantPreview): string {
  const candidate = (variant.report.cropQa?.candidates ?? []).find((item) => item.id === crop.id);
  const result = (variant.report.cropQa?.sheets ?? [])
    .flatMap((sheet) => sheet.results ?? [])
    .find((item) => item.cropId === crop.id);
  const status = result?.status ?? "missing";
  const isBad = status !== "ok";

  return `<section class="variant-cell">
    <div class="label-line">
      <strong>${escapeHtml(variant.label)}</strong>
      <span class="pill ${isBad ? "bad" : ""}">${escapeHtml(status)}</span>
    </div>
    ${
      candidate?.cropUrl
        ? `<img src="${escapeHtml(candidate.cropUrl)}" alt="${escapeHtml(candidate.description)}" loading="lazy" />`
        : '<p class="muted">No crop candidate.</p>'
    }
    ${
      result && result.status !== "ok"
        ? `<ul>${result.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul><p class="muted">${escapeHtml(result.recommendedAction)}</p>`
        : ""
    }
  </section>`;
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
