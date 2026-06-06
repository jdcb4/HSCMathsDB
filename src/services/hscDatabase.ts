import rawDatabase from "../data/hsc-math-advanced.json";
import rawWorkedSolutions from "../data/hsc-math-advanced-worked-solutions.json";
import { HscDatabaseSchema, WorkedSolutionsDatabaseSchema } from "../domain/hscSchemas";

export const database = HscDatabaseSchema.parse(rawDatabase);
export const workedSolutionsDatabase = WorkedSolutionsDatabaseSchema.parse(rawWorkedSolutions);
