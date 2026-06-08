import type { HscDatabase, SyllabusConversion } from "../domain/hscSchemas";

export function validateSyllabusConversionAgainstDatabase(
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
