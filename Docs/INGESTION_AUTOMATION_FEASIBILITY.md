# Ingestion Automation Feasibility

Last reviewed: 2026-06-07

## Current Math Extraction

The official NESA PDFs are not being read as original LaTeX source. The current default extractor in
`scripts/extract-source-text.ts` uses `pdfjs-dist` and calls `page.getTextContent()`, which returns positioned PDF
text items. The older Python extractor uses `pypdf` and has the same basic limitation.

That means the source may contain visible math glyphs, but not the authored TeX commands we want in the app. For
example, the extractor may return separate glyph/text fragments such as `p`, `q`, `tan q`, `75 2 + 75 2`, or
`t ! R`. The importer then applies deterministic cleanup, and profile overrides currently convert damaged fragments
into app-ready MathJax such as `\\(\\pi\\)`, `\\(\\theta\\)`, `\\(75^2+75^2\\)`, or
`\\(t \\in \\mathbb{R}\\)`.

So the current path is:

```text
PDF rendered text glyphs -> raw extracted text -> deterministic cleanup -> profile overrides -> MathJax strings
```

It is not:

```text
PDF embedded LaTeX -> convert delimiter style -> MathJax strings
```

This explains why Standard and Extension papers need many formula-specific overrides even when the PDF appears to
contain clean mathematical notation when viewed normally.

## Remaining Problem

The profile importer is repeatable at the paper level, but high-quality records still need too many question-specific
overrides. The 2025 Standard 1 review showed three recurring causes:

- Mathematical notation is semantic in the rendered page but not preserved as TeX in extracted text.
- Graphs, tables, maps, and diagrams often arrive as vector drawings rather than embedded images.
- Visual prompts can fail source fidelity even when the deterministic audit does not flag them, such as the cake
  graph, biased die net, Q20 park map, and Q22 triangle/circle diagram.

## Feasible Automation Lanes

### 1. Question-Aware Visual Proposals

Status: superseded by the Gemini/Sonnet page-image engine.

`data:inventory-layout` and `data:render-pages` still support source investigation. The previous
layout-based `data:propose-diagram-crops` direction has been removed from the active workflow because
it encouraged deterministic crop proposals that did not understand question semantics.

The active direction is the page-image visual-bbox pass in `data:propose-gemini-ingestion`, which asks
the configured visual model to identify standalone public-site assets and returns full rendered-page
pixel coordinates. The cropper then faithfully executes those coordinates after basic validation and
clamping.

Expected result: fewer paper-specific crop overrides, less manual coordinate selection, and no
parallel deterministic crop proposal path to maintain.

Sources:

- PyMuPDF drawing extraction docs: https://pymupdf.readthedocs.io/en/latest/recipes-drawing-and-graphics.html
- Current project decision: `Docs/DECISIONS.md` entry "Use PyMuPDF for PDF layout inventory"

### 2. Local Math OCR / Document OCR Benchmark

Candidate dependency: Marker.

Marker can convert PDFs/images to Markdown, JSON, HTML, and chunks. Its documentation says `--force_ocr` can be used
when digital text is bad, and that inline math can be converted to LaTeX. This directly targets our `pi/theta/vector`
failure mode.

Candidate dependency: MinerU.

MinerU is a heavier open-source document extraction system designed around layout detection, OCR, formula recognition,
and post-processing. It may be better than Marker for formula-heavy pages, but setup/runtime cost is likely higher.

Expected result: better first-pass `promptLatex` and `answerLatex` proposals, not automatic promotion.

Benchmark before adopting either dependency:

- Run against `std1-2025`, `std1-2024`, `ext1-2024`, and `ext2-2024`, where reviewed corpus output already exists.
- Compare against current reviewed records for question splitting, option splitting, TeX recovery, table handling, and
  visual references.
- Store ignored benchmark output under `var/extraction-benchmarks/`.
- Adopt only if it materially reduces manual overrides without adding unacceptable setup friction.

Sources:

- Marker GitHub: https://github.com/datalab-to/marker
- MinerU paper: https://arxiv.org/abs/2409.18839

### 3. Paid Math OCR for Failing Crops

Candidate service: Mathpix Convert API.

Mathpix supports PDF processing with outputs including Mathpix Markdown, LaTeX zip, DOCX, and line-by-line JSON. Its
current public API pricing lists PDF processing at USD $0.005/page for the first 1M pages/month and image processing
from USD $0.002/image, plus a setup fee.

Expected use: fallback only, not the default pipeline. Send formula-heavy question/page crops after deterministic
extraction and local OCR fail, then cache the result under `var/` with source hashes.

Guardrails:

- process only page ranges or individual crops
- require an explicit environment variable before any paid call
- record estimated and actual page/image counts
- delete remote results where the service supports deletion
- never mark OCR output as verified without source review

Sources:

- Mathpix PDF processing docs: https://docs.mathpix.com/guides/pdf-processing
- Mathpix API pricing: https://website.mathpix.com/pricing/api

### 4. LLM Proposal Pass for Audit Failures

Candidate models: use the existing OpenRouter pattern, with `minimax/minimax-m2.5:nitro` preferred and
`google/gemini-3.1-flash-lite` as fallback, matching the current project decision for generated worked solutions.

The LLM should not be the source of truth. It should receive:

- rendered question crop or page image
- raw `pdfjs` text
- marking-guide block
- any local OCR/Mathpix output
- target JSON schema
- strict instruction to preserve source wording and only normalize formatting/math notation

Expected output:

- proposed `promptLatex`
- proposed `answerLatex`
- proposed `assets[]` labels and alt text
- confidence flags
- `needsReview` reasons

The importer should only consume reviewed proposal files. Direct LLM-to-corpus writes should remain out of scope.

## Recommended Next Prototype

