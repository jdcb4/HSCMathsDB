# Ingestion Automation Feasibility

Last reviewed: 2026-06-06

## Problem

The current Standard and Extension importer is repeatable at the paper/profile level, but high-quality records still need many question-specific overrides. The main causes are:

- PDF text extraction does not preserve authored mathematical semantics. Symbols such as `\pi`, `\theta`, vector notation, intervals, binomial coefficients, and inverse trig are frequently flattened into plain glyph fragments.
- Many NESA diagrams are vector drawing content rather than embedded raster images, so simple image extraction misses them.
- Marking-guide headings and footers vary enough that parser errors can merge neighbouring answer blocks unless the heading parser is robust.

## Feasible Automation Lanes

### 1. Deterministic PDF Layout Inventory

Use a PDF layout layer before any LLM/OCR step.

Candidate dependency: PyMuPDF.

Why: PyMuPDF can extract page text, embedded image blocks, and vector drawing paths/bounding boxes. That should let us build a repeatable inventory like:

- page text blocks with bounding boxes
- embedded raster images with bounding boxes
- vector drawing clusters with bounding boxes
- proposed diagram crops near prompts containing "diagram", "shown", "direction field", "graph below", etc.

Expected result: fewer manual crop coordinates. Human review still approves crops, but the script proposes them.

Sources:

- PyMuPDF image extraction docs: https://pymupdf.readthedocs.io/en/latest/recipes-images.html
- PyMuPDF vector drawing extraction docs: https://pymupdf.readthedocs.io/en/latest/recipes-drawing-and-graphics.html

### 2. Local Math OCR / Document OCR Trial

Candidate dependency: Marker.

Why: Marker is open source and can convert PDFs to Markdown/JSON. Its docs specifically note that `--force_ocr` can be used when digital text is garbled and to convert inline math to LaTeX. This directly targets our current `p/q/pi/theta` and vector-glyph failures.

Expected result: better first-pass prompt and marking-guide TeX than `pypdf`/pdfjs text extraction. It may require Python ML dependencies and could be slower on CPU.

Source:

- Marker GitHub: https://github.com/datalab-to/marker

Candidate dependency: MinerU.

Why: MinerU is an open-source document extraction system aimed at layout detection, formula recognition, and document post-processing. It is heavier than a plain PDF library but may be a stronger all-in-one parser for exam pages.

Expected result: useful benchmark against Marker and current extraction. Treat as a trial, not an immediate dependency, because setup/runtime complexity may be higher.

Source:

- MinerU paper: https://arxiv.org/abs/2409.18839

### 3. Paid OCR for Formula-Heavy Crops

Candidate service: Mathpix Convert API.

Why: Mathpix is purpose-built for converting images/PDFs/handwriting to LaTeX/Markdown. Current public pricing advertises pay-as-you-go from USD $0.002/image, which is likely acceptable for occasional formula-heavy fallback use.

Expected result: use selectively on question crops or formula/table crops that fail local OCR/audit, not necessarily on every page.

Source:

- Mathpix pricing: https://mathpix.com/pricing/all

### 4. Programmatic Vision LLM Proposal Pass

Candidate service: OpenAI vision-capable models.

Why: OpenAI vision models can analyze page images, and `gpt-4.1-mini` supports text and image input with low per-token pricing. It is suitable for producing structured draft JSON from a rendered question crop when deterministic extraction is damaged.

Expected result: a script sends one page/question crop plus the raw extracted text and asks for schema-constrained JSON:

- normalized `promptLatex`
- proposed `answerLatex`
- visual references and crop labels
- confidence flags
- "needsReview" reasons

Keep this as proposal generation only. Zod validation, ingestion audit, and human review remain mandatory.

Sources:

- OpenAI vision guide: https://developers.openai.com/api/docs/guides/images-vision
- GPT-4.1 mini model/pricing: https://developers.openai.com/api/docs/models/gpt-4.1-mini

## Recommended Next Prototype

Build a hybrid prototype instead of choosing one tool blindly:

1. Add a script `data:inventory-pdf-layout` using PyMuPDF that writes ignored JSON under `var/layout-inventory/<source-pack-id>/`.
2. For each exam page, record text blocks, image blocks, vector drawing clusters, and rendered page dimensions.
3. Add a script `data:propose-diagram-crops` that uses the inventory and current question boundaries to propose crop rectangles with review metadata.
4. Trial Marker on one already-reviewed paper (`ext1-2024` or `ext2-2024`) and compare its Markdown/JSON against our reviewed corpus.
5. Add an optional LLM proposal script for only the audit-failing questions, not for every question.
6. Extend `data:audit-ingested-exams` with comparison checks: missing diagrams, raw extraction artefacts, suspicious un-delimited math, and answer-block bleed.

## Expected Workflow After Prototype

```text
download PDFs
extract raw text
render pages
inventory layout and vector drawings
generate question candidates
generate crop proposals
run local OCR / Marker proposal
optionally run LLM or Mathpix only for audit failures
promote draft records through profiles
run validation and ingestion audit
human review remaining warnings
commit reviewed paper
```

## Recommendation

Proceed with PyMuPDF layout inventory first. It is the lowest-risk dependency because it improves diagram repeatability without changing the source-of-truth JSON model.

Then run a contained Marker trial against the two reviewed 2024 Extension papers. If Marker recovers most TeX and question structure, integrate it as the default first-pass extractor. If it only partially helps, keep it as an optional signal and use OpenAI/Mathpix for audit-failing crops.

Do not remove profile overrides. Keep them as small, explicit corrections for edge cases, but move most new-paper work toward generated proposals plus audits.
