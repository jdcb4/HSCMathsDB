import rawDatabase from "../data/hsc-math-advanced.json";
import rawWorkedSolutions from "../data/hsc-math-advanced-worked-solutions.json";
import rawSyllabusConversion from "../data/syllabus-conversion.json";
import {
  HscDatabaseSchema,
  SyllabusConversionSchema,
  WorkedSolutionsDatabaseSchema
} from "../domain/hscSchemas";
import { validateSyllabusConversionAgainstDatabase } from "./hscDataValidation";

export const database = HscDatabaseSchema.parse(rawDatabase);
export const workedSolutionsDatabase = WorkedSolutionsDatabaseSchema.parse(rawWorkedSolutions);
export const syllabusConversion = validateSyllabusConversionAgainstDatabase(
  SyllabusConversionSchema.parse(rawSyllabusConversion),
  database
);
