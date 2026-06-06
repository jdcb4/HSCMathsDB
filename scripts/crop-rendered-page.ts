import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const args = parseArgs(process.argv.slice(2));
const image = await loadImage(await readFile(args.input));
const canvas = createCanvas(args.width, args.height);
const context = canvas.getContext("2d");

context.drawImage(image, args.x, args.y, args.width, args.height, 0, 0, args.width, args.height);

await mkdir(path.dirname(args.output), { recursive: true });
await writeFile(args.output, canvas.toBuffer("image/png"));

const metadataPath = `${args.output}.json`;
await writeFile(
  metadataPath,
  JSON.stringify(
    {
      input: normalisePath(args.input),
      output: normalisePath(args.output),
      crop: {
        x: args.x,
        y: args.y,
        width: args.width,
        height: args.height
      },
      reviewStatus: args.reviewStatus
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`Cropped ${normalisePath(args.input)} -> ${normalisePath(args.output)}`);

function parseArgs(rawArgs: string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < rawArgs.length; index += 2) {
    values.set(rawArgs[index], rawArgs[index + 1]);
  }

  const input = required(values, "--input");
  const output = required(values, "--output");
  const x = numeric(values, "--x");
  const y = numeric(values, "--y");
  const width = numeric(values, "--width");
  const height = numeric(values, "--height");
  const reviewStatus = values.get("--review-status") ?? "needs-review";

  if (!["needs-review", "reviewed"].includes(reviewStatus)) {
    throw new Error("--review-status must be needs-review or reviewed");
  }

  return { input, output, x, y, width, height, reviewStatus };
}

function required(values: Map<string, string>, name: string): string {
  const value = values.get(name);
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function numeric(values: Map<string, string>, name: string): number {
  const value = Number(required(values, name));
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

function normalisePath(value: string): string {
  return value.replace(/\\/g, "/");
}
