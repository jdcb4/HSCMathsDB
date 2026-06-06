import databaseJson from "../src/data/hsc-math-advanced.json";
import type { HscDatabase } from "../src/domain/hscSchemas";
import { additionalMathsProfiles } from "./additional-maths-profiles";
import { ingestExamProfiles } from "./exam-ingestion-core";

const requestedProfileIds = new Set(process.argv.slice(2));
const selectedProfiles =
  requestedProfileIds.size === 0
    ? additionalMathsProfiles
    : additionalMathsProfiles.filter((profile) => requestedProfileIds.has(profile.id));

if (requestedProfileIds.size > 0 && selectedProfiles.length !== requestedProfileIds.size) {
  const foundProfileIds = new Set(selectedProfiles.map((profile) => profile.id));
  const missingProfileIds = [...requestedProfileIds].filter((profileId) => !foundProfileIds.has(profileId));
  throw new Error(`Unknown additional maths ingestion profile(s): ${missingProfileIds.join(", ")}`);
}

const importedTotal = await ingestExamProfiles({
  database: databaseJson as HscDatabase,
  profiles: selectedProfiles
});

console.log(`Promoted ${importedTotal} draft question record(s) from ${selectedProfiles.length} profile(s).`);
