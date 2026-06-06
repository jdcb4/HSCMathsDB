import { database } from "../src/services/hscDatabase";
import { discoverSourceAssets } from "./source-asset-discovery";

const requiredRoles = ["exam-paper", "marking-guide", "marking-feedback"] as const;
let issueCount = 0;

for (const pack of database.sourcePacks) {
  const assets = await discoverSourceAssets(pack);
  const foundRoles = new Set(assets.map((asset) => asset.role));
  const missingRoles = requiredRoles.filter((role) => !foundRoles.has(role));

  console.log(`${pack.title}: ${assets.length} PDF assets discovered`);

  if (missingRoles.length > 0) {
    issueCount += missingRoles.length;
    console.log(`Missing roles: ${missingRoles.join(", ")}`);
  }
}

if (issueCount > 0) {
  throw new Error(`${issueCount} required source asset role(s) were missing`);
}

console.log("All source packs expose exam paper, marking guide, and marking feedback PDFs.");
