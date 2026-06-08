import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { database } from "../src/services/hscDatabase";
import type { SourcePack } from "../src/domain/hscSchemas";

type RenderedPage = {
  page: number;
  width: number;
  height: number;
  path: string;
};

type RenderedDocument = {
  sourcePdf: string;
  pageCount: number;
  renderedPages: RenderedPage[];
};

type RenderMetadata = {
  packId: string;
  scale: number;
  documents: RenderedDocument[];
};

const args = parseArgs(process.argv.slice(2));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const sourceRoot = path.resolve("var/source-assets");
const outputRoot = path.resolve("var/rendered-pages");

await mkdir(outputRoot, { recursive: true });

const selectedPacks = selectPacks(args.packIds);

for (const pack of selectedPacks) {
  const sourceDirectory = path.join(sourceRoot, pack.id);
  const outputDirectory = path.join(outputRoot, pack.id);
  await mkdir(outputDirectory, { recursive: true });

  const pdfFiles = await getPdfFiles(sourceDirectory, args.includeAllDocuments);
  const metadata: RenderMetadata = {
    packId: pack.id,
    scale: args.scale,
    documents: []
  };

  metadata.documents = await mapWithConcurrency(pdfFiles, args.concurrency, async (pdfPath) => {
    const data = new Uint8Array(await readFile(pdfPath));
    const document = await pdfjs.getDocument({ data, disableWorker: true } as unknown as Record<
      string,
      unknown
    >).promise;
    const documentOutputDirectory = path.join(outputDirectory, path.basename(pdfPath, ".pdf"));
    await mkdir(documentOutputDirectory, { recursive: true });

    const selectedPages = resolvePages(document.numPages, args.pages);
    const renderedDocument: RenderedDocument = {
      sourcePdf: normalisePath(pdfPath),
      pageCount: document.numPages,
      renderedPages: []
    };

    for (const pageNumber of selectedPages) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: args.scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const canvasContext = canvas.getContext("2d");

      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: canvasContext as unknown as CanvasRenderingContext2D,
        viewport
      }).promise;

      const outputPath = path.join(
        documentOutputDirectory,
        `page-${pageNumber.toString().padStart(3, "0")}.png`
      );
      await writeFile(outputPath, canvas.toBuffer("image/png"));
      renderedDocument.renderedPages.push({
        page: pageNumber,
        width: canvas.width,
        height: canvas.height,
        path: normalisePath(outputPath)
      });
    }

    console.log(`${path.basename(pdfPath)}: rendered ${renderedDocument.renderedPages.length} page(s)`);
    return renderedDocument;
  });

  const metadataPath = path.join(outputDirectory, "metadata.json");
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`Wrote render metadata -> ${normalisePath(metadataPath)}`);
}

function parseArgs(rawArgs: string[]) {
  const packIds: string[] = [];
  let pages: string | undefined;
  let includeAllDocuments = false;
  let scale = 1.5;
  let concurrency = 3;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--pages") {
      pages = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--scale") {
      scale = Number(rawArgs[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--concurrency") {
      concurrency = parsePositiveInteger(rawArgs[index + 1], "--concurrency");
      index += 1;
      continue;
    }

    if (arg === "--all-documents") {
      includeAllDocuments = true;
      continue;
    }

    packIds.push(arg);
  }

  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("--scale must be a positive number");
  }

  return { packIds, pages, includeAllDocuments, scale, concurrency };
}

function parsePositiveInteger(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function selectPacks(packIds: string[]): SourcePack[] {
  if (packIds.length === 0) {
    return database.sourcePacks;
  }

  const requestedPackIds = new Set(packIds);
  const selected = database.sourcePacks.filter((pack) => requestedPackIds.has(pack.id));

  if (selected.length !== requestedPackIds.size) {
    const foundPackIds = new Set(selected.map((pack) => pack.id));
    const missingPackIds = [...requestedPackIds].filter((packId) => !foundPackIds.has(packId));
    throw new Error(`Unknown source pack id(s): ${missingPackIds.join(", ")}`);
  }

  return selected;
}

async function getPdfFiles(sourceDirectory: string, includeAllDocuments: boolean): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(sourceDirectory))
    .filter((file) => file.endsWith(".pdf"))
    .filter((file) => includeAllDocuments || file.includes("exam-paper"))
    .map((file) => path.join(sourceDirectory, file))
    .sort();

  if (files.length === 0) {
    throw new Error(`No cached PDF files found in ${normalisePath(sourceDirectory)}`);
  }

  return files;
}

function resolvePages(pageCount: number, pages?: string): number[] {
  if (!pages) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const requested = new Set<number>();
  for (const part of pages.split(",")) {
    const range = part.trim();
    if (!range) {
      continue;
    }

    const [startText, endText] = range.split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : start;

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > pageCount) {
      throw new Error(`Invalid --pages range "${range}" for ${pageCount}-page document`);
    }

    for (let page = start; page <= end; page += 1) {
      requested.add(page);
    }
  }

  return [...requested].sort((left, right) => left - right);
}

function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}

async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<U>
): Promise<U[]> {
  const results = new Array<U>(values.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, values.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(values[currentIndex], currentIndex);
      }
    })
  );

  return results;
}
