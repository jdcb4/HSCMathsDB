# Architecture

This document describes the project's runtime shape and module boundaries.

## Runtime shape

- App type: static web app.
- Framework/runtime: Vite, React, TypeScript, Tailwind CSS, with Cloudflare Pages Functions for Cloudflare-only feedback submission.
- Deployment target: GitHub Pages for static hosting and Cloudflare Pages for static hosting plus `/api/feedback`.
- Persistence model: validated local JSON corpus in `src/data/hsc-math-advanced.json`, sidecar artifacts for worked solutions and syllabus conversion, and Cloudflare D1 for runtime question feedback.
- Rendering: TeX/LaTeX strings are rendered in-browser with MathJax through `better-react-mathjax`.
- PDF export: selected questions render through a client-side print view that reuses the browser, MathJax, public diagram assets, and print CSS. Users save the browser print output as PDF.
- Source boundary: official NESA pages are linked in the corpus; promoted records start as draft transcriptions until reviewed against the PDFs.

## Module boundaries

- `src/app` - app shell and framework entrypoint.
- `src/features` - question, syllabus, and math-rendering UI.
- `src/domain` - Zod schemas, types, and selectors.
- `src/services` - local corpus loading and validation.
- `src/data` - local JSON corpus, worked-solution sidecar, and syllabus conversion map.
- `src/styles` - token CSS and Tailwind entrypoint.
- `src/tests` - shared test setup.
- `functions` - Cloudflare Pages Functions.
- `migrations` - Cloudflare D1 migrations.

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

Question-quality feedback is separate from the canonical corpus. It is submitted to `POST /api/feedback` on Cloudflare Pages, stored in D1, and reviewed with local Wrangler scripts. Feedback rows are moderation/workflow data, not source-of-truth question records.

## Validation

Validate every external input: forms, URL params, request bodies, environment variables, JSON file loads, third-party API responses, and realtime events.

The current local corpus, worked-solution sidecar, and syllabus conversion artifact are validated with Zod on import. Run `pnpm run data:validate` for a direct corpus check and `pnpm run data:audit-sources` to compare the catalog with the current official listing pages.

## Import pipeline

See `Docs/IMPORT_WORKFLOW.md`.

The current import pipeline can:

- use `SourceExams/` as the canonical local PDF archive
- sync PDFs from `SourceExams/` into ignored `var/source-assets/` with bounded concurrency
- extract raw text into ignored `var/extracted-text/` with bounded concurrency
- segment raw text into ignored `var/question-candidates/` review candidates
- promote configured Standard and Extension source text through `data:ingest-additional-maths` where a deterministic profile exists
- render PDF pages into ignored `var/rendered-pages/` with bounded concurrency
- generate Gemini/Sonnet page-image ingestion proposals through `data:propose-gemini-ingestion`
- promote reviewed Gemini reports through `data:promote-gemini-ingestion`
- run retained diagnostic helpers for embedded-image extraction, layout inventory, explicit pixel cropping, visual-bbox model trials, and crop-coordinate checks

Question normalization, syllabus mapping, and diagram extraction still require review before records can be marked `verified`. The target operating model is that new Standard and Extension years use the Gemini/Sonnet proposal path first, with deterministic profile importers retained for already-profiled years or narrow fallback cases. Source discovery from the web is no longer part of the normal ingestion path; web checks are only source-drift diagnostics.

After extraction, a local script may generate draft student explanations through OpenRouter from the reviewed normalized corpus. Generated explanations stay in ignored `var/llm-explanations/` until structurally validated and mathematically reviewed, then promoted into the public explanation sidecar.

## Configuration

The static app does not require browser environment variables. The Cloudflare feedback Function requires a D1 binding named `FEEDBACK_DB` and should have a secret `FEEDBACK_IP_SALT` for stable IP hashing.

## Testing

Vitest covers domain selectors and validates the seed database at import time. Add integration tests for important UI workflows as the corpus and routes grow.

## Deployment

See `Docs/DEPLOYMENT.md`.
