import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { z } from "zod";
import { getOpenRouterApiKey, safeFileName } from "./llm-worked-solution-tools";

type BBox = { x: number; y: number; width: number; height: number };

type TestCase = {
  id: string;
  title: string;
  description: string;
  targetBbox: BBox;
  currentBbox: BBox;
};

type ModelResult = {
  model: string;
  status: "ok" | "error";
  latencyMs: number;
  rawPath: string;
  parsedBbox?: BBox;
  clampedBbox?: BBox;
  cropPath?: string;
  overlayPath?: string;
  iou?: number;
  edgeError?: BBox;
  error?: string;
  reason?: string;
};

const CropRepairSchema = z
  .object({
    cropId: z.string(),
    action: z.enum(["replace-bbox", "keep", "manual-review"]),
    newBbox: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    }),
    reason: z.string().default(""),
    confidence: z.number().optional()
  })
  .passthrough();

const models = [
  "mistralai/mistral-medium-3-5",
  "nvidia/nemotron-3.5-content-safety:free",
  "stepfun/step-3.7-flash"
];

const outputRoot = path.join("var", "crop-coordinate-diagnostics");
const publicRoot = path.join("public", "ingestion-reports", "crop-coordinate-diagnostics");
const pagePath = path.join(outputRoot, "synthetic-coordinate-page.png");
const deterministicCropPath = path.join(outputRoot, "deterministic-target-crop.png");
const deterministicOverlayPath = path.join(outputRoot, "deterministic-overlay.png");
const pageWidth = 893;
const pageHeight = 1263;

const testCases: TestCase[] = [
  {
    id: "labelled-prism",
    title: "Labelled Prism",
    description:
      "A triangular prism diagram with a right-side label and arrow. The target bbox includes all labels and excludes prose.",
    targetBbox: { x: 235, y: 274, width: 428, height: 228 },
    currentBbox: { x: 282, y: 304, width: 304, height: 154 }
  },
  {
    id: "credit-table",
    title: "Credit Table",
    description:
      "A table with headers, borders, and a statement-period caption. The target bbox includes the complete table but excludes prose.",
    targetBbox: { x: 196, y: 642, width: 500, height: 270 },
    currentBbox: { x: 226, y: 696, width: 438, height: 170 }
  }
];

await mkdir(outputRoot, { recursive: true });
await mkdir(publicRoot, { recursive: true });
await createSyntheticPage(pagePath);

const deterministicCheck = await runDeterministicCheck();
const apiKey = getOpenRouterApiKey();
const results: Record<string, ModelResult[]> = {};

for (const testCase of testCases) {
  await writeCropImage(pagePath, testCase.currentBbox, path.join(outputRoot, `${testCase.id}-current.png`));
  results[testCase.id] = [];
  for (const model of models) {
    results[testCase.id].push(await runModelRepair({ apiKey, model, testCase }));
  }
}

await publishAssets(deterministicCheck, results);
await writeFile(
  path.join(outputRoot, "results.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), deterministicCheck, results }, null, 2)}\n`,
  "utf8"
);
await writeFile(
  path.join("public", "ingestion-reports", "crop-coordinate-diagnostics.html"),
  buildHtml(deterministicCheck, results),
  "utf8"
);

console.log("Published public/ingestion-reports/crop-coordinate-diagnostics.html");

async function createSyntheticPage(targetPath: string) {
  const canvas = createCanvas(pageWidth, pageHeight);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageWidth, pageHeight);

  context.fillStyle = "#202124";
  context.font = "22px Arial";
  context.fillText("Synthetic HSC crop-coordinate diagnostic page", 78, 78);
  context.font = "18px Arial";
  context.fillText("Question prose above the diagram. This must not be included in the crop.", 84, 242);
  context.fillText("Question prose between visuals. This must not be included.", 84, 590);
  context.fillText("Question prose below the table. This must not be included.", 84, 980);

  drawPrism(context);
  drawCreditTable(context);
  drawAxisTicks(context);

  await writeFile(targetPath, canvas.toBuffer("image/png"));
}

function drawPrism(context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) {
  context.save();
  context.strokeStyle = "#0b6f68";
  context.lineWidth = 4;
  context.strokeRect(235, 274, 428, 228);
  context.setLineDash([8, 6]);
  context.strokeStyle = "#b42318";
  context.strokeRect(282, 304, 304, 154);
  context.setLineDash([]);

  context.strokeStyle = "#202124";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(280, 442);
  context.lineTo(430, 326);
  context.lineTo(565, 442);
  context.closePath();
  context.stroke();
  context.beginPath();
  context.moveTo(340, 392);
  context.lineTo(490, 276);
  context.lineTo(625, 392);
  context.lineTo(565, 442);
  context.moveTo(430, 326);
  context.lineTo(490, 276);
  context.stroke();

  context.font = "20px Arial";
  context.fillStyle = "#202124";
  context.fillText("Depth of water", 500, 316);
  context.fillText("6 m", 314, 478);
  context.fillText("TARGET bbox: green", 248, 295);
  context.beginPath();
  context.moveTo(500, 326);
  context.lineTo(452, 354);
  context.stroke();
  context.restore();
}

