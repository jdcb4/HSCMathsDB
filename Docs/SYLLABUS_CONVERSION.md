# Syllabus Conversion

The app stores a first-class syllabus conversion artifact at `src/data/syllabus-conversion.json`.

It maps the NSW Mathematics Advanced Stage 6 Syllabus (2017) to the NSW Mathematics Advanced 11-12 Syllabus (2024), so questions can be tagged under either syllabus era and displayed under the user's preferred syllabus view.

## Data Model

- `src/data/hsc-math-advanced.json` contains displayable syllabus nodes for both `advanced-2017` and `advanced-2024`.
- Existing questions use `question.syllabusNodeIds` with 2017 node IDs such as `ma-f1`.
- Future questions may use either 2017 IDs or 2024 IDs such as `new-fa-working-functions`.
- `src/data/syllabus-conversion.json` stores bidirectional mapping edges between old and new nodes.

The current stable key between existing questions and the conversion file is:

```text
question.syllabusNodeIds[] -> oldSyllabus.nodes[].appNodeId -> mappings[].oldNodeId -> mappings[].newNodeId
```

For future 2024-tagged questions, selectors reverse that path:

```text
question.syllabusNodeIds[] -> mappings[].newNodeId -> mappings[].oldNodeId -> oldSyllabus.nodes[].appNodeId
```

## UX Rule

The interface shows one syllabus era at a time. The header toggle selects either the 2017 or 2024 syllabus view. Filters, the syllabus browser, question detail links, and syllabus reverse lookup all use the selected view.

The app does not duplicate question tags during display. It resolves the selected view programmatically through the conversion map.

## Selector Contract

Use these domain selectors when working with syllabus-aware UI or imports:

- `getSyllabusNodesForView(database, syllabusEra)` returns only the active syllabus nodes.
- `getDisplaySyllabusNodesForQuestion(database, question, syllabusEra, conversion)` returns the native or mapped nodes for a question in the selected view.
- `queryQuestions(database, { syllabusNodeId, syllabusConversion })` includes questions tagged natively or mapped into the requested node.
- `getQuestionsForSyllabusNode(database, syllabusNodeId, conversion)` performs the same mapped reverse lookup.
- `getQuestionCountsBySyllabusNode(database, syllabusEra, conversion)` counts questions as displayed in the selected syllabus view.

## Import Guidance

When adding new questions:

1. Tag the question using the syllabus era of the source paper where possible.
2. Use 2017 IDs for 2020-2026 HSC Mathematics Advanced papers and 2024 IDs for papers examined under the 2024 syllabus.
3. Do not manually add duplicate old/new syllabus IDs for the same concept.
4. Rely on the conversion map for display under the alternate view.
5. If a question spans topics, store multiple `syllabusNodeIds`; mapped display will deduplicate related nodes.

## Validation

`src/services/hscDatabase.ts` parses the conversion artifact with Zod and checks that all mapped 2017 `appNodeId` values and 2024 node IDs exist in the loaded corpus.

Run:

```powershell
pnpm run data:validate
pnpm test
```

## Sources

- 2017 syllabus page: https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-advanced-stage-6-2017
- 2017 syllabus DOCX: https://www.nsw.gov.au/sites/default/files/noindex/2025-04/mathematics-advanced-stage-6-syllabus-2017.docx
- 2024 overview: https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-advanced-11-12-2024/overview
- 2024 content: https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-advanced-11-12-2024/content
