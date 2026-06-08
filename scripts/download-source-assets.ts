import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { database } from "../src/services/hscDatabase";
import { discoverSourceAssets, filenameForAsset } from "./source-asset-discovery";

const outputRoot = path.resolve("var/source-assets");
const args = parseArgs(process.argv.slice(2));
await mkdir(outputRoot, { recursive: true });

const selectedPacks =
  args.packIds.size === 0
    ? database.sourcePacks
    : database.sourcePacks.filter((pack) => args.packIds.has(pack.id));

if (args.packIds.size > 0 && selectedPacks.length !== args.packIds.size) {
  const foundPackIds = new Set(selectedPacks.map((pack) => pack.id));
  const missingPackIds = [...args.packIds].filter((packId) => !foundPackIds.has(packId));
  throw new Error(`Unknown source pack id(s): ${missingPackIds.join(", ")}`);
}

await mapWithConcurrency(selectedPacks, args.concurrency, async (pack) => {
  const packDirectory = path.join(outputRoot, pack.id);
  await mkdir(packDirectory, { recursive: true });

  const assets = await discoverSourceAssets(pack);

  await mapWithConcurrency(assets, args.concurrency, async (asset) => {
    const response = await fetch(asset.url);

    if (!response.ok) {
      throw new Error(`Could not download ${asset.url}: ${response.status} ${response.statusText}`);
    }

    const outputPath = path.join(packDirectory, filenameForAsset(pack, asset));
    await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
    console.log(`Downloaded ${asset.label} -> ${outputPath}`);
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
