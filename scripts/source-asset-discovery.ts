import type { SourcePack } from "../src/domain/hscSchemas";

export type DiscoveredSourceAsset = {
  role: "exam-paper" | "marking-guide" | "marking-feedback";
  label: string;
  url: string;
};

const baseUrl = "https://www.nsw.gov.au";

export async function discoverSourceAssets(pack: SourcePack): Promise<DiscoveredSourceAsset[]> {
  const response = await fetch(pack.packPageUrl);

  if (!response.ok) {
    throw new Error(`Could not fetch ${pack.title}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return [...html.matchAll(/<a[^>]+href="([^"]+\.pdf[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, href, inner]) => ({
      role: classifyRole(toPlainText(inner)),
      label: toPlainText(inner),
      url: new URL(href.replace(/&amp;/g, "&"), baseUrl).toString()
    }))
    .filter((asset): asset is DiscoveredSourceAsset => asset.role !== undefined);
}

export function filenameForAsset(pack: SourcePack, asset: DiscoveredSourceAsset): string {
  const urlFilename = decodeURIComponent(
    new URL(asset.url).pathname.split("/").at(-1) ?? `${asset.role}.pdf`
  );
  return `${pack.id}-${asset.role}-${urlFilename}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function classifyRole(label: string): DiscoveredSourceAsset["role"] | undefined {
  const normalised = label.toLowerCase();

  if (normalised.includes("marking guidelines")) {
    return "marking-guide";
  }

  if (normalised.includes("marking feedback")) {
    return "marking-feedback";
  }

  if (normalised.includes("exam")) {
    return "exam-paper";
  }

  return undefined;
}

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
