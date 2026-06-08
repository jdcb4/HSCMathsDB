# Gemini Ingestion Engine

The Gemini ingestion engine is the proposal layer for near-autonomous exam intake. It does not write
directly to the canonical corpus. It reads rendered official PDF pages, asks Gemini 3.1 Flash Lite for
structured page proposals, reconciles exam-page and marking-guide output, and writes review artifacts
under ignored `var/` paths.

## Command

```powershell
pnpm run data:propose-gemini-ingestion -- std1-2023
pnpm run data:publish-gemini-ingestion-report -- std1-2023
pnpm run data:promote-gemini-ingestion -- std1-2023
```

Useful scoped runs:

```powershell
pnpm run data:propose-gemini-ingestion -- std1-2023 --pages 2-6 --guide-pages 1-4
pnpm run data:propose-gemini-ingestion -- std1-2023 --force
pnpm run data:propose-gemini-ingestion -- std1-2023 --page-concurrency 10
pnpm run data:propose-gemini-ingestion -- std1-2023 --judge-model <openrouter-model-id>
pnpm run data:propose-gemini-ingestion -- std1-2023 --skip-llm
pnpm run data:publish-gemini-ingestion-report -- std1-2023 --output-id std1-2023-crop-mistral-medium-3-5
```

The default page transcription and marking-guide model is `google/gemini-3.1-flash-lite` through
OpenRouter. The default visual bbox model is `anthropic/claude-sonnet-4.6`. The command requires
`OPENROUTER_API_KEY` unless `--skip-llm` is used.

The engine uses bounded parallelism for independent LLM calls:

- Up to 8 rendered exam/marking-guide page proposal calls at once by default.
- Up to 8 standalone visual-bbox calls at once by default.
- Up to 8 per-crop QA calls at once inside a crop QA pass by default.

Additional model controls:

- `--repair-model <model>` changes the model used for unresolved question repair.
- `--visual-model <model>` changes the model used for standalone visual bbox discovery.
- `--crop-qa-model <model>` changes the model used for optional per-crop visual QA.
- `--judge-model <model>` sets both repair and crop QA to a stronger judgement model.
- `--page-concurrency <n>` changes the bounded concurrency for exam-page, marking-guide-page, and visual-bbox proposal calls.
- `--crop-qa-concurrency <n>` changes the bounded concurrency for optional per-crop QA calls.
- `--skip-repair` disables question-text repair.
- `--run-crop-qa` enables optional combined crop check/repair judgement. Crop QA is off by default.
- `--force-repair` and `--force-crop-qa` refresh cached downstream AI judgements without rerunning the page proposals.

## Prerequisites

The source pack must exist in `src/data/hsc-math-advanced.json`, the official PDFs must be cached, and
the relevant pages must be rendered:

```powershell
pnpm run data:download-sources -- source-std-2023
pnpm run data:render-pages -- source-std-2023 --all-documents --scale 1.5 --concurrency 3
```

## Outputs

For `std1-2023`, the engine writes:

- `var/gemini-ingestion-proposals/std1-2023/raw/` - cached OpenRouter responses
- `var/gemini-ingestion-proposals/std1-2023/visual-bbox-raw/` - cached standalone visual bbox responses
- `var/gemini-ingestion-proposals/std1-2023/parsed/` - parsed page proposals
- `var/gemini-ingestion-proposals/std1-2023/repairs/` - cached targeted AI repair responses
- `var/gemini-ingestion-proposals/std1-2023/visual-crops/` - crop candidates produced by executing model visual bbox proposals
- `var/gemini-ingestion-proposals/std1-2023/crop-contact-sheets/` - 4x4 labelled crop-sheet overviews and optional cached per-crop AI QA responses
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
and rewrites report pages to use stable relative image URLs. The draft question preview also inlines
crop images so local browser extensions cannot block the review surface. Generated report folders are
ignored by git.

After the preview is reviewed and accepted, promote the report into the corpus:

```powershell
pnpm run data:promote-gemini-ingestion -- std1-2023
```

The promoter copies accepted crop candidates into `public/assets/diagrams/`, removes any existing
question records for the paper, writes draft corpus records from the reviewed report, and updates the
paper/source-pack import counters.

To compare crop QA/repair models while holding page transcription and marking-guide extraction steady,
publish each variant with a distinct `--output-id`, then build a side-by-side crop comparison page:

```powershell
pnpm run data:publish-crop-model-comparison -- std1-2023-crop-model-comparison "Mistral Medium 3.5=std1-2023-crop-mistral-medium-3-5" "Nemotron 3.5 Safety=std1-2023-crop-nemotron-3-5-content-safety" "Step 3.7 Flash=std1-2023-crop-step-3-7-flash"
```

That writes `public/ingestion-reports/std1-2023-crop-model-comparison.html`. The comparison page reads
the embedded draft-preview data from each published variant, so it can be regenerated without rerunning
the LLM calls. This is a diagnostic helper, not part of the default ingestion flow. Remove generated
`public/ingestion-reports/` output after the comparison is no longer under active review.

