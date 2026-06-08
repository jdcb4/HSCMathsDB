# HSC Mathematics Paper Parsing Guidance

## Purpose

This document describes the files and normalized output expected from a separate parser project. The goal is to generate records that can be reviewed and promoted into the GoalCheck HSC corpus without reshaping the app data model.

Use `other-project-output.schema.json` as the machine-readable contract and `syllabus-conversion-reference.json` as the syllabus mapping reference.

## Source File Types

Each official NSW source pack may contain several PDFs:

- Exam paper: the student-facing paper. This is the source of question text, marks, sections, diagrams, graphs, tables, page references, and multiple-choice options.
- Marking guidelines: the official answers, sample answers, marking criteria, and the mapping grid.
- Marking feedback: official comments for Section II questions, usually split into "In better responses..." and "Areas for students to improve...".
- Standards material: optional source material for older packs or selected courses.
- Syllabus documents: used only for mapping and metadata, not as question text.

Current local extraction outputs may include:

- Raw extracted text under `var/extracted-text/`.
- Raw candidate records under `var/question-candidates/`.
- Rendered PDF pages under `var/rendered-pages/`.
- PDF layout inventories under `var/layout-inventory/`.
- Diagram crop proposals and reviewed crops under `var/diagram-crop-proposals/` and `var/diagram-crops/`.
- Public reviewed assets under `public/assets/diagrams/`.

The other parser does not need to emit the app's entire database. It should emit source-pack, paper, question, asset, and mapping evidence records for the papers it parsed.

## Subjects and Courses

Supported course IDs:

- `advanced` - Mathematics Advanced.
- `standard` - Mathematics Standard.
- `extension-1` - Mathematics Extension 1.
- `extension-2` - Mathematics Extension 2.
- `mathematics-archive` - legacy Mathematics 2 Unit archive bridge.

Supported syllabus eras:

- `advanced-2017`, `advanced-2024`
- `standard-2017`, `standard-2024`
- `extension-1-2017`, `extension-1-2024`
- `extension-2-2017`, `extension-2-2024`
- `mathematics-2-unit-archive`

The current corpus contains HSC mathematics source packs for Advanced, Standard, Extension 1, Extension 2, and archived Mathematics 2 Unit material. Standard packs can contain separate Standard 1 and Standard 2 papers in one source pack.

## Paper Sections

Most current papers have:

- Section I: multiple-choice questions. These are usually worth 1 mark each and use options `A` to `D`.
- Section II: short-answer, extended-response, modelling, or proof questions. These can be multipart and usually have explicit marks.

Expected question styles:

- `multiple-choice`
- `short-answer`
- `extended-response`
- `proof`
- `modelling`

Use `multiple-choice` only for Section I option questions. Use `extended-response` for longer Section II questions, commonly 5 or more marks. Use `proof` where the main task is proving a statement. Use `modelling` where the main task is constructing or analysing a mathematical model.

## Normalized Question Text

Emit near-verbatim official question text after repairing extraction artefacts.

Required text fields:

- `promptLatex`: student-facing question prompt.
- `answerLatex`: official answer or marking-guide excerpt.
- `workingLatex`: official working steps as an array of strings where available.

Formatting rules:

- Use TeX for mathematical notation.
- Prefer MathJax inline delimiters `\\( ... \\)` and display delimiters `\\[ ... \\]` in prose-like fields.
- Do not use dollar delimiters.
- Preserve multiple-choice options as visible `A.`, `B.`, `C.`, `D.` lines.
- Preserve multipart labels such as `(a)`, `(b)`, `(i)`, `(ii)`.
- Do not include page headers, footers, "Office Use Only", blank ruled lines, continuation notices, or copyright notices.
- Repair common PDF extraction artefacts such as broken minus signs, mojibake, missing set-membership symbols, and flattened fractions.

## Assets

When a question depends on a graph, diagram, table, map, network, image, or visual multiple-choice options, add an `assets[]` entry.

