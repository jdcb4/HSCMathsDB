import { database } from "../src/services/hscDatabase";
import { findLocalSourceExamsForPack } from "./local-source-exams";

const requiredModernRoles = ["exam-paper", "marking-guide", "marking-feedback"] as const;
const sourceRoot = "SourceExams";

let issueCount = 0;

for (const pack of database.sourcePacks) {
  const assets = await findLocalSourceExamsForPack(pack, sourceRoot);
  const roles = new Set(assets.map((asset) => asset.role));
  const requiredRoles = pack.year >= 2015 ? requiredModernRoles : (["exam-paper"] as const);
  const missing = requiredRoles.filter((role) => !roles.has(role));

  if (missing.length > 0) {
    issueCount += 1;
    console.error(`${pack.id}: missing local SourceExams asset(s): ${missing.join(", ")}`);
  }
}

if (issueCount > 0) {
  process.exitCode = 1;
} else {
  console.log("All cataloged source packs have the required local SourceExams assets.");
}
