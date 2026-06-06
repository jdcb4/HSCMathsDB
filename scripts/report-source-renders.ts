import { readFile } from "node:fs/promises";
import path from "node:path";

const requestedPackIds = new Set(process.argv.slice(2));
const root = path.resolve("var/rendered-pages");
const { readdir } = await import("node:fs/promises");

let packIds = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (requestedPackIds.size > 0) {
  packIds = packIds.filter((packId) => requestedPackIds.has(packId));
  const foundPackIds = new Set(packIds);
  const missingPackIds = [...requestedPackIds].filter((packId) => !foundPackIds.has(packId));

  if (missingPackIds.length > 0) {
    throw new Error(`No render metadata found for: ${missingPackIds.join(", ")}`);
  }
}

for (const packId of packIds) {
  const metadataPath = path.join(root, packId, "metadata.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf-8")) as {
    packId: string;
    scale: number;
    documents: Array<{ sourcePdf: string; pageCount: number; renderedPages: unknown[] }>;
  };
  const renderedPageCount = metadata.documents.reduce(
    (count, document) => count + document.renderedPages.length,
    0
  );

  console.log(
    `${metadata.packId}: ${renderedPageCount} rendered page(s), ${metadata.documents.length} document(s), scale ${metadata.scale}`
  );
}
