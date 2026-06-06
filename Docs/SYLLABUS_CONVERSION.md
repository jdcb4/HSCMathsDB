# Syllabus Conversion

The app stores a first-class syllabus conversion artifact at `src/data/syllabus-conversion.json`.

It maps NSW Stage 6 mathematics 2017 syllabus nodes to NSW 11-12 mathematics 2024 syllabus nodes, so questions can be tagged under either syllabus era and displayed under the user's preferred syllabus view.

The artifact currently contains course mappings for:

- Mathematics Advanced
- Mathematics Extension 1
- Mathematics Extension 2
- Mathematics Standard

## Data Model

- `src/data/hsc-math-advanced.json` contains displayable syllabus nodes for both `advanced-2017` and `advanced-2024`.
- Existing questions use `question.syllabusNodeIds` with 2017 node IDs such as `ma-f1`.
- Future questions may use either 2017 IDs or 2024 IDs such as `new-fa-working-functions`.
- `src/data/syllabus-conversion.json` stores `courses[]`, where each course has old syllabus nodes, new syllabus nodes, and mapping edges between them.
- `SyllabusConversion/additional-maths-course-conversions.json` is the separate staging artifact used to build the Extension 1, Extension 2, and Standard mappings before they are merged into the app artifact.

The current stable key between existing questions and the conversion file is:

```text
question.syllabusNodeIds[] -> courses[].oldSyllabus.nodes[].appNodeId -> courses[].mappings[].oldNodeId -> courses[].mappings[].newNodeId
```

For future 2024-tagged questions, selectors reverse that path:

```text
question.syllabusNodeIds[] -> courses[].mappings[].newNodeId -> courses[].mappings[].oldNodeId -> courses[].oldSyllabus.nodes[].appNodeId
```

The Extension 1, Extension 2, and Standard mappings are conversion-only for now because their exam corpora have not been imported. When those courses are added to the primary corpus, add displayable `syllabus` nodes whose IDs match the relevant conversion node IDs before importing questions.

## UX Rule

The current interface shows one Mathematics Advanced syllabus era at a time. The header toggle selects either the 2017 or 2024 Advanced syllabus view. Filters, the syllabus browser, question detail links, and syllabus reverse lookup all use the selected view.

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
6. For Extension 1, Extension 2, and Standard future imports, first add the relevant course's displayable corpus syllabus nodes using conversion node IDs, then tag questions against those IDs.

## Validation

`src/services/hscDatabase.ts` parses the conversion artifact with Zod. Courses already represented in the loaded corpus are checked strictly against corpus syllabus node IDs. Conversion-only future courses are internally validated but do not need corpus nodes until their exam data is imported.

Run:

```powershell
pnpm run data:validate
pnpm test
```

## Sources

- Mathematics Advanced 2017: https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-advanced-stage-6-2017
- Mathematics Advanced 2024: https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-advanced-11-12-2024/overview
- Mathematics Extension 1 2017: https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-extension-1-stage-6-2017
- Mathematics Extension 1 2024: https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/overview
- Mathematics Extension 2 2017: https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-extension-2-stage-6-2017
- Mathematics Extension 2 2024: https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-2-11-12-2024/overview
- Mathematics Standard 2017: https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-standard-stage-6-2017
- Mathematics Standard 2024: https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-standard-11-12-2024/overview
