# Other Project Parser Handoff

This folder contains the compatibility contract for a separate HSC paper parser.

## Files

- `other-project-output.schema.json` - JSON Schema for parser output that can be reviewed and promoted into the GoalCheck HSC corpus.
- `PARSING_GUIDANCE.md` - guidance on source files, paper sections, expected formats, supported subjects, quality requirements, and syllabus mapping.
- `syllabus-conversion-reference.json` - exact copy of the current app syllabus conversion artifact for 2017-to-2024 mapping.

## Compatibility Target

The downstream app currently validates its corpus with `src/domain/hscSchemas.ts`. Parser output should produce normalized records that can become:

- `sourcePacks[]`
- `papers[]`
- `questions[]`
- referenced public assets under `/assets/diagrams/`
- syllabus mapping through `question.syllabusNodeIds[]`

For source papers from the 2017 syllabus era, tag questions with the 2017 app node ID where possible. The app maps those tags to 2024 syllabus nodes through `syllabus-conversion-reference.json`.
