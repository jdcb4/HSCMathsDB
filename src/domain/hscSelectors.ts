import type { HscDatabase, Question, QuestionStyle, SourcePack, SyllabusNode } from "./hscSchemas";

export type QuestionQuery = {
  search?: string;
  year?: number;
  topic?: string;
  style?: QuestionStyle;
  syllabusNodeId?: string;
};

export function queryQuestions(database: HscDatabase, query: QuestionQuery): Question[] {
  const search = query.search?.trim().toLowerCase();

  return database.questions
    .filter((question) => (query.year ? question.year === query.year : true))
    .filter((question) => (query.topic ? question.topic === query.topic : true))
    .filter((question) => (query.style ? question.style === query.style : true))
    .filter((question) =>
      query.syllabusNodeId ? question.syllabusNodeIds.includes(query.syllabusNodeId) : true
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
    .sort((left, right) => right.year - left.year || left.questionNumber.localeCompare(right.questionNumber));
}

export function getLinkedSyllabusNodes(database: HscDatabase, question: Question): SyllabusNode[] {
  return question.syllabusNodeIds
    .map((nodeId) => database.syllabus.find((node) => node.id === nodeId))
    .filter((node): node is SyllabusNode => Boolean(node));
}

export function getQuestionsForSyllabusNode(database: HscDatabase, syllabusNodeId: string): Question[] {
  return database.questions.filter((question) => question.syllabusNodeIds.includes(syllabusNodeId));
}

export function getFilterOptions(database: HscDatabase) {
  return {
    years: unique(database.questions.map((question) => question.year)).sort((left, right) => right - left),
    topics: unique(database.questions.map((question) => question.topic)).sort(),
    styles: unique(database.questions.map((question) => question.style)).sort()
  };
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
    .map((pack) => ({
      ...pack,
      importedQuestionCount: pack.paperId
        ? (officialQuestionCountsByPaper[pack.paperId] ?? 0)
        : pack.importedQuestionCount
    }))
    .sort((left, right) => right.year - left.year || left.title.localeCompare(right.title));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
