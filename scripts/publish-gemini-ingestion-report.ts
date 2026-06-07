import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ReportWithAssets = {
  paper?: { id?: string };
  examPageProposals?: Array<{ imagePath?: string; imageUrl?: string }>;
  markingGuidePageProposals?: Array<{ imagePath?: string; imageUrl?: string }>;
  cropQa?: {
    candidates?: Array<{
      sourcePagePath?: string;
      cropPath?: string;
      cropUrl?: string;
    }>;
    initialSheets?: Array<{ path?: string; imageUrl?: string }>;
    sheets?: Array<{ path?: string; imageUrl?: string }>;
  };
};

const args = parseArgs(process.argv.slice(2));
const sourceRoot = path.join("var", "gemini-ingestion-proposals", args.paperId);
const sourceHtmlPath = path.join(sourceRoot, "report.html");
const outputRoot = path.join("public", "ingestion-reports");
const outputAssetRoot = path.join(outputRoot, `${args.paperId}-assets`);
const outputHtmlPath = path.join(outputRoot, `${args.paperId}.html`);

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

console.log(`Published ${normalisePath(outputHtmlPath)}`);
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

function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}
