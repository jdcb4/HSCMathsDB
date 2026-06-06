# Import Workflow

This workflow turns official NSW source packs into verified question records, marking-guide answers, and diagram assets.

## Current Import Handoff - 2026-06-06

- 2025 Mathematics Advanced: 31/31 official draft records promoted; source-pack asset status is complete.
- 2025 Mathematics Standard: 68/68 official draft records promoted across Standard 1 and Standard 2 with marking-guide excerpts and Section II marking feedback where extractable. Source text was generated from the official PDFs and promoted through `pnpm run data:promote-2025-additional-maths`.
- 2025 Mathematics Extension 1: 14/14 official draft records promoted with marking-guide excerpts and Section II marking feedback where extractable. Source text was generated from the official PDFs and promoted through `pnpm run data:promote-2025-additional-maths`.
- 2025 Mathematics Extension 2: 16/16 official draft records promoted with marking-guide excerpts and Section II marking feedback where extractable. Source text was generated from the official PDFs and promoted through `pnpm run data:promote-2025-additional-maths`.
- 2024 Mathematics Advanced: 31/31 official draft records promoted; source-pack asset status is complete.
- 2023 Mathematics Advanced: source PDFs cached, text/candidates extracted, and 44 exam/guide pages rendered under `var/rendered-pages/source-adv-2023/`; Q1-Q32 are promoted as official draft records. Q1, Q2, Q4, Q5, Q6, Q10, Q16, Q18, Q19, Q22, Q23, Q24, Q27, Q28, Q30, and Q32 public diagram assets are already in `public/assets/diagrams/`.
- 2022 Mathematics Advanced: 32/32 official draft records promoted; source-pack asset status is complete. Source PDFs are cached, text/candidates extracted, embedded-image metadata extracted, and 40 exam pages rendered under `var/rendered-pages/source-adv-2022/`. Q1, Q3, Q7, Q8, Q10, Q11, Q12, Q14, Q16, Q17, Q21, Q24, Q28, Q29, and Q31 public diagram assets are already in `public/assets/diagrams/`.
- Next import work can start with the 2021 Mathematics Advanced source pack or with review/crop passes for the 2025 Standard and Extension draft records. Keep using `pnpm run data:report-coverage -- <source-pack-id>` as the compact progress check before opening large extracted files.
- Keep promoted source records at `source.transcriptionStatus: "draft"` until an independent review checks prompt text, answers, marks, page refs, syllabus mappings, and assets against the official PDFs.

## 1. Validate local data

```powershell
pnpm run data:validate
```

This checks `src/data/hsc-math-advanced.json` against the TypeScript Zod schema.

## 2. Audit official source pages

```powershell
pnpm run data:audit-sources
pnpm run data:audit-assets
```

`data:audit-sources` checks that the local `sourcePacks` catalog represents the currently visible NSW listing pages.

`data:audit-assets` visits each pack detail page and confirms the page exposes an exam paper PDF, marking guidelines PDF, and marking feedback PDF.

These checks use the live NSW website, so they are source-drift checks rather than deterministic build checks.

## 3. Cache official PDFs locally

Download one source pack:

```powershell
pnpm run data:download-sources -- source-adv-2025
```

Download every cataloged source pack:

```powershell
pnpm run data:download-sources
```

Downloaded PDFs are written to `var/source-assets/`, which is ignored by git.

## 4. Extract raw text

```powershell
pnpm run data:extract-text -- source-adv-2025
```

Extracted text is written to `var/extracted-text/`, which is ignored by git. This text is raw source material for manual or assisted transcription. It may contain OCR/PDF extraction artefacts and must be reviewed before any question is marked as `verified`.

For the 2025 Mathematics Standard, Extension 1, and Extension 2 source packs, promote the extracted official text into draft app records with:

```powershell
pnpm run data:promote-2025-additional-maths
```

This script rewrites the relevant draft records in `src/data/hsc-math-advanced.json`, promotes the required Standard/Extension syllabus nodes, attaches marking-guide excerpts, and imports Section II marking feedback where the official feedback PDFs expose parseable bullet sections.

## 5. Create question candidates

Generate raw review candidates:

```powershell
pnpm run data:extract-candidates -- source-adv-2025
pnpm run data:validate-candidates -- source-adv-2025
pnpm run data:report-candidates -- source-adv-2025
pnpm run data:report-coverage -- source-adv-2025
```

Candidate JSON is written to `var/question-candidates/`, which is ignored by git. Candidates contain raw extracted question and marking-guide text, page references, and review status. They are intentionally not loaded by the app until reviewed and normalized.

`data:report-coverage` prints a compact source-pack status line with imported counts, missing candidate question numbers, transcription counts, and missing public assets. Use it before opening large candidate or corpus files.

## 6. Promote reviewed candidates

For each question:

- Add a `questions[]` record in `src/data/hsc-math-advanced.json`.
- Make `promptLatex` a near-verbatim replication of the exam question. Only change wording when required to repair PDF extraction artefacts, express mathematical notation in TeX, or replace a visual-only reference with an explicit asset reference such as "Options A-D are shown in the diagram."
- Make `answerLatex` and `workingLatex` follow the official marking guide/sample answer as closely as possible. Do not compress marking-guide steps into a shorter LLM explanation; the LLM-built explanation belongs in the separate worked-solution sidecar.
- Store reconstructable maths as TeX in `promptLatex`, `answerLatex`, and `workingLatex`.
- Link the record to the source paper through `paperId`.
- Link the record to one or more syllabus nodes through `syllabusNodeIds`.
- For multipart questions, make part boundaries visible in `workingLatex` and imported feedback by prefixing part-specific items with `(a)`, `(b)`, etc. The app groups these under part headings.
- Set `source.transcriptionStatus` to `draft` until the prompt wording, answer steps, marks, source references, syllabus mapping, feedback, and assets are checked against the PDFs.
- Set `source.transcriptionStatus` to `verified` only after review.

