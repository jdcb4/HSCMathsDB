# Gemini Ingestion Engine

The Gemini ingestion engine is the proposal layer for near-autonomous exam intake. It does not write
directly to the canonical corpus. It reads rendered official PDF pages, asks Gemini 3.1 Flash Lite for
structured page proposals, reconciles exam-page and marking-guide output, and writes review artifacts
under ignored `var/` paths.

## Command

```powershell
pnpm run data:propose-gemini-ingestion -- std1-2023
```

Useful scoped runs:

```powershell
pnpm run data:propose-gemini-ingestion -- std1-2023 --pages 2-6 --guide-pages 1-4
pnpm run data:propose-gemini-ingestion -- std1-2023 --force
pnpm run data:propose-gemini-ingestion -- std1-2023 --skip-llm
```

The default model is `google/gemini-3.1-flash-lite` through OpenRouter. The command requires
`OPENROUTER_API_KEY` unless `--skip-llm` is used.

## Prerequisites

The source pack must exist in `src/data/hsc-math-advanced.json`, the official PDFs must be cached, and
the relevant pages must be rendered:

```powershell
pnpm run data:download-sources -- source-std-2023
pnpm run data:render-pages -- source-std-2023 --all-documents --scale 1.5
```

## Outputs

For `std1-2023`, the engine writes:

- `var/gemini-ingestion-proposals/std1-2023/raw/` - cached OpenRouter responses
- `var/gemini-ingestion-proposals/std1-2023/parsed/` - parsed page proposals
- `var/gemini-ingestion-proposals/std1-2023/report.json` - reconciled machine-readable report
- `var/gemini-ingestion-proposals/std1-2023/report.html` - local review surface with rendered page images

These outputs are intentionally ignored by git.

## Pipeline Shape

1. Resolve the `paperId` to its source pack and rendered exam/marking-guide documents.
2. Send each rendered exam page to Gemini for question transcription, option extraction, and visual
   asset detection.
3. Send each rendered marking-guide page to Gemini for answer-key, criteria, and sample-answer
   extraction.
4. Parse model JSON permissively enough to preserve useful proposals when Gemini uses nullable fields
   or non-standard visual labels.
5. Reconcile question numbers across exam and marking-guide proposals.
6. Flag missing prompt/answer coverage, asset needs, low confidence, raw TeX outside MathJax
   delimiters, and risk-like page notes.
7. Use the report as the review queue before promoting records through the existing importer/corpus
   path.

## 2023 Standard 1 Trial

The first full new-year trial was run on 2023 Mathematics Standard 1 after adding
`source-std-2023`, `std1-2023`, and `std2-2023` to the source catalog.

Result after parser tightening:

- 38 exam pages processed
- 21 marking-guide pages processed
- 31/31 question skeletons reconciled
- 31/31 questions with prompt proposals
- 31/31 questions with marking-guide answer proposals
- 19 questions identified as needing source assets
- 0 page-level errors
- 10 questions left with review flags, mostly raw TeX outside MathJax delimiters in option or
  marking-guide fields

This is a strong enough signal to use Gemini page-image extraction as the default proposal path for
new Standard and Extension years, with deterministic reconciliation and review gates before corpus
promotion.
