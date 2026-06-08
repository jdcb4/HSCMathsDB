import { createCanvas, loadImage } from "@napi-rs/canvas";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const diagramsDir = "public/assets/diagrams";
const webpQuality = 85;
const force = process.argv.includes("--force");

let generatedCount = 0;
let skippedCount = 0;
let savedBytes = 0;

for (const fileName of readdirSync(diagramsDir)) {
  if (extname(fileName).toLowerCase() !== ".png") {
    continue;
  }

  const sourcePath = join(diagramsDir, fileName);
  const webpPath = join(diagramsDir, `${basename(fileName, ".png")}.webp`);
  const sourceStat = statSync(sourcePath);

  if (!force && existsSync(webpPath) && statSync(webpPath).mtimeMs >= sourceStat.mtimeMs) {
    skippedCount += 1;
    continue;
  }

  const image = await loadImage(sourcePath);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);

  const webpBuffer = await canvas.encode("webp", webpQuality);
  mkdirSync(diagramsDir, { recursive: true });
  writeFileSync(webpPath, webpBuffer);

  generatedCount += 1;
  savedBytes += Math.max(0, sourceStat.size - webpBuffer.length);
}

console.log(
  `Optimized diagram WebP assets: generated=${generatedCount}, skipped=${skippedCount}, estimated saved bytes=${savedBytes}.`
);