function drawCreditTable(context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) {
  context.save();
  context.strokeStyle = "#0b6f68";
  context.lineWidth = 4;
  context.strokeRect(196, 642, 500, 270);
  context.setLineDash([8, 6]);
  context.strokeStyle = "#b42318";
  context.strokeRect(226, 696, 438, 170);
  context.setLineDash([]);

  context.strokeStyle = "#202124";
  context.lineWidth = 2;
  context.font = "18px Arial";
  context.fillStyle = "#202124";
  context.fillText("Statement period: 1 August to 31 August", 232, 674);
  const left = 226;
  const top = 704;
  const widths = [170, 120, 120];
  const rowHeight = 42;
  const rows = [
    "Date",
    "Transaction",
    "Amount",
    "1 Aug",
    "Opening balance",
    "$1240",
    "8 Aug",
    "Payment",
    "$250"
  ];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = left + widths.slice(0, col).reduce((sum, value) => sum + value, 0);
      context.strokeRect(x, top + row * rowHeight, widths[col], rowHeight);
      context.fillText(rows[row * 3 + col] ?? "", x + 8, top + row * rowHeight + 27);
    }
  }
  context.fillText("Closing balance", 232, 892);
  context.restore();
}

function drawAxisTicks(context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) {
  context.save();
  context.fillStyle = "#777777";
  context.font = "12px Arial";
  for (let x = 0; x <= pageWidth; x += 100) {
    context.fillText(String(x), x + 2, pageHeight - 10);
  }
  for (let y = 100; y <= pageHeight; y += 100) {
    context.fillText(String(y), 8, y);
  }
  context.restore();
}

async function runDeterministicCheck() {
  const bbox = testCases[0].targetBbox;
  await writeCropImage(pagePath, bbox, deterministicCropPath);
  await writeOverlay(pagePath, [{ bbox, color: "#0b6f68", label: "target" }], deterministicOverlayPath);
  const image = await loadImage(await readFile(deterministicCropPath));
  return {
    sourceSize: { width: pageWidth, height: pageHeight },
    bbox,
    cropSize: { width: image.width, height: image.height },
    passed: image.width === bbox.width && image.height === bbox.height,
    cropPath: deterministicCropPath,
    overlayPath: deterministicOverlayPath
  };
}

