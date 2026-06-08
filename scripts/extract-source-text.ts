import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const inputRoot = path.resolve("var/source-assets");
const outputRoot = path.resolve("var/extracted-text");
const args = parseArgs(process.argv.slice(2));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

await mkdir(outputRoot, { recursive: true });

const packDirectories = await getPackDirectories();

await mapWithConcurrency(packDirectories, args.concurrency, async (packDirectory) => {
  const outputDirectory = path.join(outputRoot, path.basename(packDirectory));
  await mkdir(outputDirectory, { recursive: true });

  const pdfFiles = (await readdir(packDirectory)).filter((file) => file.endsWith(".pdf")).sort();

  await mapWithConcurrency(pdfFiles, args.concurrency, async (pdfFile) => {
    const pdfPath = path.join(packDirectory, pdfFile);
    const data = new Uint8Array(await readFile(pdfPath));
    const document = await pdfjs.getDocument({ data, disableWorker: true } as Record<string, unknown>)
      .promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join("\n")
        .trim();

      pages.push(`--- page ${pageNumber} ---\n${text}\n`);
    }

    const outputPath = path.join(outputDirectory, `${path.basename(pdfFile, ".pdf")}.txt`);
    await writeFile(outputPath, pages.join("\n"), "utf-8");
    console.log(`Extracted ${document.numPages} pages -> ${normalisePath(outputPath)}`);
  });
});

function parseArgs(values: string[]) {
  const packIds = new Set<string>();
  let concurrency = 4;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--concurrency") {
      concurrency = parsePositiveInteger(values[index + 1], "--concurrency");
      index += 1;
      continue;
    }

    packIds.add(value);
  }

  return { packIds, concurrency };
}

function parsePositiveInteger(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

async function getPackDirectories(): Promise<string[]> {
  const { access, readdir } = await import("node:fs/promises");

  try {
    await access(inputRoot);
  } catch {
    throw new Error("No cached PDFs found. Run pnpm run data:download-sources first.");
  }

  const directories = (
    await Promise.all(
      (await readdir(inputRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => path.join(inputRoot, entry.name))
    )
  ).sort();

  if (args.packIds.size === 0) {
    return directories;
  }

  const selected = directories.filter((directory) => args.packIds.has(path.basename(directory)));
  const foundPackIds = new Set(selected.map((directory) => path.basename(directory)));
  const missingPackIds = [...args.packIds].filter((packId) => !foundPackIds.has(packId));

  if (missingPackIds.length > 0) {
    throw new Error(`No cached PDFs found for: ${missingPackIds.join(", ")}`);
  }

  return selected;
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
