# Architecture

This document describes the project's runtime shape and module boundaries.

## Runtime shape

- App type: static web app.
- Framework/runtime: Vite, React, TypeScript, Tailwind CSS.
- Deployment target: not chosen; any static host that can serve Vite's `dist/` output should work.
- Persistence model: validated local JSON corpus in `src/data/hsc-math-advanced.json`, with sidecar artifacts for worked solutions and syllabus conversion.
- Rendering: TeX/LaTeX strings are rendered in-browser with MathJax through `better-react-mathjax`.
- Source boundary: official NESA pages are linked in the corpus; promoted records start as draft transcriptions until reviewed against the PDFs.

## Module boundaries

- `src/app` - app shell and framework entrypoint.
- `src/features` - question, syllabus, and math-rendering UI.
- `src/domain` - Zod schemas, types, and selectors.
- `src/services` - local corpus loading and validation.
- `src/data` - local JSON corpus, worked-solution sidecar, and syllabus conversion map.
- `src/styles` - token CSS and Tailwind entrypoint.
- `src/tests` - shared test setup.

## Boundary rules

- Domain code does not import React, framework runtime APIs, filesystem, network, or database modules unless explicitly required.
- UI components do not own persistence or network calls.
- IO sits behind service modules so it can be mocked or swapped in tests.
- Feature orchestration is separate from pure domain rules.
- Inject time, randomness, IDs, and external services when deterministic tests need control.

## Persistence

JSON is the first database layer. It supports deterministic local validation, simple source control, and static hosting while the question schema is still stabilising.

The corpus has two related but distinct layers:

- `courses` defines the supported course-level navigation structure and syllabus-era options.
- `sourcePacks` tracks official NSW exam-pack pages, import status, and pending asset extraction.
- `questions` stores actual browseable question records with TeX prompts, answers, syllabus mappings, and diagram references. Records may be demo seeds, official drafts, or verified transcriptions.

Student-facing worked explanations are planned as a separate validated sidecar keyed by `questionId`, not embedded directly into each question record. See `Docs/LLM_EXPLANATIONS.md`.

The 2017-to-2024 syllabus conversion is a separate validated multi-course artifact in `src/data/syllabus-conversion.json`. The current corpus contains displayable nodes for both syllabus eras across Mathematics Advanced, Standard, Extension 1, and Extension 2, but questions only need native `syllabusNodeIds`; selectors resolve alternate-era display through the conversion map. See `Docs/SYLLABUS_CONVERSION.md`.

Move to SQLite, Postgres, or a search index only when the complete corpus, full-text search, collaborative editing, or ingestion workflow makes JSON unsuitable. Document that migration in `Docs/DECISIONS.md`.

## Validation

Validate every external input: forms, URL params, request bodies, environment variables, JSON file loads, third-party API responses, and realtime events.

The current local corpus, worked-solution sidecar, and syllabus conversion artifact are validated with Zod on import. Run `pnpm run data:validate` for a direct corpus check and `pnpm run data:audit-sources` to compare the catalog with the current official listing pages.

## Import pipeline

See `Docs/IMPORT_WORKFLOW.md`.

The current import pipeline can:

- discover official PDF assets from each cataloged pack detail page
- download PDFs into ignored `var/source-assets/`
- extract raw text into ignored `var/extracted-text/`
- segment raw text into ignored `var/question-candidates/` review candidates
- promote 2025 Standard and Extension source text into draft question records through `data:promote-2025-additional-maths`
- extract embedded PDF raster images into ignored `var/extracted-images/` metadata and files
- render PDF pages into ignored `var/rendered-pages/`
- crop rendered pages into ignored `var/diagram-crops/` candidates for diagram review

Question normalization, syllabus mapping, and diagram extraction still require review before records can be marked `verified`.

After extraction, a local script may generate draft student explanations through OpenRouter from the reviewed normalized corpus. Generated explanations stay in ignored `var/llm-explanations/` until structurally validated and mathematically reviewed, then promoted into the public explanation sidecar.

## Configuration

No environment variables are required for the current static app. If configuration is added, create `src/config/env.ts` and validate it with Zod.

## Testing

Vitest covers domain selectors and validates the seed database at import time. Add integration tests for important UI workflows as the corpus and routes grow.

## Deployment

See `Docs/DEPLOYMENT.md`.