After each paper is promoted or regenerated, run the ingestion-quality audit before treating the
records as acceptable:

```powershell
pnpm run data:audit-ingested-exams -- std1-2025
pnpm run data:audit-ingested-exams -- std2-2025
pnpm run data:audit-ingested-exams -- ext1-2025
pnpm run data:audit-ingested-exams -- ext2-2025
```

This audit is a deterministic guardrail for issues seen in the Standard and Extension import pass:
flattened multiple-choice options, stray section instructions inside a question, missing assets for
graph/table/diagram prompts, mojibake, raw membership notation such as `t ! R`, and multipart
marking-guide excerpts collapsed into one paragraph. It is not a substitute for source-PDF review,
but a promoted paper should have zero audit errors before it is considered high quality.

## 7. Ingest marking feedback

Each source pack should include marking feedback as well as the exam paper and marking guide.

```powershell
pnpm run data:ingest-marking-feedback -- 2025 --write
pnpm run data:ingest-marking-feedback -- --write
```

`data:ingest-marking-feedback` reads the extracted marking-feedback text in `var/extracted-text/`, groups part-level blocks back onto the parent question, and writes each question's `markingFeedback` card with:

- `betterResponses` for the "In better responses, students were able to" bullets.
- `improvementAreas` for the "Areas for students to improve include" bullets.
- `sourceRef` for the originating feedback document.

Marking feedback is usually available only for Section II, so Section I multiple-choice questions may legitimately have no feedback card. Treat extracted feedback as official feedback context, but review formula-heavy bullets against the rendered/source PDF before marking a question as `verified`.

## 8. Extract diagrams and images

Scan cached PDFs for embedded raster images:

```powershell
pnpm run data:extract-images -- source-adv-2025
```

Extracted raster images and metadata are written to `var/extracted-images/`, which is ignored by git.

Some NESA exam diagrams are vector drawing content, not embedded raster images. If `data:extract-images` reports few or no images for the exam paper, the next import step is page rendering and manual/assisted cropping from the cached PDF pages.

Render PDF pages:

```powershell
pnpm run data:render-pages -- source-adv-2025 --pages 10-14 --scale 1.25
pnpm run data:report-renders -- source-adv-2025
```

Rendered pages are written to `var/rendered-pages/`, which is ignored by git.

Create a crop candidate from a rendered page:

```powershell
pnpm run data:crop-render -- --input var/rendered-pages/source-adv-2025/source-adv-2025-exam-paper-2025-hsc-maths-advanced/page-012.png --x 115 --y 185 --width 505 --height 300 --output var/diagram-crops/source-adv-2025/q14-scatterplot.png
```

Crop candidates and crop metadata are written to `var/diagram-crops/`, which is ignored by git. Crops should be reviewed before being copied into `public/assets/diagrams/`.

If the crop is reviewed during creation, write reviewed metadata directly:

```powershell
pnpm run data:crop-render -- --input var/rendered-pages/source-adv-2025/source-adv-2025-exam-paper-2025-hsc-maths-advanced/page-012.png --x 115 --y 185 --width 505 --height 300 --output var/diagram-crops/source-adv-2025/q14-scatterplot.png --review-status reviewed
```

Important source diagrams should be copied or recreated as static assets under `public/assets/diagrams/`, then referenced from the question's `assets[]` list. Mark `sourceStatus` as:

- `exam-derived` when the asset is extracted or faithfully recreated from the exam.
- `demo` for seed/demo-only assets.
- `pending` when a needed asset has been identified but not yet created.

Do not mark a question as `verified` while required diagrams are still missing.

## 9. 2025 import retrospective

The 2025 import worked best when the workflow used official PDF caches, raw candidate extraction for question and marking-guide text, rendered pages for vector diagrams, and a browser check after each batch. Whole visual blocks were more reliable than attempting to OCR or recreate graph-choice options.

The slowest steps were repeatedly rereading large JSON/candidate files and manually patching crop metadata after visual review. The `data:report-coverage` script and `--review-status reviewed` crop option reduce those repeat reads and manual edits.

For future years, parallelise in two lanes after PDFs are cached and candidates are generated:

- Text lane: draft prompt, answer, working, tags, and syllabus mapping from candidate JSON and marking-grid text.
- Visual lane: render pages, crop diagrams, review dimensions, and prepare public asset paths.

These lanes can be assigned to sub-agents by year or by page range. A cheaper model is suitable for first-pass candidate summarisation, page/crop inventory, alt-text drafting, and syllabus-code lookup from the marking grid. Keep final question promotion, mathematical answer checking, and browser verification on the stronger model.

## 10. Generate student explanations

After question extraction and review, generate draft worked explanations from the normalized corpus rather than from raw PDFs or candidate text.

See `Docs/LLM_EXPLANATIONS.md` for the prompt, mathematical syntax contract, response schema, OpenRouter script shape, caching approach, review workflow, and end-user display plan.

All worked-solution fields ending in `Latex` must use MathJax delimiters: inline maths as `\\( ... \\)`, display maths as `\\[ ... \\]`, no dollar delimiters, no raw TeX commands outside delimiters, and no plain ASCII equations such as `x = 2` or `P(X>c)`.

Run the notation audit after generation and before treating the sidecar as usable:

```powershell
pnpm run data:audit-worked-solution-math
pnpm run data:report-worked-solutions
```

The audit must report zero issues. If it flags raw TeX, dollar delimiters, corrupt TeX fragments, nested MathJax delimiters, or plain ASCII maths, regenerate or repair the affected records before running the standard validation and build checks.