async function runModelRepair({
  apiKey,
  model,
  testCase
}: {
  apiKey: string;
  model: string;
  testCase: TestCase;
}): Promise<ModelResult> {
  const startedAt = Date.now();
  const rawPath = path.join(outputRoot, `${testCase.id}__${safeFileName(model)}.json`);
  const cropPath = path.join(outputRoot, `${testCase.id}__${safeFileName(model)}__crop.png`);
  const overlayPath = path.join(outputRoot, `${testCase.id}__${safeFileName(model)}__overlay.png`);
  const currentCropPath = path.join(outputRoot, `${testCase.id}-current.png`);

  try {
    const raw = existsSync(rawPath)
      ? JSON.parse(await readFile(rawPath, "utf8"))
      : await callOpenRouterJson({
          apiKey,
          model,
          messages: [
            {
              role: "system",
              content:
                "You repair visual crop bounding boxes on synthetic exam-page images. Return JSON only."
            },
            {
              role: "user",
              content: [
                { type: "text", text: buildRepairPrompt(testCase) },
                { type: "image_url", image_url: { url: await imageDataUrl(pagePath) } },
                { type: "image_url", image_url: { url: await imageDataUrl(currentCropPath) } }
              ]
            }
          ]
        });

    if (!existsSync(rawPath)) {
      await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
    }

    const parsed = CropRepairSchema.parse(parseModelJson(extractContent(raw)));
    if (parsed.action !== "replace-bbox") {
      throw new Error(`Model returned action ${parsed.action}`);
    }

    const clampedBbox = clampBbox(parsed.newBbox, pageWidth, pageHeight);
    await writeCropImage(pagePath, clampedBbox, cropPath);
    await writeOverlay(
      pagePath,
      [
        { bbox: testCase.targetBbox, color: "#0b6f68", label: "expected target" },
        { bbox: testCase.currentBbox, color: "#b42318", label: "bad current" },
        { bbox: clampedBbox, color: "#1f57c3", label: "model result" }
      ],
      overlayPath
    );

    return {
      model,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      rawPath,
      parsedBbox: parsed.newBbox,
      clampedBbox,
      cropPath,
      overlayPath,
      iou: intersectionOverUnion(testCase.targetBbox, clampedBbox),
      edgeError: edgeError(testCase.targetBbox, clampedBbox),
      reason: parsed.reason
    };
  } catch (error: unknown) {
    return {
      model,
      status: "error",
      latencyMs: Date.now() - startedAt,
      rawPath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildRepairPrompt(testCase: TestCase): string {
  return `Repair the proposed crop for this synthetic HSC mathematics visual.

The current red dashed crop is too tight. Return the green target visual bbox in full source-page pixel coordinates.

Page size: ${pageWidth} x ${pageHeight} pixels.
Crop id: ${testCase.id}
Visual description: ${testCase.description}
Current bbox: ${JSON.stringify(testCase.currentBbox)}

Return JSON only:
{
  "cropId": "${testCase.id}",
  "action": "replace-bbox",
  "newBbox": {"x": 0, "y": 0, "width": 100, "height": 100},
  "reason": "why this bbox includes the complete visual",
  "confidence": 0.0
}

Rules:
- Coordinates are pixels in the full source-page image, not percentages and not the small crop image.
- The green rectangle marks the expected full visual region.
- Do not copy the red dashed current bbox if it excludes labels, borders, or captions.
- Include all visual labels and borders, but exclude prose outside the green rectangle.`;
}

async function callOpenRouterJson({
  apiKey,
  model,
  messages
}: {
  apiKey: string;
  model: string;
  messages: Array<{ role: "system"; content: string } | { role: "user"; content: unknown }>;
}) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/jdcb4/HSCMathsDB",
      "X-Title": "GoalCheck HSC crop coordinate diagnostics"
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1500,
      temperature: 0,
      response_format: { type: "json_object" }
    })
  });

  const raw = (await response.json().catch(async () => ({ rawText: await response.text() }))) as unknown;
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(raw)}`);
  }

  return raw;
}

function extractContent(raw: unknown): string {
  const content = (raw as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message
    ?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter returned non-string content.");
  }
  return content;
}

async function imageDataUrl(imagePath: string): Promise<string> {
  const extension = path.extname(imagePath).toLowerCase();
  const mimeType = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  const buffer = await readFile(imagePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function parseModelJson(value: string): unknown {
  const withoutFence = value.replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return JSON.parse(withoutFence.slice(start, end + 1));
}

async function writeCropImage(sourcePagePath: string, bbox: BBox, cropPath: string): Promise<void> {
  const sourceImage = await loadImage(await readFile(sourcePagePath));
  const clamped = clampBbox(bbox, sourceImage.width, sourceImage.height);
  const canvas = createCanvas(clamped.width, clamped.height);
  const context = canvas.getContext("2d");
  context.drawImage(
    sourceImage,
    clamped.x,
    clamped.y,
    clamped.width,
    clamped.height,
    0,
    0,
    clamped.width,
    clamped.height
  );
  await writeFile(cropPath, canvas.toBuffer("image/png"));
}

function clampBbox(bbox: BBox, imageWidth: number, imageHeight: number): BBox {
  const x = clamp(Math.round(bbox.x), 0, imageWidth - 1);
  const y = clamp(Math.round(bbox.y), 0, imageHeight - 1);
  const right = clamp(Math.round(bbox.x + bbox.width), x + 1, imageWidth);
  const bottom = clamp(Math.round(bbox.y + bbox.height), y + 1, imageHeight);
  return { x, y, width: right - x, height: bottom - y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function writeOverlay(
  sourcePagePath: string,
  boxes: Array<{ bbox: BBox; color: string; label: string }>,
  outputPath: string
) {
  const sourceImage = await loadImage(await readFile(sourcePagePath));
  const canvas = createCanvas(sourceImage.width, sourceImage.height);
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, 0, 0);
  context.lineWidth = 5;
  context.font = "20px Arial";
  for (const box of boxes) {
    context.strokeStyle = box.color;
    context.fillStyle = box.color;
    context.strokeRect(box.bbox.x, box.bbox.y, box.bbox.width, box.bbox.height);
    context.fillText(box.label, box.bbox.x + 8, Math.max(24, box.bbox.y - 8));
  }
  await writeFile(outputPath, canvas.toBuffer("image/png"));
}

function intersectionOverUnion(expected: BBox, actual: BBox): number {
  const left = Math.max(expected.x, actual.x);
  const top = Math.max(expected.y, actual.y);
  const right = Math.min(expected.x + expected.width, actual.x + actual.width);
  const bottom = Math.min(expected.y + expected.height, actual.y + actual.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const expectedArea = expected.width * expected.height;
  const actualArea = actual.width * actual.height;
  const union = expectedArea + actualArea - intersection;
  return union <= 0 ? 0 : Number((intersection / union).toFixed(4));
}

function edgeError(expected: BBox, actual: BBox): BBox {
  return {
    x: actual.x - expected.x,
    y: actual.y - expected.y,
    width: actual.width - expected.width,
    height: actual.height - expected.height
  };
}

async function publishAssets(
  deterministicCheck: Awaited<ReturnType<typeof runDeterministicCheck>>,
  results: Record<string, ModelResult[]>
) {
  const paths = [
    pagePath,
    deterministicCheck.cropPath,
    deterministicCheck.overlayPath,
    ...Object.values(results).flatMap((items) =>
      items.flatMap((item) =>
        [item.cropPath, item.overlayPath].filter((value): value is string => Boolean(value))
      )
    )
  ];
  for (const sourcePath of paths) {
    await writeFile(path.join(publicRoot, path.basename(sourcePath)), await readFile(sourcePath));
  }
}

function publicAssetUrl(filePath?: string): string {
  return filePath ? `crop-coordinate-diagnostics/${path.basename(filePath)}` : "";
}

function buildHtml(
  deterministicCheck: Awaited<ReturnType<typeof runDeterministicCheck>>,
  results: Record<string, ModelResult[]>
): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Crop Coordinate Diagnostics</title>
    <style>
      body { margin: 0; background: #f7f7f4; color: #202124; font: 13px/1.45 system-ui, sans-serif; }
      header, main { padding: 20px clamp(16px, 3vw, 36px); }
      header { background: white; border-bottom: 1px solid #d8d7ce; }
      h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
      h2 { margin: 22px 0 10px; font-size: 18px; letter-spacing: 0; }
      h3 { margin: 0 0 6px; font-size: 15px; letter-spacing: 0; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
      .card { background: white; border: 1px solid #d8d7ce; border-radius: 8px; padding: 12px; }
      .pill { display: inline-flex; border-radius: 999px; padding: 2px 8px; background: #e8f2ef; color: #0b6f68; font-weight: 700; }
      .bad { background: #f8e8e3; color: #a23b2a; }
      img { max-width: 100%; border: 1px solid #d8d7ce; background: white; }
      pre { white-space: pre-wrap; background: #1f2328; color: #f5f7fa; padding: 10px; border-radius: 6px; overflow: auto; }
      .muted { color: #696b64; }
    </style>
  </head>
  <body>
    <header>
      <h1>Crop Coordinate Diagnostics</h1>
      <p class="muted">Synthetic page tests for bbox coordinate translation. Green is expected target, red is bad current crop, blue is model result.</p>
      <p><span class="pill ${deterministicCheck.passed ? "" : "bad"}">deterministic crop ${deterministicCheck.passed ? "passed" : "failed"}</span></p>
    </header>
    <main>
      <section class="grid">
        <article class="card">
          <h3>Synthetic Source Page</h3>
          <img src="${publicAssetUrl(pagePath)}" alt="Synthetic source page" />
        </article>
        <article class="card">
          <h3>Deterministic Crop Overlay</h3>
          <p>Expected ${escapeHtml(JSON.stringify(deterministicCheck.bbox))}; produced ${escapeHtml(JSON.stringify(deterministicCheck.cropSize))}</p>
          <img src="${publicAssetUrl(deterministicCheck.overlayPath)}" alt="Deterministic crop overlay" />
        </article>
      </section>
      ${testCases.map((testCase) => renderTestCase(testCase, results[testCase.id] ?? [])).join("")}
    </main>
  </body>
</html>`;
}

function renderTestCase(testCase: TestCase, modelResults: ModelResult[]): string {
  return `<section>
    <h2>${escapeHtml(testCase.title)}</h2>
    <p class="muted">Expected bbox ${escapeHtml(JSON.stringify(testCase.targetBbox))}; bad current bbox ${escapeHtml(JSON.stringify(testCase.currentBbox))}</p>
    <div class="grid">
      ${modelResults.map(renderModelResult).join("")}
    </div>
  </section>`;
}

function renderModelResult(result: ModelResult): string {
  return `<article class="card">
    <h3>${escapeHtml(result.model)}</h3>
    <p><span class="pill ${result.status === "ok" ? "" : "bad"}">${result.status}</span> ${result.iou === undefined ? "" : `IoU ${result.iou}`}</p>
    ${
      result.status === "ok"
        ? `<p>bbox ${escapeHtml(JSON.stringify(result.clampedBbox))}</p><p>edge error ${escapeHtml(JSON.stringify(result.edgeError))}</p><p class="muted">${escapeHtml(result.reason ?? "")}</p><img src="${publicAssetUrl(result.overlayPath)}" alt="Model result overlay" />`
        : `<pre>${escapeHtml(result.error ?? "")}</pre>`
    }
  </article>`;
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
