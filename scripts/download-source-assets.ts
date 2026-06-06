import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { database } from "../src/services/hscDatabase";
import { discoverSourceAssets, filenameForAsset } from "./source-asset-discovery";

const outputRoot = path.resolve("var/source-assets");
const requestedPackIds = new Set(process.argv.slice(2));
await mkdir(outputRoot, { recursive: true });

const selectedPacks =
  requestedPackIds.size === 0
    ? database.sourcePacks
    : database.sourcePacks.filter((pack) => requestedPackIds.has(pack.id));

if (requestedPackIds.size > 0 && selectedPacks.length !== requestedPackIds.size) {
  const foundPackIds = new Set(selectedPacks.map((pack) => pack.id));
  const missingPackIds = [...requestedPackIds].filter((packId) => !foundPackIds.has(packId));
  throw new Error(`Unknown source pack id(s): ${missingPackIds.join(", ")}`);
}

for (const pack of selectedPacks) {
  const packDirectory = path.join(outputRoot, pack.id);
  await mkdir(packDirectory, { recursive: true });

  const assets = await discoverSourceAssets(pack);

  for (const asset of assets) {
    const response = await fetch(asset.url);

    if (!response.ok) {
      throw new Error(`Could not download ${asset.url}: ${response.status} ${response.statusText}`);
    }

    const outputPath = path.join(packDirectory, filenameForAsset(pack, asset));
    await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
    console.log(`Downloaded ${asset.label} -> ${outputPath}`);
  }
}
