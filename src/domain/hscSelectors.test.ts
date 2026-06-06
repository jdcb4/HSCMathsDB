import { describe, expect, it } from "vitest";
import { database } from "../services/hscDatabase";
import {
  getDatasetSummary,
  getLinkedSyllabusNodes,
  getQuestionsForSyllabusNode,
  getSourcePackCoverage,
  getWorkedSolutionCoverage,
  queryQuestions
} from "./hscSelectors";

describe("HSC selectors", () => {
  it("validates and loads the seed database", () => {
    expect(database.questions.length).toBeGreaterThan(0);
    expect(database.syllabus.length).toBeGreaterThan(0);
  });

  it("filters questions by syllabus node", () => {
    const results = queryQuestions(database, { syllabusNodeId: "ma-s2" });

    expect(results.map((question) => question.id)).toContain("adv-2025-q14-bivariate-data");
  });

  it("supports question to syllabus lookup for promoted official drafts", () => {
    const question = database.questions.find((candidate) => candidate.id === "adv-2025-q14-bivariate-data");

    expect(question).toBeDefined();
    expect(getLinkedSyllabusNodes(database, question!).map((node) => node.code)).toContain("MA-S2");
  });

  it("tracks the promoted 2025 official draft records", () => {
    const promotedDrafts = database.questions.filter(
      (question) => question.paperId === "adv-2025" && question.source.transcriptionStatus === "draft"
    );

    expect(promotedDrafts).toHaveLength(31);
    expect(promotedDrafts.map((question) => question.id).sort()).toEqual([
      "adv-2025-q01-discrete-probability-table",
      "adv-2025-q02-exponential-graph",
      "adv-2025-q03-domain-radical-function",
      "adv-2025-q04-cubic-graph-recognition",
      "adv-2025-q05-integral-radical",
      "adv-2025-q06-function-transformation-graph",
      "adv-2025-q07-relative-frequency-die",
      "adv-2025-q08-normal-temperature",
      "adv-2025-q09-derivative-estimate",
      "adv-2025-q10-stationary-points-composite",
      "adv-2025-q11-quadratic-turning-point",
      "adv-2025-q12-tangent-equation",
      "adv-2025-q13-geometric-sequence",
      "adv-2025-q14-bivariate-data",
      "adv-2025-q15-sound-wave-sine-models",
      "adv-2025-q16-stationary-points-exp-function",
      "adv-2025-q17-reducing-balance-loan",
      "adv-2025-q18-composite-function-range",
      "adv-2025-q19-conditional-probability",
      "adv-2025-q20-annuity-deposit",
      "adv-2025-q21-continuous-random-variable",
      "adv-2025-q22-trig-identity",
      "adv-2025-q23-normal-sheep-weights",
      "adv-2025-q24-tangent-log-parabola",
      "adv-2025-q25-xsinx-area-series",
      "adv-2025-q26-wire-area-optimisation",
      "adv-2025-q27-exponential-area-inequality",
      "adv-2025-q28-circular-segment-arc-length",
      "adv-2025-q29-mountain-height-bearing",
      "adv-2025-q30-translated-parabola",
      "adv-2025-q31-cosine-parameter-solutions"
    ]);
  });

  it("tracks the in-progress 2024 official draft records", () => {
    const promotedDrafts = database.questions.filter(
      (question) => question.paperId === "adv-2024" && question.source.transcriptionStatus === "draft"
    );

    expect(promotedDrafts).toHaveLength(31);
    expect(promotedDrafts.map((question) => question.id).sort()).toEqual([
      "adv-2024-q01-linear-function-equation",
      "adv-2024-q02-two-way-counting",
      "adv-2024-q03-normal-comparison-z-scores",
      "adv-2024-q04-parabola-reflections",
      "adv-2024-q05-chain-rule-antiderivative",
      "adv-2024-q06-domain-rational-square-root",
      "adv-2024-q07-function-transformation",
      "adv-2024-q08-boxplot-histogram-compatibility",
      "adv-2024-q09-conditional-probability-tree",
      "adv-2024-q10-antiderivative-inflection-points",
      "adv-2024-q11-derivative-signs-from-graph",
      "adv-2024-q12-arithmetic-series-sum",
      "adv-2024-q13-population-models",
      "adv-2024-q14-area-between-curves",
      "adv-2024-q15-water-tank-volume-rate",
      "adv-2024-q16-parallel-box-plots",
      "adv-2024-q17-capacitor-voltage-model",
      "adv-2024-q18-goal-attempt-probability",
      "adv-2024-q19-quartic-sketch",
      "adv-2024-q20-tower-bearing",
      "adv-2024-q21-anaconda-scatterplot-observations",
      "adv-2024-q22-concavity-and-trapezoidal-rule",
      "adv-2024-q23-normal-table-percentiles",
      "adv-2024-q24-monthly-savings-annuity",
      "adv-2024-q25-density-function-cdf",
      "adv-2024-q26-annuity-present-value-withdrawals",
      "adv-2024-q27-derivative-and-integral",
      "adv-2024-q28-ferris-wheel-heights",
      "adv-2024-q29-quadratic-tangent-normal",
      "adv-2024-q30-geometric-series-range",
      "adv-2024-q31-annular-sector-perimeter"
    ]);
  });

  it("tracks the in-progress 2023 official draft records", () => {
    const promotedDrafts = database.questions.filter(
      (question) => question.paperId === "adv-2023" && question.source.transcriptionStatus === "draft"
    );

    expect(promotedDrafts).toHaveLength(32);
    expect(promotedDrafts.map((question) => question.id).sort()).toEqual([
      "adv-2023-q01-bees-correlation",
      "adv-2023-q02-die-spinner-probability",
      "adv-2023-q03-domain-rational-radical",
      "adv-2023-q04-polynomial-graph-recognition",
      "adv-2023-q05-odd-function-integral-area",
      "adv-2023-q06-derivative-sign-sketch",
      "adv-2023-q07-chain-rule-composite-value",
      "adv-2023-q08-logarithmic-equation",
      "adv-2023-q09-even-function-product",
      "adv-2023-q10-parabola-horizontal-line-scale",
      "adv-2023-q11-arithmetic-sequence-term",
      "adv-2023-q12-discrete-random-variable-mean-sd",
      "adv-2023-q13-antiderivative-initial-value",
      "adv-2023-q14-tangent-to-cubic-composite",
      "adv-2023-q15-annuity-future-value",
      "adv-2023-q16-rectangle-arc-perimeter",
      "adv-2023-q17-substitution-integral",
      "adv-2023-q18-gas-usage-regression",
      "adv-2023-q19-sketch-and-inequality",
      "adv-2023-q20-shifted-sine-equation",
      "adv-2023-q21-geometric-sequence-ratio",
      "adv-2023-q22-rectangular-prism-angle",
      "adv-2023-q23-koala-normal-distribution",
      "adv-2023-q24-garden-path-minimum-area",
      "adv-2023-q25-monthly-withdrawal-account",
      "adv-2023-q26-swing-motion-model",
      "adv-2023-q27-absolute-value-parameters",
      "adv-2023-q28-parallel-tangent-point",
      "adv-2023-q29-continuous-random-variable-mode-cdf",
      "adv-2023-q30-damped-sine-stationary-points",
      "adv-2023-q31-conditional-probability-availability",
      "adv-2023-q32-exponential-area-and-intersections"
    ]);
  });

  it("tracks the completed 2022 official draft records", () => {
    const promotedDrafts = database.questions.filter(
      (question) => question.paperId === "adv-2022" && question.source.transcriptionStatus === "draft"
    );

    expect(promotedDrafts).toHaveLength(32);
    expect(promotedDrafts.map((question) => question.id).sort()).toEqual([
      "adv-2022-q01-linear-graph-options",
      "adv-2022-q02-mean-median-added-score",
      "adv-2022-q03-tower-angle-expression",
      "adv-2022-q04-quadratic-range",
      "adv-2022-q05-quotient-rule-gradient",
      "adv-2022-q06-reciprocal-square-integral",
      "adv-2022-q07-density-function-mode",
      "adv-2022-q08-even-function-definite-integral",
      "adv-2022-q09-two-game-win-probability",
      "adv-2022-q10-composite-function-graph-options",
      "adv-2022-q11-complaints-pareto-chart",
      "adv-2022-q12-inverse-variation-melting-time",
      "adv-2022-q13-trapezoidal-rule-root-integral",
      "adv-2022-q14-sine-graph-parameters",
      "adv-2022-q15-special-die-conditional-probability",
      "adv-2022-q16-parabola-line-enclosed-area",
      "adv-2022-q17-house-of-cards-series",
      "adv-2022-q18-chain-rule-and-integral",
      "adv-2022-q19-transformed-quadratic-parameters",
      "adv-2022-q20-bacteria-exponential-growth",
      "adv-2022-q21-investment-options-future-value",
      "adv-2022-q22-global-extrema-cubic",
      "adv-2022-q23-tide-depth-trigonometric-model",
      "adv-2022-q24-actors-characters-bivariate-data",
      "adv-2022-q25-sine-derivative-conditions",
      "adv-2022-q26-battery-lifespan-normal-model",
      "adv-2022-q27-exponential-product-curve",
      "adv-2022-q28-circle-hyperbola-area",
      "adv-2022-q29-exponential-rectangle-series",
      "adv-2022-q30-continuous-random-variable-cdf",
      "adv-2022-q31-minimum-triangle-area",
      "adv-2022-q32-reducing-balance-loan-repayments"
    ]);
  });

  it("supports multi-node syllabus lookup for cross-topic draft questions", () => {
    const logarithmResults = queryQuestions(database, { syllabusNodeId: "ma-e1" });

    expect(logarithmResults.map((question) => question.id)).toEqual(
      expect.arrayContaining([
        "adv-2025-q17-reducing-balance-loan",
        "adv-2025-q21-continuous-random-variable"
      ])
    );
  });

  it("supports reverse lookup from syllabus to questions", () => {
    const results = getQuestionsForSyllabusNode(database, "ma-f1");

    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("summarises link counts from question mappings", () => {
    const summary = getDatasetSummary(database);

    expect(summary.linkCount).toBeGreaterThan(database.questions.length);
    expect(summary.questionCountsBySyllabusNode["ma-f1"]).toBeGreaterThan(0);
  });

  it("summarises worked solution coverage", () => {
    const coverage = getWorkedSolutionCoverage(database, {
      meta: {
        version: "test",
        generatedAt: "2026-06-06T00:00:00.000Z",
        defaultModel: "test-model",
        promptVersion: "test-prompt",
        notes: "Test data"
      },
      workedSolutions: []
    });

    expect(coverage.totalQuestions).toBe(database.questions.length);
    expect(coverage.workedSolutionCount).toBe(0);
    expect(coverage.missingCount).toBe(database.questions.length);
  });

  it("tracks source packs separately from imported question records", () => {
    const sourcePacks = getSourcePackCoverage(database);
    const notStartedPack = sourcePacks.find((pack) => pack.id === "source-adv-2021");
    const seededPack = sourcePacks.find((pack) => pack.id === "source-adv-2025");
    const inProgressPack = sourcePacks.find((pack) => pack.id === "source-adv-2024");
    const preparedPack = sourcePacks.find((pack) => pack.id === "source-adv-2023");
    const startedPack = sourcePacks.find((pack) => pack.id === "source-adv-2022");

    expect(sourcePacks.length).toBeGreaterThan(database.papers.length);
    expect(notStartedPack?.importStatus).toBe("not-started");
    expect(seededPack?.expectedQuestionCount).toBe(31);
    expect(seededPack?.importedQuestionCount).toBe(31);
    expect(inProgressPack?.expectedQuestionCount).toBe(31);
    expect(inProgressPack?.importedQuestionCount).toBe(31);
    expect(preparedPack?.expectedQuestionCount).toBe(32);
    expect(preparedPack?.importedQuestionCount).toBe(32);
    expect(startedPack?.expectedQuestionCount).toBe(32);
    expect(startedPack?.importedQuestionCount).toBe(32);
  });
});
