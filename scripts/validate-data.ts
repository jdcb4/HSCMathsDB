import { database } from "../src/services/hscDatabase";
import { getDatasetSummary } from "../src/domain/hscSelectors";

const summary = getDatasetSummary(database);

console.log(
  [
    `Validated ${summary.questionCount} questions`,
    `${summary.syllabusNodeCount} syllabus nodes`,
    `${summary.paperCount} papers`,
    `${summary.sourcePackCount} source packs`
  ].join(", ")
);
