import { listLocalSourceExams } from "./local-source-exams";

const files = await listLocalSourceExams();
const byYear = new Map<number, number>();
const bySubject = new Map<string, number>();
const byType = new Map<string, number>();

for (const file of files) {
  byYear.set(file.year, (byYear.get(file.year) ?? 0) + 1);
  bySubject.set(file.subject, (bySubject.get(file.subject) ?? 0) + 1);
  byType.set(file.documentType, (byType.get(file.documentType) ?? 0) + 1);
}

console.log(`SourceExams files: ${files.length}`);
console.log(`Years: ${formatMap(byYear)}`);
console.log(`Subjects: ${formatMap(bySubject)}`);
console.log(`Document types: ${formatMap(byType)}`);

function formatMap<TKey extends string | number>(map: Map<TKey, number>): string {
  return [...map.entries()]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([key, count]) => `${key}=${count}`)
    .join(", ");
}
