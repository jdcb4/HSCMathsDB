# Ingestion Automation Feasibility

Last reviewed: 2026-06-06

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

### 1. Question-Aware Layout and Crop Proposals

Status: partially implemented.

`data:inventory-layout`, `data:render-pages`, and `data:propose-diagram-crops` already use PyMuPDF layout metadata and
rendered pages to produce reviewable crop proposals. PyMuPDF supports extracting vector drawing commands through
`Page.get_drawings()`, which is why it is useful for NESA vector diagrams.

Next improvement: make proposals question-aware. The script should combine:

- the profile's question boundaries and page refs
- text-block keywords such as "shown", "diagram", "graph", "table", "map", "network", "not to scale"
- vector drawing clusters and embedded image blocks on the same page
- existing asset coverage from the corpus

Expected result: fewer manual coordinate choices and fewer missed visuals.

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
3. Extend `data:propose-diagram-crops` into a question-aware asset proposal command.
4. Add an optional `data:propose-question-normalization` script that calls MiniMax/Gemini only for audit-failing
   questions and writes ignored proposal JSON.
5. Keep `scripts/additional-maths-profiles.ts` as the durable source of reviewed overrides, but make overrides smaller
   by promoting reviewed proposals into reusable profile fields.

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
