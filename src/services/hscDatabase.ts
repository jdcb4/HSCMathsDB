import rawDatabase from "../data/hsc-math-advanced.json";
import rawWorkedSolutions from "../data/hsc-math-advanced-worked-solutions.json";
import rawSyllabusConversion from "../data/syllabus-conversion.json";
import {
  HscDatabaseSchema,
  SyllabusConversionSchema,
  WorkedSolutionsDatabaseSchema,
  type HscDatabase,
  type SyllabusConversion
} from "../domain/hscSchemas";

export const database = HscDatabaseSchema.parse(rawDatabase);
export const workedSolutionsDatabase = WorkedSolutionsDatabaseSchema.parse(rawWorkedSolutions);
export const syllabusConversion = validateSyllabusConversionAgainstDatabase(
  SyllabusConversionSchema.parse(rawSyllabusConversion),
  database
);

function validateSyllabusConversionAgainstDatabase(
  conversion: SyllabusConversion,
  hscDatabase: HscDatabase
): SyllabusConversion {
  const syllabusNodeIds = new Set(hscDatabase.syllabus.map((node) => node.id));
  const missingOldAppNodeIds: string[] = [];
  const missingNewNodeIds: string[] = [];

  conversion.courses.forEach((course) => {
    const oldAppNodeIds = course.oldSyllabus.nodes.map((node) => node.appNodeId ?? node.id);
    const newNodeIds = course.newSyllabus.nodes.map((node) => node.id);
    const courseHasCorpusNodes =
      oldAppNodeIds.some((nodeId) => syllabusNodeIds.has(nodeId)) ||
      newNodeIds.some((nodeId) => syllabusNodeIds.has(nodeId));

    if (!courseHasCorpusNodes) {
      return;
    }

    missingOldAppNodeIds.push(...oldAppNodeIds.filter((nodeId) => !syllabusNodeIds.has(nodeId)));
    missingNewNodeIds.push(...newNodeIds.filter((nodeId) => !syllabusNodeIds.has(nodeId)));
  });

  if (missingOldAppNodeIds.length > 0 || missingNewNodeIds.length > 0) {
    throw new Error(
      [
        "Syllabus conversion does not match the loaded corpus.",
        missingOldAppNodeIds.length > 0 ? `Missing 2017 app nodes: ${missingOldAppNodeIds.join(", ")}` : "",
        missingNewNodeIds.length > 0 ? `Missing 2024 app nodes: ${missingNewNodeIds.join(", ")}` : ""
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  return conversion;
}
