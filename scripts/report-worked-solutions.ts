import { getWorkedSolutionCoverage } from "../src/domain/hscSelectors";
import { database, workedSolutionsDatabase } from "../src/services/hscDatabase";

const coverage = getWorkedSolutionCoverage(database, workedSolutionsDatabase);
const byModel = new Map<string, number>();

workedSolutionsDatabase.workedSolutions.forEach((workedSolution) => {
  byModel.set(workedSolution.model, (byModel.get(workedSolution.model) ?? 0) + 1);
});

console.log(
  [
    `Worked solutions ${coverage.workedSolutionCount}/${coverage.totalQuestions}`,
    `missing=${coverage.missingCount}`,
    `generated=${coverage.generatedCount}`,
    `reviewed=${coverage.reviewedCount}`,
    `needsReview=${coverage.needsReviewCount}`
  ].join(", ")
);

[...byModel.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .forEach(([model, count]) => {
    console.log(`${model}: ${count}`);
  });
