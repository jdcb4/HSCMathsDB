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
pnpm run data:publish-gemini-ingestion-report -- std1-2023 --output-id std1-2023-crop-mistral-medium-3-5
```

The default model is `google/gemini-3.1-flash-lite` through OpenRouter. The command requires
`OPENROUTER_API_KEY` unless `--skip-llm` is used.

The engine uses bounded parallelism for independent LLM calls:

- Up to 8 rendered exam/marking-guide page proposal calls at once.
- Up to 8 per-crop QA calls at once inside a crop QA pass.
- Up to 6 crop-repair calls at once inside a repair cycle.

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

To compare crop QA/repair models while holding page transcription and marking-guide extraction steady,
publish each variant with a distinct `--output-id`, then build a side-by-side crop comparison page:

```powershell
pnpm run data:publish-crop-model-comparison -- std1-2023-crop-model-comparison "Mistral Medium 3.5=std1-2023-crop-mistral-medium-3-5" "Nemotron 3.5 Safety=std1-2023-crop-nemotron-3-5-content-safety" "Step 3.7 Flash=std1-2023-crop-step-3-7-flash"
```

That writes `public/ingestion-reports/std1-2023-crop-model-comparison.html`. The comparison page reads
the embedded draft-preview data from each published variant, so it can be regenerated without rerunning
the LLM calls.

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
11. Feed flagged crop candidates back to the model for corrected source-page bbox proposals, rerun per-crop QA after each repair pass, and stop after four QA cycles total. A failed crop repair must produce materially changed coordinates; too-tight repairs cannot shrink the crop. If the model returns unchanged coordinates, deterministic expansion can be used inside the same cycle, but no extra hidden fallback passes run after the cap.
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
- 16 final crop QA flags after the capped four-cycle crop QA/recrop loop
- Full fresh run time after bounded parallelism: 141 seconds

This is a strong enough signal to use Gemini page-image extraction as the default proposal path for
new Standard and Extension years, with deterministic repair and targeted AI repair for text. For
visuals, the latest trial shows that crop QA must be stricter than sheet-level review: per-crop
source-page comparison plus capped recropping is now the quality gate, and remaining crop flags
should block corpus promotion until bbox generation or crop repair produces clean standalone assets.

## 2023 Standard 1 Crop Model Comparison

The 2023 Mathematics Standard 1 paper was rerun with `google/gemini-3.1-flash-lite` for page
transcription, marking-guide extraction, and non-crop repair while varying only the crop QA/repair
model. The comparison UX was published at
`public/ingestion-reports/std1-2023-crop-model-comparison.html`.

Observed crop-model results:

- `mistralai/mistral-medium-3-5`: 15 final crop flags after cached replay; fresh variant runtime was about 132 seconds.
- `nvidia/nemotron-3.5-content-safety:free`: 23 final crop flags; fast, but several crop judgements returned provider-side errors or unclear status.
- `stepfun/step-3.7-flash`: 23 final crop flags after cached replay; fresh variant runtime was about 135 seconds.
- `moonshotai/kimi-k2.6`: 23 final crop flags; fresh variant runtime was about 35 minutes, too slow for routine crop repair.
- `xiaomi/mimo-v2.5`: 19 final crop flags; fresh variant runtime was about 6 minutes.

Kimi K2.6 and MiMo v2.5 were dropped from the active comparison because they were too slow for routine
use. Mistral Medium 3.5 produced the best result among the tested crop models, but the residual flags
show that changing the crop model alone is not enough. The next improvement should target bbox proposal
and repair instructions or a deterministic crop-expansion pass, not just stronger crop judgement.

## Crop Coordinate Diagnostics

Use this harness when crop failures look suspiciously consistent across models:

```powershell
pnpm run data:diagnose-crop-coordinates
```

It creates synthetic rendered exam pages under `var/crop-coordinate-diagnostics/`, verifies that the
local cropper maps `{x, y, width, height}` to exact rendered-page pixel crops, then asks Mistral Medium
3.5, Nemotron 3.5 Safety, and Step 3.7 Flash to repair intentionally bad bboxes. The report is
published at `public/ingestion-reports/crop-coordinate-diagnostics.html`.

Latest diagnostic result:

- Deterministic cropper: passed exact pixel-dimension check on an 893 x 1263 synthetic page.
- Mistral Medium 3.5: returned valid pixel bboxes but still shrank inside the target visual, with IoU
  0.7173 on the labelled-prism test and 0.8034 on the credit-table test.
- Nemotron 3.5 Safety: failed both image-input tests with OpenRouter/Nvidia provider errors.
- Step 3.7 Flash: failed the labelled-prism JSON contract and returned a poor credit-table bbox with
  IoU 0.2106.

This indicates the shared crop issues are not caused by a pixel-coordinate translation bug in the local
crop process. The weak point is the model-produced repair bbox, plus deterministic fallback logic that
can repeat the same expansion pattern when multiple models report similar crop QA issues.

## Visual Bbox Prompt Trial

Use this harness to test the standalone visual-identification prompt against fixed pages and models:

```powershell
pnpm run data:trial-visual-bbox-prompt
```

The harness keeps the user's prompt intent but makes two ingestion-safe changes before sending it:

- It adds the rendered source-page image size to the prompt because the response coordinates must be
  full-page pixels.
- It wraps the example response in a top-level JSON object, `{ "visuals": [...] }`, so the output can
  be parsed and validated.

The latest run tested Gemini 3.1 Flash Lite, Mistral Medium 3.5, Nemotron 3.5 Safety, and Step 3.7
Flash on one mock page plus Standard 1 2023 pages 3, 4, and 5. The report is published at
`public/ingestion-reports/visual-bbox-prompt-trial.html`.

Headline result:

- Gemini 3.1 Flash Lite returned parseable results for all four pages and found the real Q8 card
  diagram at a plausible page location.
- Mistral Medium 3.5 returned parseable results but often guessed broad or shifted bboxes.
- Nemotron 3.5 Safety did not produce usable JSON for any page in this trial.
- Step 3.7 Flash was slow, failed one real page, and returned no visual for the Q8 card page.
