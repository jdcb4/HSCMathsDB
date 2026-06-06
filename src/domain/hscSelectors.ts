import type {
  Course,
  HscDatabase,
  Question,
  QuestionStyle,
  SourcePack,
  SyllabusConversion,
  SyllabusConversionCourse,
  SyllabusNode,
  WorkedSolution,
  WorkedSolutionsDatabase
} from "./hscSchemas";

export type SyllabusEraView = string;

export type QuestionQuery = {
  search?: string;
  courseId?: string;
  year?: number;
  topic?: string;
  style?: QuestionStyle;
  syllabusNodeId?: string;
  syllabusConversion?: SyllabusConversion;
};

const questionNumberCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base"
});

export function queryQuestions(database: HscDatabase, query: QuestionQuery): Question[] {
  const search = query.search?.trim().toLowerCase();
  const papersById = getPapersById(database);

  return database.questions
    .filter((question) => (query.courseId ? papersById[question.paperId]?.courseId === query.courseId : true))
    .filter((question) => (query.year ? question.year === query.year : true))
    .filter((question) => (query.topic ? question.topic === query.topic : true))
    .filter((question) => (query.style ? question.style === query.style : true))
    .filter((question) =>
      query.syllabusNodeId
        ? questionMatchesSyllabusNode(database, question, query.syllabusNodeId, query.syllabusConversion)
        : true
    )
    .filter((question) => {
      if (!search) {
        return true;
      }

      const searchable = [
        question.title,
        question.promptLatex,
        question.answerLatex,
        question.topic,
        question.subtopic,
        question.style,
        question.year.toString(),
        question.questionNumber,
        ...question.tags
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    })
    .sort((left, right) => right.year - left.year || compareQuestionNumbers(left, right));
}

export function compareQuestionNumbers(
  left: Pick<Question, "questionNumber">,
  right: Pick<Question, "questionNumber">
) {
  return questionNumberCollator.compare(left.questionNumber, right.questionNumber);
}

export function getLinkedSyllabusNodes(database: HscDatabase, question: Question): SyllabusNode[] {
  return question.syllabusNodeIds
    .map((nodeId) => database.syllabus.find((node) => node.id === nodeId))
    .filter((node): node is SyllabusNode => Boolean(node));
}

export function getDisplaySyllabusNodesForQuestion(
  database: HscDatabase,
  question: Question,
  syllabusEra: SyllabusEraView,
  conversion?: SyllabusConversion
): SyllabusNode[] {
  if (!conversion) {
    return getLinkedSyllabusNodes(database, question).filter((node) => node.syllabusEra === syllabusEra);
  }

  const displayNodeIds = new Set<string>();

  question.syllabusNodeIds.forEach((nativeNodeId) => {
    const nativeNode = database.syllabus.find((node) => node.id === nativeNodeId);
    if (nativeNode?.syllabusEra === syllabusEra) {
      displayNodeIds.add(nativeNode.id);
      return;
    }

    getMappedSyllabusNodeIds(nativeNodeId, syllabusEra, conversion).forEach((nodeId) =>
      displayNodeIds.add(nodeId)
    );
  });

  return [...displayNodeIds]
    .map((nodeId) => database.syllabus.find((node) => node.id === nodeId))
    .filter((node): node is SyllabusNode => Boolean(node))
    .filter((node) => node.syllabusEra === syllabusEra);
}

export function getQuestionsForSyllabusNode(
  database: HscDatabase,
  syllabusNodeId: string,
  conversion?: SyllabusConversion
): Question[] {
  return database.questions.filter((question) =>
    questionMatchesSyllabusNode(database, question, syllabusNodeId, conversion)
  );
}

export function getSyllabusNodesForView(database: HscDatabase, syllabusEra: SyllabusEraView): SyllabusNode[] {
  return database.syllabus.filter((node) => node.syllabusEra === syllabusEra);
}

export function getQuestionCountsBySyllabusNode(
  database: HscDatabase,
  syllabusEra: SyllabusEraView,
  conversion?: SyllabusConversion
): Record<string, number> {
  const counts = Object.fromEntries(
    getSyllabusNodesForView(database, syllabusEra).map((node) => [node.id, 0])
  );

  database.questions.forEach((question) => {
    getDisplaySyllabusNodesForQuestion(database, question, syllabusEra, conversion).forEach((node) => {
      counts[node.id] = (counts[node.id] ?? 0) + 1;
    });
  });

  return counts;
}

export function getFilterOptions(database: HscDatabase) {
  return getFilterOptionsForCourse(database);
}

export function getFilterOptionsForCourse(database: HscDatabase, courseId?: string) {
  const papersById = getPapersById(database);
  const questions = courseId
    ? database.questions.filter((question) => papersById[question.paperId]?.courseId === courseId)
    : database.questions;

  return {
    years: unique(questions.map((question) => question.year)).sort((left, right) => right - left),
    topics: unique(questions.map((question) => question.topic)).sort(),
    styles: unique(questions.map((question) => question.style)).sort()
  };
}

export function getCourseOptions(database: HscDatabase): Course[] {
  return database.courses;
}

export function getDefaultSyllabusEraForCourse(course?: Course): SyllabusEraView {
  return course?.syllabusEras[0]?.id ?? "";
}

function questionMatchesSyllabusNode(
  database: HscDatabase,
  question: Question,
  syllabusNodeId: string,
  conversion?: SyllabusConversion
): boolean {
  if (question.syllabusNodeIds.includes(syllabusNodeId)) {
    return true;
  }

  if (!conversion) {
    return false;
  }

  const targetNode = database.syllabus.find((node) => node.id === syllabusNodeId);
  if (!targetNode) {
    return false;
  }

  return getDisplaySyllabusNodesForQuestion(database, question, targetNode.syllabusEra, conversion).some(
    (node) => node.id === syllabusNodeId
  );
}

function getMappedSyllabusNodeIds(
  nativeNodeId: string,
  targetSyllabusEra: SyllabusEraView,
  conversion: SyllabusConversion
): string[] {
  const course = getConversionCourseForEra(conversion, targetSyllabusEra);
  if (!course) {
    return [];
  }

  if (targetSyllabusEra === course.newSyllabus.id) {
    const oldNode = course.oldSyllabus.nodes.find((node) => getOldCorpusNodeId(node) === nativeNodeId);
    if (!oldNode) {
      return [];
    }

    return course.mappings
      .filter((mapping) => mapping.oldNodeId === oldNode.id)
      .map((mapping) => mapping.newNodeId);
  }

  return course.mappings
    .filter((mapping) => mapping.newNodeId === nativeNodeId)
    .map((mapping) => {
      const oldNode = course.oldSyllabus.nodes.find((node) => node.id === mapping.oldNodeId);
      return oldNode ? getOldCorpusNodeId(oldNode) : undefined;
    })
    .filter((nodeId): nodeId is string => Boolean(nodeId));
}

function getOldCorpusNodeId(node: SyllabusConversionCourse["oldSyllabus"]["nodes"][number]): string {
  return node.appNodeId ?? node.id;
}

function getConversionCourseForEra(
  conversion: SyllabusConversion,
  syllabusEra: SyllabusEraView
): SyllabusConversionCourse | undefined {
  return conversion.courses.find(
    (course) => course.oldSyllabus.id === syllabusEra || course.newSyllabus.id === syllabusEra
  );
}

export function getDatasetSummary(database: HscDatabase) {
  const questionCountsBySyllabusNode = Object.fromEntries(database.syllabus.map((node) => [node.id, 0]));
  const questionCountsByPaper = Object.fromEntries(database.papers.map((paper) => [paper.id, 0]));
  const transcriptionCounts = {
    demo: 0,
    draft: 0,
    verified: 0
  };

  database.questions.forEach((question) => {
    questionCountsByPaper[question.paperId] = (questionCountsByPaper[question.paperId] ?? 0) + 1;
    transcriptionCounts[question.source.transcriptionStatus] += 1;

    question.syllabusNodeIds.forEach((nodeId) => {
      questionCountsBySyllabusNode[nodeId] = (questionCountsBySyllabusNode[nodeId] ?? 0) + 1;
    });
  });

  return {
    questionCount: database.questions.length,
    paperCount: database.papers.length,
    courseCount: database.courses.length,
    syllabusNodeCount: database.syllabus.length,
    sourcePackCount: database.sourcePacks.length,
    verifiedQuestionCount: transcriptionCounts.verified,
    transcriptionCounts,
    linkCount: database.questions.reduce((count, question) => count + question.syllabusNodeIds.length, 0),
    questionCountsBySyllabusNode,
    questionCountsByPaper
  };
}

export function getSourcePackCoverage(database: HscDatabase): SourcePack[] {
  return getSourcePackCoverageForCourse(database);
}

export function getSourcePackCoverageForCourse(database: HscDatabase, courseId?: string): SourcePack[] {
  const officialQuestionCountsByPaper = database.questions.reduce<Record<string, number>>(
    (counts, question) => {
      if (question.source.transcriptionStatus !== "demo") {
        counts[question.paperId] = (counts[question.paperId] ?? 0) + 1;
      }
      return counts;
    },
    {}
  );

  return database.sourcePacks
    .filter((pack) => (courseId ? pack.courseId === courseId : true))
    .map((pack) => ({
      ...pack,
      importedQuestionCount:
        pack.paperIds && pack.paperIds.length > 0
          ? pack.paperIds.reduce((count, paperId) => count + (officialQuestionCountsByPaper[paperId] ?? 0), 0)
          : pack.paperId
            ? (officialQuestionCountsByPaper[pack.paperId] ?? 0)
            : pack.importedQuestionCount
    }))
    .sort((left, right) => right.year - left.year || left.title.localeCompare(right.title));
}

export function getWorkedSolutionForQuestion(
  workedSolutionsDatabase: WorkedSolutionsDatabase,
  questionId: string
): WorkedSolution | undefined {
  return workedSolutionsDatabase.workedSolutions.find(
    (workedSolution) => workedSolution.questionId === questionId && workedSolution.reviewStatus !== "rejected"
  );
}

export function getWorkedSolutionCoverage(
  database: HscDatabase,
  workedSolutionsDatabase: WorkedSolutionsDatabase
) {
  const questionIds = new Set(database.questions.map((question) => question.id));
  const currentWorkedSolutions = workedSolutionsDatabase.workedSolutions.filter((workedSolution) =>
    questionIds.has(workedSolution.questionId)
  );
  const questionIdsWithWorkedSolutions = new Set(
    currentWorkedSolutions
      .filter((workedSolution) => workedSolution.reviewStatus !== "rejected")
      .map((workedSolution) => workedSolution.questionId)
  );

  return {
    totalQuestions: database.questions.length,
    workedSolutionCount: questionIdsWithWorkedSolutions.size,
    missingCount: Math.max(0, database.questions.length - questionIdsWithWorkedSolutions.size),
    generatedCount: currentWorkedSolutions.filter(
      (workedSolution) => workedSolution.reviewStatus === "generated"
    ).length,
    reviewedCount: currentWorkedSolutions.filter(
      (workedSolution) => workedSolution.reviewStatus === "reviewed"
    ).length,
    needsReviewCount: currentWorkedSolutions.filter(
      (workedSolution) => workedSolution.reviewStatus === "needs-review"
    ).length
  };
}

export function getMarkingFeedbackCoverage(database: HscDatabase) {
  const questionsWithFeedback = database.questions.filter(
    (question) =>
      question.markingFeedback &&
      (question.markingFeedback.betterResponses.length > 0 ||
        question.markingFeedback.improvementAreas.length > 0)
  );

  return {
    totalQuestions: database.questions.length,
    feedbackQuestionCount: questionsWithFeedback.length,
    missingCount: Math.max(0, database.questions.length - questionsWithFeedback.length),
    byYear: questionsWithFeedback.reduce<Record<number, number>>((counts, question) => {
      counts[question.year] = (counts[question.year] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function getPapersById(database: HscDatabase): Record<string, HscDatabase["papers"][number]> {
  return Object.fromEntries(database.papers.map((paper) => [paper.id, paper]));
}
