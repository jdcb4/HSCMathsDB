# Gemini Ingestion Engine

The Gemini ingestion engine is the proposal layer for near-autonomous exam intake. It does not write
directly to the canonical corpus. It reads rendered official PDF pages, asks Gemini 3.1 Flash Lite for
structured page proposals, reconciles exam-page and marking-guide output, and writes review artifacts
under ignored `var/` paths.

## Command

```powershell
pnpm run data:propose-gemini-ingestion -- std1-2023
pnpm run data:publish-gemini-ingestion-report -- std1-2023
```

Useful scoped runs:

```powershell
pnpm run data:propose-gemini-ingestion -- std1-2023 --pages 2-6 --guide-pages 1-4
pnpm run data:propose-gemini-ingestion -- std1-2023 --force
pnpm run data:propose-gemini-ingestion -- std1-2023 --judge-model <openrouter-model-id>
pnpm run data:propose-gemini-ingestion -- std1-2023 --skip-llm
```

The default model is `google/gemini-3.1-flash-lite` through OpenRouter. The command requires
`OPENROUTER_API_KEY` unless `--skip-llm` is used.

Additional model controls:

- `--repair-model <model>` changes the model used for unresolved question repair.
- `--crop-qa-model <model>` changes the model used for per-crop visual QA.
- `--judge-model <model>` sets both repair and crop QA to a stronger judgement model.
- `--skip-repair` and `--skip-crop-qa` disable those downstream passes.
- `--force-repair` and `--force-crop-qa` refresh cached downstream AI judgements without rerunning the page proposals.

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
- `var/gemini-ingestion-proposals/std1-2023/repairs/` - cached targeted AI repair responses
- `var/gemini-ingestion-proposals/std1-2023/visual-crops/` - crop candidates produced from Gemini visual bbox proposals
- `var/gemini-ingestion-proposals/std1-2023/crop-contact-sheets/` - 4x4 labelled crop-sheet overviews and cached per-crop AI QA responses
- `var/gemini-ingestion-proposals/std1-2023/crop-repairs/` - cached targeted AI crop-repair responses
- `var/gemini-ingestion-proposals/std1-2023/report.json` - reconciled machine-readable report
- `var/gemini-ingestion-proposals/std1-2023/report.html` - local report surface with rendered page images, repair results, and crop QA

These outputs are intentionally ignored by git.

For local browser review, publish an ignored copy under `public/`:

```powershell
pnpm run data:publish-gemini-ingestion-report -- std1-2023
```

Then open these pages while `pnpm run dev` is running:

- `http://127.0.0.1:5173/ingestion-reports/std1-2023.html` for diagnostics, repair actions, crop QA, and source-page context.
- `http://127.0.0.1:5173/ingestion-reports/std1-2023-question-preview.html` for a draft corpus preview that groups prompt, options, extracted assets, official answer, and marking-guide working by question.

The publisher copies referenced page/crop images into `public/ingestion-reports/<paperId>-assets/`
and rewrites both pages to use relative image URLs. That generated folder is ignored by git.

## Pipeline Shape

1. Resolve the `paperId` to its source pack and rendered exam/marking-guide documents.
2. Send each rendered exam page to Gemini for question transcription, option extraction, and visual
   asset detection.
3. Send each rendered marking-guide page to Gemini for answer-key, criteria, and sample-answer
   extraction.
4. Parse model JSON permissively enough to preserve useful proposals when Gemini uses nullable fields
   or non-standard visual labels.
5. Apply deterministic notation repairs for common TeX, inline TeX fragments embedded in prose, and currency issues.
6. Reconcile question numbers across exam and marking-guide proposals.
7. Feed unresolved question flags back to the repair model with structured context plus the relevant and adjacent page images.
8. Re-run deterministic notation repair after AI edits and reconcile again.
9. Generate visual crop candidates from Gemini bbox proposals and stitch them into 4x4 labelled contact sheets for overview.
10. Ask the crop QA model to inspect each candidate one by one with the original rendered source page and the proposed crop, requiring the crop to include the whole standalone visual while excluding question prose, page furniture, unrelated diagrams, and excessive blank space.
11. Feed flagged crop candidates back to the model for corrected bbox proposals, rerun per-crop QA after each repair pass, and apply deterministic expansion fallbacks for residual too-tight/blank crops.
12. Flag missing prompt/answer coverage, asset needs, low confidence, raw TeX outside MathJax
    delimiters, and risk-like page notes.
13. Use any remaining unresolved report items as escalation cases before promoting records through the existing importer/corpus path.

## 2023 Standard 1 Trial

The first full new-year trial was run on 2023 Mathematics Standard 1 after adding
`source-std-2023`, `std1-2023`, and `std2-2023` to the source catalog.

Result after the autonomous repair and crop QA loop:

- 38 exam pages processed
- 21 marking-guide pages processed
- 31/31 question skeletons reconciled
- 31/31 questions with prompt proposals
- 31/31 questions with marking-guide answer proposals
- 19 questions identified as needing source assets
- 0 page-level errors
- 0 question-level reconciliation or notation flags after deterministic and AI repair
- 23 crop candidates generated from visual bbox proposals
- 15 final crop QA flags after stricter per-crop source-page comparison

This is a strong enough signal to use Gemini page-image extraction as the default proposal path for
new Standard and Extension years, with deterministic repair and targeted AI repair for text. For
visuals, the latest trial shows that crop QA must be stricter than sheet-level review: per-crop
source-page comparison is now the quality gate, and remaining crop flags should block corpus
promotion until bbox generation or crop repair produces clean standalone assets.
