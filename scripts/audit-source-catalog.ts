import { database } from "../src/services/hscDatabase";

const sourceCollectionsToAudit = new Set(["nesa-math-advanced-papers", "nesa-mathematics-archive"]);
const expectedTitles = new Set(database.sourcePacks.map((pack) => normalise(pack.title)));

let missingCount = 0;

for (const collection of database.sourceCollections.filter((item) => sourceCollectionsToAudit.has(item.id))) {
  const response = await fetch(collection.url);

  if (!response.ok) {
    throw new Error(`Could not fetch ${collection.title}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const pagePackTitles = extractPackTitles(html);
  const missing = pagePackTitles.filter((title) => !expectedTitles.has(normalise(title)));
  missingCount += missing.length;

  console.log(`${collection.title}: found ${pagePackTitles.length} pack titles on current page`);

  if (missing.length > 0) {
    console.log(`Missing from source catalog: ${missing.join("; ")}`);
  }
}

if (missingCount > 0) {
  throw new Error(`${missingCount} official pack title(s) are not represented in sourcePacks`);
}

console.log("Source catalog matches the currently visible official pack titles.");

function extractPackTitles(html: string): string[] {
  const plainText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&amp;/g, "&");

  return [
    ...new Set(
      [...plainText.matchAll(/Mathematics(?: Advanced)? \d{4} HSC exam pack(?: \(archive\))?/g)].map(
        ([title]) => title
      )
    )
  ];
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
