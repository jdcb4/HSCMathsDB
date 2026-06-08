import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { z } from "zod";
import { getOpenRouterApiKey, safeFileName } from "./llm-worked-solution-tools";

type BBox = { x: number; y: number; width: number; height: number };

type TrialPage = {
  id: string;
  title: string;
  sourcePath: string;
  expected?: Array<{ questionNumber: number; bbox: BBox; label: string }>;
};

type VisualResult = {
  questionNumber: number;
  bbox: BBox;
};

type ModelPageResult = {
  pageId: string;
  model: string;
  status: "ok" | "error";
  latencyMs: number;
  rawPath: string;
  overlayPath?: string;
  visuals: VisualResult[];
  expectedMatches?: Array<{ expectedLabel: string; bestIou: number; bestBbox?: BBox }>;
  error?: string;
};

const VisualPromptResponseSchema = z
  .object({
    visuals: z
      .array(
        z.object({
          questionNumber: z.number().int(),
          bbox: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number()
          })
        })
      )
      .default([])
  })
  .passthrough();

const models = [
  "google/gemini-3.1-flash-lite",
  "mistralai/mistral-medium-3-5",
  "nvidia/nemotron-3.5-content-safety:free",
  "stepfun/step-3.7-flash"
];

const outputRoot = path.join("var", "visual-bbox-prompt-trials");
const publicAssetRoot = path.join("public", "ingestion-reports", "visual-bbox-prompt-trial-assets");
const publicReportPath = path.join("public", "ingestion-reports", "visual-bbox-prompt-trial.html");
const syntheticPagePath = path.join(outputRoot, "mock-visual-page.png");

await mkdir(outputRoot, { recursive: true });
await mkdir(publicAssetRoot, { recursive: true });
await createSyntheticPage(syntheticPagePath);

const pages = await buildTrialPages();
const apiKey = getOpenRouterApiKey();
const results: ModelPageResult[] = [];

for (const page of pages) {
  for (const model of models) {
    results.push(await runModelPageTrial({ apiKey, page, model }));
  }
}

await publishPageAssets(pages, results);
await writeFile(
  path.join(outputRoot, "results.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), prompt: buildPrompt("{{width}}", "{{height}}"), pages, results }, null, 2)}\n`,
  "utf8"
);
await writeFile(publicReportPath, buildHtml(pages, results), "utf8");

console.log(`Published ${normalisePath(publicReportPath)}`);

async function buildTrialPages(): Promise<TrialPage[]> {
  const realRoot = path.join(
    "var",
    "rendered-pages",
    "source-std-2023",
    "source-std-2023-exam-paper-2023-hsc-maths-std-1"
  );

  const pages: TrialPage[] = [
    {
      id: "mock-visual-page",
      title: "Mock Page: Prism and Table",
      sourcePath: syntheticPagePath,
      expected: [
        {
          questionNumber: 4,
          bbox: { x: 235, y: 274, width: 428, height: 228 },
          label: "Prism target"
        },
        {
          questionNumber: 5,
          bbox: { x: 196, y: 642, width: 500, height: 270 },
          label: "Table target"
        }
      ]
    },
    {
      id: "std1-2023-page-003",
      title: "Standard 1 2023 Page 3: Q4 Diagram",
      sourcePath: path.join(realRoot, "page-003.png")
    },
    {
      id: "std1-2023-page-004",
      title: "Standard 1 2023 Page 4: Q5 Credit Table",
      sourcePath: path.join(realRoot, "page-004.png")
    },
    {
      id: "std1-2023-page-005",
      title: "Standard 1 2023 Page 5: Q8 Card Diagram",
      sourcePath: path.join(realRoot, "page-005.png")
    }
  ];

  for (const page of pages) {
    if (!existsSync(page.sourcePath)) {
      throw new Error(`Missing trial page image: ${page.sourcePath}`);
    }
  }

  return pages;
}

async function createSyntheticPage(targetPath: string) {
  const pageWidth = 893;
  const pageHeight = 1263;
  const canvas = createCanvas(pageWidth, pageHeight);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageWidth, pageHeight);

  context.fillStyle = "#202124";
  context.font = "22px Arial";
  context.fillText("Synthetic Mathematics Exam Page", 78, 78);
  context.font = "18px Arial";
  context.fillText("4. A pool prism diagram is shown below.", 84, 242);
  context.fillText("This prose is part of the question, not the visual asset.", 84, 534);
  context.fillText("5. The following credit card table is shown.", 84, 610);
  context.fillText("This line below the table is not part of the visual asset.", 84, 980);

  drawPrism(context);
  drawCreditTable(context);
  await writeFile(targetPath, canvas.toBuffer("image/png"));
}

