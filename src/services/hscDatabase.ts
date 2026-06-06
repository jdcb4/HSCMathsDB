import rawDatabase from "../data/hsc-math-advanced.json";
import { HscDatabaseSchema } from "../domain/hscSchemas";

export const database = HscDatabaseSchema.parse(rawDatabase);
