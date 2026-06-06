import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputRoot = path.resolve("var/source-assets");
const outputRoot = path.resolve("var/extracted-text");
const requestedPackIds = new Set(process.argv.slice(2));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

await mkdir(outputRoot, { recursive: true });

const packDirectories = await getPackDirectories();

for (const packDirectory of packDirectories) {
  const outputDirectory = path.join(outputRoot, path.basename(packDirectory));
  await mkdir(outputDirectory, { recursive: true });

  const pdfFiles = (await import("node:fs/promises").then(({ readdir }) => readdir(packDirectory)))
    .filter((file) => file.endsWith(".pdf"))
    .sort();

  for (const pdfFile of pdfFiles) {
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
  }
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

  if (requestedPackIds.size === 0) {
    return directories;
  }

  const selected = directories.filter((directory) => requestedPackIds.has(path.basename(directory)));
  const foundPackIds = new Set(selected.map((directory) => path.basename(directory)));
  const missingPackIds = [...requestedPackIds].filter((packId) => !foundPackIds.has(packId));

  if (missingPackIds.length > 0) {
    throw new Error(`No cached PDFs found for: ${missingPackIds.join(", ")}`);
  }

  return selected;
}

function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}