Asset fields:

- `id`: stable slug, usually `<paper-id>-qNN-<short-description>`.
- `type`: `diagram`, `graph`, `table`, or `image`.
- `label`: concise display label.
- `alt`: useful text alternative.
- `path`: expected public path, normally `/assets/diagrams/<id>.png`.
- `sourceStatus`: `exam-derived`, `demo`, or `pending`.

Use `exam-derived` only when the visual was extracted or faithfully recreated from the exam. Use `pending` when the prompt requires a visual but the reviewed asset is not ready.

## Source References

Every question should keep source traceability:

- `source.examPackUrl`: official pack page URL.
- `source.pageRef`: exam page reference such as `Exam paper pages 12-13`.
- `source.markingGuideRef`: marking-guide page reference where available.
- `source.transcriptionStatus`: use `draft` for parser output until independent review.

Do not emit `verified` from the parser unless the parser run includes a documented independent source-PDF review step.

## Marking Feedback

Marking feedback is usually available for Section II only.

Emit:

- `sourceRef`: feedback document label.
- `betterResponses`: bullets from "In better responses, students were able to".
- `improvementAreas`: bullets from "Areas for students to improve include".

If feedback is absent or unparseable, omit `markingFeedback`. Do not invent feedback.

## Syllabus Mapping

Each question must include at least one `syllabusNodeIds[]` value that exists in the app corpus. For current imported 2020-2026 papers, use the 2017-era app node ID where possible. The app resolves 2024 display nodes through the conversion artifact.

Mapping rule:

```text
question.syllabusNodeIds[] -> oldSyllabus.nodes[].appNodeId -> mappings[].oldNodeId -> mappings[].newNodeId
```

For future papers examined under the 2024 syllabus, tag directly with the 2024 node ID. The app can reverse-map those records for old-syllabus views.

Include `syllabusMappingEvidence[]` in parser output for review. Each evidence item should include:

- `syllabusNodeId`: the emitted app node ID.
- `basis`: why this node was selected.
- `source`: one of `marking-grid`, `prompt`, `marking-guide`, `manual-review`, or `parser-inference`.
- `confidence`: `high`, `medium`, or `low`.
- `mapped2024NodeIds`: optional 2024 node IDs resolved from `syllabus-conversion-reference.json`.

A question may span multiple nodes. Do not duplicate old and new IDs for the same concept in `syllabusNodeIds`; store one native-era tag and put alternate-era mapping in evidence.

## Course Topic Coverage

The current mapping reference covers these broad areas:

- Advanced: functions, trigonometric functions, calculus, exponential/logarithmic functions, statistical analysis, financial mathematics, sequences and series.
- Standard: algebra, measurement, financial mathematics, statistical analysis, networks.
- Extension 1: functions, polynomials, trigonometric functions, combinatorics, proof, vectors, calculus, binomial distribution and sampling.
- Extension 2: proof, vectors, complex numbers, calculus, mechanics.

Use the exact IDs and titles in `syllabus-conversion-reference.json` when mapping to nodes.

## Quality Gates Before Promotion

Before parser output is treated as promotion-ready:

- Question count matches the official paper or configured source-pack expectation.
- Question numbers are contiguous within each paper.
- Multiple-choice options are not flattened into an unreadable paragraph.
- Every visual-dependent prompt has an asset entry.
- Marks are positive integers and match the paper.
- Every `paperId`, `courseId`, and `syllabusNodeId` resolves.
- Marking-guide answers are official excerpts or explicitly marked as not extracted.
- No source headers, footers, page numbers, or extraction junk remain in prompt or answer fields.
- `source.transcriptionStatus` remains `draft` until human/source review is complete.

For this app, deterministic verification after promotion is:

```powershell
pnpm run data:validate
pnpm run data:audit-ingested-exams -- <paper-id>
pnpm run typecheck
pnpm test
```