## Pipeline Shape

1. Resolve the `paperId` to its source pack and rendered exam/marking-guide documents.
2. Send each rendered exam page to Gemini for question transcription and option extraction. The page
   proposal intentionally leaves visual bboxes empty.
3. Send each rendered marking-guide page to Gemini for answer-key, criteria, and sample-answer
   extraction.
4. Send each rendered exam page to the visual bbox model with the standalone visual-identification
   prompt trialled in `data:trial-visual-bbox-prompt`.
5. Parse model JSON permissively enough to preserve useful proposals when models use nullable fields
   or non-standard visual labels.
6. Apply deterministic notation repairs for common TeX, inline TeX fragments embedded in prose, and currency issues.
7. Reconcile question numbers across exam and marking-guide proposals.
8. Feed unresolved question flags back to the repair model with structured context plus the relevant and adjacent page images.
9. Re-run deterministic notation repair after AI edits and reconcile again.
10. Generate visual crop candidates by clamping model bbox coordinates to the rendered source-page bounds and cropping exactly those coordinates. There is no deterministic crop expansion or automatic recropping.
11. Stitch generated crops into 4x4 labelled contact sheets for overview.
12. If `--run-crop-qa` is enabled, ask the crop QA model to inspect each candidate one by one with the original rendered source page and the proposed crop. The combined crop check/repair prompt may return `goodCrop: false` plus a proposed replacement bbox, but the workflow does not apply that bbox while crop QA is optional/manual-review mode.
13. Flag missing prompt/answer coverage, asset needs, low confidence, raw TeX outside MathJax
    delimiters, and risk-like page notes.
14. Use any remaining unresolved report items as escalation cases before promoting records through the existing importer/corpus path.

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
visuals, later model trials led to the current approach: use the strongest prompt-tested visual bbox
model for first-pass coordinates, crop exactly those coordinates, and manually review the resulting
assets before promotion while optional crop QA remains disabled.

## 2023 Extension 1 Sonnet Bbox Trial

The 2023 Mathematics Extension 1 paper was rerun after switching the default visual bbox model to
`anthropic/claude-sonnet-4.6` and disabling automatic crop QA/repair by default.

Result:

- 20 exam pages processed
- 25 marking-guide pages processed
- 14/14 question skeletons reconciled
- 14/14 questions with prompt proposals
- 14/14 questions with marking-guide answer proposals
- 8 questions identified as needing source assets
- 0 page-level errors
- 0 question-level reconciliation or notation flags after deterministic and AI repair
- 10 crop candidates generated from Sonnet visual bbox proposals
- The reviewed proposal was promoted to 14 draft corpus records with 10 public exam-derived assets
- `pnpm run data:audit-ingested-exams -- ext1-2023` reports zero errors and zero warnings

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
showed that changing the crop model alone was not enough. Later prompt trials shifted the workflow
toward standalone bbox proposal quality rather than deterministic post-processing.

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
crop process. The weak point was model-produced bbox quality, so the active workflow now avoids
deterministic expansion and crops only the coordinates returned by the visual bbox model.

## Visual Bbox Prompt Trial

Use this harness to test the standalone visual-identification prompt against fixed pages and models:

```powershell
pnpm run data:trial-visual-bbox-prompt
pnpm run data:trial-visual-bbox-prompt -- --models "anthropic/claude-sonnet-4.6,google/gemini-3.1-flash-lite" --timeout-ms 15000 --output-id sonnet-gemini-smoke
```

The harness keeps the user's prompt intent but makes these ingestion-safe changes before sending it:

- It adds the rendered source-page image size to the prompt because the response coordinates must be
  full-page pixels.
- It requires the model to return the full source image size it believes it is reviewing as
  `imageSize`.
- It asks the model to group multiple related visuals for the same question or question part into one
  crop when doing so does not include extraneous material.
- It wraps the example response in a top-level JSON object, `{ "imageSize": ..., "visuals": [...] }`,
  so the output can be parsed and validated.

The default run tests Sonnet 4.6 and Gemini 3.1 Flash Lite on one mock page plus Standard 1 2023 pages
3, 4, and 5. Use `--models`, `--timeout-ms`, and `--output-id` to run future comparisons without
editing the script. Calls are run in parallel with a strict timeout around the full model request and
JSON body read. The report is published at
`public/ingestion-reports/visual-bbox-prompt-trial.html`.

Historical headline result from the 2026-06-08 GPT-5.5/Gemini Pro trial:

- Both models reported `893 x 1263` for every completed page, matching the actual rendered PNG
  dimensions.
- Gemini 3.1 Pro Preview completed all pages but was weak on the mock targets, with IoU `0.3632` for
  the prism and `0.1642` for the table.
- GPT-5.5 was excellent on the mock targets, with IoU `0.9672` and `0.9812`, but timed out on all
  three real Standard 1 2023 pages under the 15-second cap.