function drawPrism(context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) {
  context.save();
  context.strokeStyle = "#d8d7ce";
  context.lineWidth = 1;
  context.strokeRect(235, 274, 428, 228);
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
  context.beginPath();
  context.moveTo(500, 326);
  context.lineTo(452, 354);
  context.stroke();
  context.restore();
}

function drawCreditTable(context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) {
  context.save();
  context.strokeStyle = "#d8d7ce";
  context.lineWidth = 1;
  context.strokeRect(196, 642, 500, 270);
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

async function runModelPageTrial({
  apiKey,
  page,
  model
}: {
  apiKey: string;
  page: TrialPage;
  model: string;
}): Promise<ModelPageResult> {
  const startedAt = Date.now();
  const rawPath = path.join(outputRoot, `${safeFileName(page.id)}__${safeFileName(model)}.json`);
  const overlayPath = path.join(outputRoot, `${safeFileName(page.id)}__${safeFileName(model)}__overlay.png`);

  try {
    const image = await loadImage(await readFile(page.sourcePath));
    const raw = existsSync(rawPath)
      ? JSON.parse(await readFile(rawPath, "utf8"))
      : await callOpenRouterJson({
          apiKey,
          model,
          messages: [
            {
              role: "system",
              content:
                "You identify discrete mathematics exam visuals and return strict JSON bounding boxes. Return JSON only."
            },
            {
              role: "user",
              content: [
                { type: "text", text: buildPrompt(image.width, image.height) },
                { type: "image_url", image_url: { url: await imageDataUrl(page.sourcePath) } }
              ]
            }
          ]
        });

    if (!existsSync(rawPath)) {
      await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
    }

    const parsed = VisualPromptResponseSchema.parse(parseModelJson(extractContent(raw)));
    const visuals = parsed.visuals
      .map((visual) => ({
        questionNumber: visual.questionNumber,
        bbox: clampBbox(visual.bbox, image.width, image.height)
      }))
      .filter((visual) => visual.bbox.width >= 4 && visual.bbox.height >= 4);

    await writeOverlay(page.sourcePath, page.expected ?? [], visuals, overlayPath);
    await writeCrops(page, model, visuals);

    return {
      pageId: page.id,
      model,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      rawPath,
      overlayPath,
      visuals,
      expectedMatches: page.expected?.map((expected) => {
        const best = visuals
          .map((visual) => ({ visual, iou: intersectionOverUnion(expected.bbox, visual.bbox) }))
          .sort((left, right) => right.iou - left.iou)[0];
        return {
          expectedLabel: expected.label,
          bestIou: best?.iou ?? 0,
          bestBbox: best?.visual.bbox
        };
      })
    };
  } catch (error: unknown) {
    return {
      pageId: page.id,
      model,
      status: "error",
      latencyMs: Date.now() - startedAt,
      rawPath,
      visuals: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildPrompt(width: number | string, height: number | string): string {
  return `Job:
- The attached file is a page from a Mathematics Exam.
- Your job is to identify discrete images and diagrams from within the page to be cropped out separately.
- For each discrete image you need to identify the boundary box ('bbox') that will allow me to safely and accurately crop it.
- The visuals could be things like tables, graphs, and diagrams, or other images that support a mathematics question.

Page context:
- The full source-page image size is ${width} x ${height} pixels.

Rules:
- The bbox must include the complete required visual as a standalone public-site asset.
- Include all axes, axis labels, tick labels, legends, graph labels, table headers, row/column labels, table borders, diagram endpoints, nodes, edge labels, option labels, scales, and geometry/text labels that are part of the visual.
- Exclude unrelated question prose, answer-writing lines, page headers, footers, page numbers, copyright notices, marks, office-use text, other questions, other diagrams, and excessive blank margins.
- Coordinates must use the full source-page image coordinate system, not the small crop image coordinate system.
- Include any header, footer, or explanatory text that is directly linked to the visual, such as a heading describing the visual.
- Include a small margin around the crop area, without intruding on other elements. I will crop exactly where you say and not add my own margin.

Response format:
- Provide your response strictly in the JSON format below.
- Include one entry for each relevant image on the page.
- questionNumber: Integer representing the question number the visual relates to, identified from the exam paper.
- x: the x coordinate of the top left of the proposed bbox.
- y: the y coordinate of the top left of the proposed bbox.
- width: the width in pixels of the proposed bbox.
- height: the height in pixels of the proposed bbox.

JSON format:
{
  "visuals": [
    {
      "questionNumber": 1,
      "bbox": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ]
}`;
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
      "X-Title": "GoalCheck HSC visual bbox prompt trial"
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
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

function extractContent(raw: unknown): unknown {
  return (raw as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
}

function parseModelJson(value: unknown): unknown {
  if (typeof value === "object" && value !== null) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error("OpenRouter returned non-string content.");
  }

  const withoutFence = value.replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return JSON.parse(withoutFence.slice(start, end + 1));
}

async function imageDataUrl(imagePath: string): Promise<string> {
  const extension = path.extname(imagePath).toLowerCase();
  const mimeType = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  const buffer = await readFile(imagePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
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
  sourcePath: string,
  expected: Array<{ questionNumber: number; bbox: BBox; label: string }>,
  visuals: VisualResult[],
  outputPath: string
) {
  const image = await loadImage(await readFile(sourcePath));
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  context.font = "18px Arial";
  context.lineWidth = 4;

  for (const target of expected) {
    context.strokeStyle = "#0b6f68";
    context.fillStyle = "#0b6f68";
    context.strokeRect(target.bbox.x, target.bbox.y, target.bbox.width, target.bbox.height);
    context.fillText(target.label, target.bbox.x + 8, Math.max(22, target.bbox.y - 8));
  }

  visuals.forEach((visual, index) => {
    context.strokeStyle = "#1f57c3";
    context.fillStyle = "#1f57c3";
    context.strokeRect(visual.bbox.x, visual.bbox.y, visual.bbox.width, visual.bbox.height);
    context.fillText(`model Q${visual.questionNumber} #${index + 1}`, visual.bbox.x + 8, visual.bbox.y + 24);
  });

  await writeFile(outputPath, canvas.toBuffer("image/png"));
}

async function writeCrops(page: TrialPage, model: string, visuals: VisualResult[]) {
  const image = await loadImage(await readFile(page.sourcePath));
  for (let index = 0; index < visuals.length; index += 1) {
    const visual = visuals[index];
    const bbox = clampBbox(visual.bbox, image.width, image.height);
    const canvas = createCanvas(bbox.width, bbox.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width, bbox.height);
    await writeFile(cropPathFor(page.id, model, index), canvas.toBuffer("image/png"));
  }
}

function cropPathFor(pageId: string, model: string, index: number): string {
  return path.join(outputRoot, `${safeFileName(pageId)}__${safeFileName(model)}__crop-${index + 1}.png`);
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

async function publishPageAssets(pages: TrialPage[], results: ModelPageResult[]) {
  const paths = [
    ...pages.map((page) => page.sourcePath),
    ...results.flatMap((result) => [
      result.overlayPath,
      ...result.visuals.map((_visual, index) => cropPathFor(result.pageId, result.model, index))
    ])
  ].filter((value): value is string => typeof value === "string" && existsSync(value));

  for (const sourcePath of paths) {
    await writeFile(path.join(publicAssetRoot, path.basename(sourcePath)), await readFile(sourcePath));
  }
}

function publicUrl(filePath?: string): string {
  return filePath ? `visual-bbox-prompt-trial-assets/${path.basename(filePath)}` : "";
}

function buildHtml(pages: TrialPage[], results: ModelPageResult[]): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Visual Bbox Prompt Trial</title>
    <style>
      body { margin: 0; background: #f7f7f4; color: #202124; font: 13px/1.45 system-ui, sans-serif; }
      header, main { padding: 20px clamp(16px, 3vw, 36px); }
      header { background: white; border-bottom: 1px solid #d8d7ce; position: sticky; top: 0; z-index: 3; }
      h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
      h2 { margin: 24px 0 10px; font-size: 18px; letter-spacing: 0; }
      h3 { margin: 0 0 6px; font-size: 15px; letter-spacing: 0; }
      p { margin: 0 0 8px; }
      .muted { color: #696b64; }
      .grid { display: grid; grid-template-columns: 260px repeat(${models.length}, minmax(260px, 1fr)); gap: 10px; overflow-x: auto; align-items: start; }
      .card { background: white; border: 1px solid #d8d7ce; border-radius: 8px; padding: 10px; }
      .source-card { position: sticky; left: 0; z-index: 2; }
      img { width: 100%; height: auto; max-height: 520px; object-fit: contain; border: 1px solid #d8d7ce; background: white; }
      .pill { display: inline-flex; width: fit-content; border-radius: 999px; padding: 2px 8px; background: #e8f2ef; color: #0b6f68; font-weight: 700; }
      .bad { background: #f8e8e3; color: #a23b2a; }
      pre { max-height: 180px; overflow: auto; white-space: pre-wrap; background: #1f2328; color: #f5f7fa; border-radius: 6px; padding: 10px; }
      .crops { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 6px; }
    </style>
  </head>
  <body>
    <header>
      <h1>Visual Bbox Prompt Trial</h1>
      <p class="muted">User prompt trial on one mock page and three Standard 1 2023 real exam pages. Green boxes are mock targets; blue boxes are model outputs.</p>
    </header>
    <main>
      ${pages
        .map((page) =>
          renderPageSection(
            page,
            results.filter((result) => result.pageId === page.id)
          )
        )
        .join("")}
    </main>
  </body>
</html>`;
}

function renderPageSection(page: TrialPage, pageResults: ModelPageResult[]): string {
  return `<section>
    <h2>${escapeHtml(page.title)}</h2>
    <div class="grid">
      <article class="card source-card">
        <h3>Source Page</h3>
        <img src="${publicUrl(page.sourcePath)}" alt="${escapeHtml(page.title)}" />
      </article>
      ${models
        .map((model) => pageResults.find((result) => result.model === model))
        .map((result) => (result ? renderModelResult(result) : ""))
        .join("")}
    </div>
  </section>`;
}

function renderModelResult(result: ModelPageResult): string {
  return `<article class="card">
    <h3>${escapeHtml(result.model)}</h3>
    <p><span class="pill ${result.status === "ok" ? "" : "bad"}">${result.status}</span> <span class="muted">${result.latencyMs} ms</span></p>
    ${
      result.status === "ok"
        ? `<p>${result.visuals.length} visual(s)</p>${renderExpectedMatches(result)}<img src="${publicUrl(result.overlayPath)}" alt="Overlay for ${escapeHtml(result.model)}" /><div class="crops">${result.visuals.map((_visual, index) => `<img src="${publicUrl(cropPathFor(result.pageId, result.model, index))}" alt="Crop ${index + 1}" />`).join("")}</div><pre>${escapeHtml(JSON.stringify(result.visuals, null, 2))}</pre>`
        : `<pre>${escapeHtml(result.error ?? "Unknown error")}</pre>`
    }
  </article>`;
}

function renderExpectedMatches(result: ModelPageResult): string {
  if (!result.expectedMatches) {
    return "";
  }

  return `<p class="muted">${result.expectedMatches
    .map((match) => `${escapeHtml(match.expectedLabel)} IoU ${match.bestIou}`)
    .join("<br />")}</p>`;
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