Build a benchmark/proposal layer rather than adding another direct importer:

1. Add `data:benchmark-extraction` to run current `pdfjs` extraction, Marker, and optionally Mathpix on selected
   already-reviewed papers.
2. Add a comparison report against the reviewed corpus with metrics for question split accuracy, formula warnings,
   visual-reference coverage, and manual override count.
3. Use the visual-bbox pass in `data:propose-gemini-ingestion` as the question-aware asset proposal command.
4. Add an optional `data:propose-question-normalization` script that calls MiniMax/Gemini only for audit-failing
   questions and writes ignored proposal JSON.
5. Keep `scripts/additional-maths-profiles.ts` as the durable source of reviewed overrides, but make overrides smaller
   by promoting reviewed proposals into reusable profile fields.

## Benchmark Run - 2026-06-07

The first live benchmark is implemented as:

```powershell
pnpm run data:benchmark-ingestion-methods
```

The script writes raw responses and full local results to ignored `var/ingestion-methodology-benchmark/`, and writes a
reviewable UX to ignored local browser-review output:

- `public/ingestion-reports/ingestion-methodology-benchmark-report.html`
- `public/ingestion-reports/ingestion-methodology-benchmark-results.json`

The benchmark compared five methodology families against the reviewed 2025 Extension 1 and Extension 2 imports:

- marking-guide-first splitting
- PyMuPDF layout visual detection
- whole-exam text plus marking-guide LLM extraction
- page-image LLM question extraction
- page-image LLM visual detection

Models tested through OpenRouter:

- `google/gemini-3.1-flash-lite`
- `google/gemini-2.5-flash-lite`
- `minimax/minimax-m3`
- `qwen/qwen3-vl-8b-instruct`

Observed results:

- Marking-guide-first splitting is strong as the skeleton stage once Section I answer-key rows are combined with
  Section II marking-guide headings. It reached perfect question-number recall and precision on the two reviewed
  Extension papers.
- PyMuPDF layout visual detection is useful as a cheap pre-filter. It reached full visual recall on Extension 2 but
  over-flagged some questions, so it should trigger review/LLM passes rather than decide assets by itself.
- Whole-exam LLM extraction was not reliable enough to replace the importer. Gemini 3.1 Flash Lite returned valid JSON
  cheaply, but only found 10 of 14 Extension 1 questions and missed several visual dependencies. Gemini 2.5 Flash Lite
  returned invalid escaped JSON on the whole-exam prompt, and MiniMax M3 returned non-string content for this JSON-mode
  call.
- Page-image LLM extraction was the strongest automation signal. Gemini 3.1 Flash Lite, Gemini 2.5 Flash Lite, and Qwen
  VL all recovered the expected question numbers and visual dependencies for the tested hard pages, with no obvious TeX
  noise in the parsed outputs.
- Page-image visual detection also performed well on the tested pages. It correctly identified extractable visuals and
  produced approximate bounding boxes, but the boxes should be treated as crop proposals rather than accepted assets.

The benchmark cost recorded by the script for the successful OpenRouter calls was about USD 0.011. Treat this as a
rough comparison figure rather than accounting-grade billing because provider image-token accounting may not map
perfectly to the simple pricing fields exposed in the model catalog.

Updated recommendation: use LLMs as an integrated proposal layer for rendered page images and visual metadata, not just
as a deep fallback. The strongest near-autonomous workflow is:

```text
marking-guide skeleton
raw pdfjs extraction
question/page alignment
PyMuPDF visual pre-filter
LLM page-image transcription for flagged pages
LLM visual metadata and crop-box proposal
human review of proposal JSON/crops
profile promotion and deterministic audit
```

## Gemini Engine Prototype - 2026-06-07

The integrated proposal path is now implemented as:

```powershell
pnpm run data:propose-gemini-ingestion -- <paperId>
```

The command uses `google/gemini-3.1-flash-lite` by default and writes ignored review artifacts under
`var/gemini-ingestion-proposals/<paperId>/`. It processes rendered exam pages and marking-guide pages,
normalises common schema deviations, reconciles question-level prompt and answer coverage, and flags raw
TeX outside MathJax delimiters before any corpus promotion.

The first full new-year trial used 2023 Mathematics Standard 1. After downloading and rendering the 2023
Standard source pack, the engine processed all 38 exam pages and 21 marking-guide pages. It reconciled
31/31 question skeletons with prompt proposals and answer proposals, identified 19 source-asset candidates,
and finished with zero page-level errors after parser tightening. The remaining review queue was 10
questions, mostly due to raw TeX delimiters in option or marking-guide fields.

Updated implementation recommendation: make Gemini page-image proposals the default first-pass ingestion
lane for new Standard and Extension years. Deterministic code should own source resolution, caching,
schema normalisation, reconciliation, math-syntax flags, and final promotion gates.

## Expected Workflow

```text
download PDFs
extract raw text with pdfjs
render pages
inventory layout and vector drawings
generate question candidates and question-aware crop proposals
run local OCR benchmark/proposal where needed
optionally run Mathpix or LLM only for audit failures
review proposal JSON and crops
promote reviewed profile overrides
run validation and ingestion audit
commit reviewed paper
```

## Recommendation

Yes, a more automated pathway is feasible, but it should be a proposal-and-benchmark layer, not a replacement for
reviewed profiles.

The best next step is to benchmark Marker first because it directly targets inline math and runs locally. If Marker
recovers most TeX and table structure on the reviewed 2024/2025 papers, integrate it as an optional extractor. If it
only partially helps, keep it as a signal and use Mathpix or MiniMax/Gemini selectively for audit-failing crops.

Do not remove question-specific overrides. The goal is to shrink them to source-reviewed corrections, asset approvals,
and true paper-specific quirks rather than using them as the main extraction mechanism.
