# Changelog

Newest entries go at the top.

## 0.55.0 - 2026-06-13

- Ingested the processed exam export from `InputProcessedExams`, replacing overlapping corpus records and expanding coverage to 1065 questions across 43 papers from 2017-2025.
- Added first-class marking criteria records to questions and a collapsible marking-criteria panel in the question detail view.
- Replaced the worked-solution sidecar with the processed 1065-solution corpus and imported 555 reviewed diagram PNGs into `public/assets/diagrams`.
- Added `pnpm run data:ingest-processed-exams` for repeatable processed-export ingestion and updated audits/rendering to handle inline markdown tables and pending visual assets.

## 0.54.0 - 2026-06-10

- Added a Cloudflare Pages feedback endpoint for question quality reports, backed by D1 and basic rate limiting.
- Added a question-level feedback modal that submits issue type, message, optional contact email, and question metadata.
- Added Wrangler-based feedback review scripts for listing reports, updating status, and exporting an HTML dashboard.
- Ignored generated `output/` artifacts.

## 0.53.0 - 2026-06-09

- Added a Cloudflare Pages build target that keeps Vite assets rooted at `/` while retaining the existing GitHub Pages `/HSCMathsDB/` build.
- Documented Cloudflare Pages setup settings for GitHub-connected deployment.
- Ignored `.codex-remote-attachments/` local attachment folders.

## 0.52.0 - 2026-06-09

- Added question selection and a PDF export preview for selected questions.
- Added export options for answers, worked solutions, syllabus links, and inline versus answer-booklet answer placement.
- Added print styling that keeps export question, answer, worked-solution step, diagram, and syllabus-link blocks together where they fit on an A4 page.
- Fixed the PDF export document to use black text on a white background regardless of the active app theme.

## 0.50.2 - 2026-06-08

- Updated the public header copy to introduce HSCMathsDB directly and added an info popup explaining the project status and QA caveat.

## 0.50.1 - 2026-06-08

- Refined the public browsing layout with side-by-side header metrics, a separate collapsible filter panel, always-horizontal question previous/current/next controls, and a collapsed-by-default question list with guidance text.

## 0.50.0 - 2026-06-08

- Simplified the public browsing UX for students by removing developer-facing corpus status, source/syllabus tabs, search, topic filtering, 2 Unit archive course selection, and the visible syllabus-era selector.
- Added compact mobile question-list rendering, top-of-question previous/next navigation, streamlined header metrics, and collapsed-by-default syllabus links.

## 0.49.1 - 2026-06-08

- Render simple LaTeX `tabular` environments as HTML tables before MathJax typesetting, fixing user-facing "Unknown environment 'tabular'" errors in table-based questions and answers.

## 0.49.0 - 2026-06-08

- Renamed the app to HSCMathsDB and added a branded SVG favicon.
- Split runtime corpus data out of the initial app bundle by generating public JSON data files during dev and production builds.
- Added paper-level lazy loading for worked solutions so the full worked-solution sidecar is no longer loaded on startup.
- Added generated WebP diagram assets, WebP-first image rendering with PNG fallback, and lazy/async image loading for question diagrams.
- Deferred the main app and MathJax module loading behind the runtime data bootstrap to reduce the first JavaScript payload.

## 0.48.0 - 2026-06-08

- Backfilled worked-solution drafts for all remaining included corpus questions, bringing coverage to 789/789 records.
- Confirmed the worked-solution math audit reports zero issues after normalization.
- Used Gemini 3.1 Flash Lite as the primary generation model with MiniMax, GLM, and Sonnet fallbacks for syntax-contract failures.

## 0.47.0 - 2026-06-08

- Ingested and promoted the full 2020 modern-course set: Mathematics Advanced, Mathematics Standard 1, Mathematics Standard 2, Mathematics Extension 1, and Mathematics Extension 2.
- Added 128 official draft 2020 question records with 93 exam-derived public diagram assets, all passing `data:audit-ingested-exams -- adv-2020 std1-2020 std2-2020 ext1-2020 ext2-2020` with zero errors and zero warnings.
- Generated worked-solution drafts for all 128 newly promoted 2020 records, using Gemini 3.1 Flash Lite with MiniMax, GLM, and Sonnet fallbacks for syntax-contract failures.
- Tightened the ingestion audit so method-only references such as "using a Venn diagram, or otherwise" are not treated as missing public-site visual assets.

## 0.46.0 - 2026-06-08

- Ingested and promoted the full 2021 modern-course set: Mathematics Advanced, Mathematics Standard 1, Mathematics Standard 2, Mathematics Extension 1, and Mathematics Extension 2.
- Added 135 official draft 2021 question records with 95 exam-derived public diagram assets, all passing `data:audit-ingested-exams -- adv-2021 std1-2021 std2-2021 ext1-2021 ext2-2021` with zero errors and zero warnings.
- Generated worked-solution drafts for all 135 newly promoted 2021 records, using Gemini 3.1 Flash Lite with MiniMax, GLM, and Sonnet fallbacks for syntax-contract failures.
- Normalised multiple-choice option promotion for model outputs that nest display MathJax inside inline MathJax, and manually recovered the missing 2021 Extension 1 Q8 semicircle crop from the rendered exam page.

## 0.45.0 - 2026-06-08

- Ingested and promoted the remaining 2022 modern-course papers: Mathematics Standard 1, Mathematics Standard 2, Mathematics Extension 1, and Mathematics Extension 2.
- Added 100 official draft 2022 question records with 81 exam-derived public diagram assets, all passing `data:audit-ingested-exams -- std1-2022 std2-2022 ext1-2022 ext2-2022` with zero errors and zero warnings.
- Generated worked-solution drafts for all 100 newly promoted 2022 records, using Gemini 3.1 Flash Lite with MiniMax, GLM, and Sonnet fallbacks for syntax-contract failures.
- Hardened Gemini report promotion against raw marking-guide LaTeX artifacts and hardened worked-solution JSON parsing for TeX commands such as `\underline`, `\vec`, `\angle`, `\lambda`, and `\mu`.

## 0.44.0 - 2026-06-08

- Seeded the local 2020-onward source catalog from `SourceExams/`, expanding catalog coverage to 30 papers and 28 source packs.
- Ingested and promoted 2023 Mathematics Extension 2 as 16 official draft question records with 10 Sonnet bbox crop assets.
- Confirmed `data:audit-ingested-exams -- ext2-2023` reports zero errors and zero warnings.

## 0.43.0 - 2026-06-08

- Removed the demo-only 2019 archive seed question and its worked-solution sidecar entry from the production corpus.
- Generalised the Gemini report promoter so new Standard, Advanced, Extension 1, and Extension 2 reports use course-appropriate syllabus nodes instead of the previous Extension 1 2023 hard-code.
- Added a local source-catalog seeding command for paper/source-pack records backed by `SourceExams/`.

## 0.42.0 - 2026-06-08

- Added `SourceExams/` as the canonical local archive for historical HSC mathematics PDFs and switched source caching to sync from that folder instead of downloading from the web.
- Added local source filename parsing, local source coverage reporting, and local source asset auditing for modern and historical artifact types.
- Extended source asset roles to include historical `marking-report` and `sample-answers` artifacts.
- Updated the Gemini ingestion engine to report and render local underscore-named source files without web discovery.
- Documented course-name lineage and the initial 2015-onward ingestion focus.

## 0.41.0 - 2026-06-08

- Rationalised the ingestion workflow around the Gemini/Sonnet page-image proposal engine as the default path for new Standard and Extension papers.
- Added explicit bounded-concurrency controls to source download, text extraction, page rendering, Gemini page/visual proposals, and optional crop QA.
- Removed the orphaned one-off 2025 promotion script and the legacy layout-based deterministic crop proposal command from the active script surface.
- Updated ingestion documentation so retained crop/layout scripts are described as diagnostics rather than normal asset-generation workflow.
- Cleared stale ignored ingestion-report and visual-bbox trial outputs from the local workspace.

## 0.40.0 - 2026-06-08

- Added a repeatable Gemini report promotion command, `pnpm run data:promote-gemini-ingestion -- <paperId>`, which turns a reviewed proposal report into draft corpus records and public exam-derived diagram assets.
- Promoted 2023 Mathematics Extension 1 into the corpus as 14 official draft records with 10 reviewed Sonnet bbox crop assets.
- Updated the 2023 Mathematics Extension 1 source pack to 14 imported questions, complete public asset status, and complete paper source status.
- Confirmed the promoted 2023 Mathematics Extension 1 paper passes `data:validate` and `data:audit-ingested-exams -- ext1-2023` with zero errors and zero warnings.

## 0.39.1 - 2026-06-08

- Tightened the optional crop QA prompt so omitted question text is treated as intentional and not a crop defect.
- Clarified that crop QA should include only text physically part of the visual itself, such as graph labels, table headers, option labels, diagram annotations, or embedded captions.

## 0.39.0 - 2026-06-08

- Switched the Gemini ingestion engine's default visual bbox model to `anthropic/claude-sonnet-4.6` while keeping `google/gemini-3.1-flash-lite` as the default page transcription and marking-guide model.
- Reworked crop generation so public-site crop assets are produced only by faithfully executing model-returned source-page coordinates, with deterministic crop expansion and automatic recropping removed.
- Made the combined crop check/repair pass optional and off by default; when enabled with `--run-crop-qa`, it reports crop quality and proposed replacement bboxes without applying them.
- Reingested and published the 2023 Mathematics Extension 1 preview with 14/14 prompts, 14/14 marking-guide answers, zero page errors, zero question flags, and 10 crop candidates for manual review.
- Updated the report publisher so draft question previews inline crop images and use stable semantic asset filenames, avoiding local browser blocking of generated PNG URLs.

## 0.38.0 - 2026-06-08

- Reran the visual-bbox prompt trial with Gemini 3.1 Pro Preview and GPT-5.5 using the strict 15-second full-request timeout.
- Gemini 3.1 Pro Preview completed all mock and real pages but produced weak mock-page bboxes, with IoU `0.3632` and `0.1642`.
- GPT-5.5 produced very strong mock-page bboxes with IoU `0.9672` and `0.9812`, but timed out on all three real Standard 1 2023 pages under the 15-second cap.

## 0.37.0 - 2026-06-08

- Updated the visual-bbox prompt trial to run Claude Sonnet 4.6, Gemini 3.5 Flash, and GPT-4o mini with all page/model calls executed in parallel and a 15-second timeout per model call.
- Added the related-visuals prompt rule: multiple images for the same question or part should be cropped together when that does not include extraneous material.
- Reran the prompt trial on the mock page and three real Standard 1 2023 visual pages; all three models reported the correct `893 x 1263` source image size, and Claude Sonnet 4.6 produced the strongest mock-page bboxes with IoU `0.9127` and `0.9288`.

## 0.36.0 - 2026-06-08

- Updated the visual-bbox prompt trial schema to require models to report the full source image size they believe they are reviewing.
- Reran the prompt trial with Gemini 3.1 Flash Lite and Mistral Medium 3.5 only; both models reported `893 x 1263` for all mock and real pages, matching the actual rendered PNG dimensions.
- Updated the local comparison UX to show reported-vs-actual image size checks for each model/page result.

## 0.35.0 - 2026-06-08

- Added a repeatable visual-bbox prompt trial harness that runs the standalone crop-discovery prompt across Gemini 3.1 Flash Lite, Mistral Medium 3.5, Nemotron 3.5 Safety, and Step 3.7 Flash.
- Published a local comparison UX at `public/ingestion-reports/visual-bbox-prompt-trial.html` showing source pages, model overlays, crop thumbnails, parsed JSON, and mock-page IoU scores.
- Trialled the prompt on one mock page with known target boxes and three real 2023 Mathematics Standard 1 visual pages: Q4 diagram options, Q5 credit table, and Q8 card diagram.

## 0.34.0 - 2026-06-07

- Added a repeatable crop-coordinate diagnostic harness that generates synthetic exam pages with known target bboxes, verifies the deterministic cropper against exact pixel dimensions, and runs Mistral Medium 3.5, Nemotron 3.5 Safety, and Step 3.7 Flash through the same model-to-crop path.
- Published a local crop-coordinate diagnostics UX at `public/ingestion-reports/crop-coordinate-diagnostics.html` with source-page overlays and measured model bbox errors.
- Rebuilt the active 2023 Mathematics Standard 1 crop-model comparison with Kimi K2.6 and MiMo v2.5 removed because their crop runs were too slow for routine use.

## 0.33.0 - 2026-06-07

- Added distinct `--output-id` publishing for Gemini ingestion reports so multiple model variants for the same paper can be reviewed side by side.
- Added a crop-model comparison publisher and local UX that reads published draft-preview data and compares crop images, crop QA statuses, issues, and repair recommendations across variants.
- Re-ran the 2023 Mathematics Standard 1 crop workflow with Gemini 3.1 Flash Lite held constant for non-crop ingestion and five crop models compared: Mistral Medium 3.5, Nemotron 3.5 Safety, Step 3.7 Flash, Kimi K2.6, and MiMo v2.5. Mistral Medium 3.5 produced the fewest crop flags at 15, while the other variants ranged from 19 to 23 crop flags.

## 0.32.0 - 2026-06-07

- Added 2023 Mathematics Extension 1 source-pack and paper records with official exam, marking-guide, and marking-feedback PDF links.
- Hardened Gemini JSON parsing for raw TeX commands such as `\\underset` and filtered non-positive model question numbers from reconciliation.
- Downloaded, rendered, and ran the Gemini proposal engine on 2023 Mathematics Extension 1: 14/14 prompts, 14/14 answers, zero page errors, 2 question-level notation flags, and 5 final crop flags.

## 0.31.0 - 2026-06-07

- Added bounded parallelism to the Gemini ingestion engine for independent page proposal, crop QA, and crop repair calls while preserving the capped crop QA cycle semantics.
- Reprocessed the 2023 Mathematics Standard 1 paper with the default `google/gemini-3.1-flash-lite` model after deleting generated artifacts; the full run completed in 141 seconds with 31/31 prompts, 31/31 answers, zero question flags, zero page errors, and 16 final crop flags.

## 0.30.0 - 2026-06-07

- Reworked Gemini crop repair into an explicit four-cycle QA loop: initial crop QA, up to three recrops, then final flagging for any crop still failing after pass 4.
- Required failed crop repairs to return materially changed source-page coordinates, blocked too-tight repairs that shrink the crop, and wrote pass-specific crop files so repair history is visible.
- Added deterministic in-cycle recrop fallback when the repair model returns unchanged coordinates, plus additional deterministic cleanup for mixed prose/calculation answer lines and split-page notes.
- Republished the 2023 Mathematics Standard 1 preview from the updated loop; Q15's table and network crops now pass QA, with 17 crop flags remaining elsewhere.

## 0.29.0 - 2026-06-07

- Added cache-busting query strings to published Gemini ingestion report asset URLs so regenerated crop images are not confused with browser-cached copies from earlier runs.

## 0.28.0 - 2026-06-07

- Added a deterministic Gemini ingestion repair for inline TeX fragments embedded in prose, such as degree notation returned outside MathJax delimiters.
- Reprocessed the full 2023 Mathematics Standard 1 paper from fresh Gemini page outputs with the stricter per-crop QA pipeline: 31/31 prompts, 31/31 answers, zero question-level flags, and 15 final crop flags.

## 0.27.0 - 2026-06-07

- Reworked Gemini crop QA to judge each crop one by one against the original rendered source page, with a stricter prompt for standalone public-site assets and cached per-crop QA responses.
- Kept crop contact sheets as overview artifacts only, while final crop status now comes from individual full-page-plus-crop judgements.
- Re-ran and republished the 2023 Mathematics Standard 1 preview; the stricter QA now surfaces 15 final crop-boundary issues inline on the draft question preview instead of incorrectly clearing poor crops.

## 0.26.0 - 2026-06-07

- Extended the Gemini ingestion report publisher to generate a draft corpus preview page for each paper, grouping the proposal into learner-facing question cards with prompts, options, extracted visual assets, official answers, marking-guide working, source refs, and unresolved flags.
- Published the 2023 Mathematics Standard 1 draft preview at `public/ingestion-reports/std1-2023-question-preview.html` for local review through the dev server.

## 0.25.0 - 2026-06-07

- Added a local Gemini ingestion report publisher that writes ignored browser-review copies under `public/ingestion-reports/` with copied relative image assets.
- Added iterative crop auto-repair to the Gemini ingestion engine: flagged crop QA results are fed back for corrected bbox proposals, rechecked after each pass, and residual too-tight/blank crops receive deterministic expansion fallbacks.
- Re-ran the 2023 Mathematics Standard 1 trial: 31/31 question skeletons, prompt proposals, and answer proposals reconcile with zero question-level flags; 23 visual crop candidates now finish with zero final crop QA flags after repair.

## 0.24.0 - 2026-06-07

- Added an autonomous downstream repair loop to the Gemini ingestion engine: deterministic TeX/currency fixes, targeted AI repair with adjacent source-page context, and a final deterministic cleanup pass.
- Added visual crop QA to the Gemini ingestion engine by generating crop candidates from model bbox proposals, stitching them into labelled 4x4 contact sheets, and asking the configured judgement model to flag tight, loose, or wrong-content crops.
- Updated the 2023 Mathematics Standard 1 trial report: 31/31 question skeletons, prompt proposals, and answer proposals reconcile with zero question-level flags after repair; crop QA generated 23 crop candidates and flagged 5 for crop-boundary review.

## 0.23.0 - 2026-06-07

- Added a Gemini 3.1 Flash Lite page-image ingestion proposal engine that transcribes rendered exam pages, extracts marking-guide answers, detects visual assets, reconciles question coverage, and writes ignored review artifacts under `var/gemini-ingestion-proposals/`.
- Added 2023 Mathematics Standard source-pack and paper records as the first new-year trial target for the Gemini-assisted ingestion flow.
- Ran the engine on the full 2023 Mathematics Standard 1 paper and marking guide: 31/31 question skeletons, prompt proposals, and answer proposals reconciled with zero page errors after parser tightening.

## 0.22.1 - 2026-06-07

- Fixed the ingestion-methodology benchmark report so it can load when opened directly from `file://` by embedding the published benchmark data in the HTML.
- Added a render-only benchmark report mode for regenerating the review HTML from existing published results without rerunning LLM experiments.

## 0.22.0 - 2026-06-07

- Added a reusable ingestion-methodology benchmark harness that compares marking-guide-first splitting, PyMuPDF layout visual detection, whole-exam LLM extraction, page-image LLM transcription, and page-image visual detection.
- Published a review UX at `public/ingestion-methodology-benchmark-report.html` with generated comparison results at `public/ingestion-methodology-benchmark-results.json`.
- Ran OpenRouter trials with Gemini 3.1 Flash Lite, Gemini 2.5 Flash Lite, MiniMax M3, and Qwen VL against reviewed 2025 Extension pages and recorded the results in the automation feasibility report.

## 0.21.0 - 2026-06-06

- Added source-reviewed prompt and answer overrides for 2025 Mathematics Extension 1 and Extension 2 Section I and audit-flagged Section II questions.
- Added reviewed exam-derived Extension assets for the Q7 slope field, Q9 vector diagram, Q12 sector, Q13 normal table, Q14 projectile diagram, Q7 unit-circle graph, Q8 velocity/acceleration graph options, Q11 writing-booklet complex plane, and Q16 projectile diagram.
- Refined the ingestion visual-reference audit to avoid false positives for requested sketches and non-visual round-table wording while preserving checks for shown/provided diagrams and data tables.
- Brought the combined 2025 Standard and Extension ingestion audit to zero errors and zero warnings across all 98 Standard/Extension questions.

## 0.20.0 - 2026-06-06

- Added source-reviewed prompt and answer overrides for 2025 Mathematics Standard 2 visual and formula-heavy questions.
- Added reviewed exam-derived visual assets for 2025 Mathematics Standard 2 Questions 1, 2, 3, 8, 17, 18, 19, 20, 22, 23, 26, 28, 31, 32, 34, 35, 36, 37, 38, and 39.
- Brought the combined 2025 Mathematics Standard 1 and Standard 2 ingestion audit to zero errors and zero warnings across all 68 questions.

## 0.19.1 - 2026-06-06

- Documented how current PDF math extraction works and why it produces glyph text rather than reusable TeX.
- Expanded the ingestion automation feasibility plan with a benchmark-first path for Marker, MinerU, Mathpix, and LLM proposal generation.

## 0.19.0 - 2026-06-06

- Added source-reviewed prompt and answer overrides for 2025 Mathematics Standard 1 visual and formula-heavy questions.
- Added reviewed exam-derived visual assets for 2025 Mathematics Standard 1 Questions 3, 5, 6, 7, 14, 15, 19, 20, 22, 26, 27, and 28.
- Brought the 2025 Mathematics Standard 1 ingestion audit to zero errors and zero warnings.

## 0.18.0 - 2026-06-06

- Reingested the 2025 Mathematics Standard 1, Standard 2, Extension 1, and Extension 2 draft records through the reusable profile importer after removing the previous generated records for those papers.
- Generated local layout inventories, rendered pages, and crop proposals for the 2025 Standard and Extension source packs to prepare the next reviewed asset/notation pass.
- Known remaining work: the 2025 ingestion audit still flags missing visual assets and formula-review warnings, so this intermediate checkpoint is not a quality-complete 2025 milestone.

## 0.17.0 - 2026-06-06

- Promoted the 2024 Mathematics Standard 1 and Standard 2 papers through the reusable Standard/Extension profile importer.
- Added reviewed exam-derived visual assets and source-reviewed overrides for the 2024 Standard questions flagged by the ingestion audit.
- Brought the 2024 Standard ingestion audit to zero errors and zero warnings across all 73 questions.

## 0.16.0 - 2026-06-06

- Added a PyMuPDF layout-inventory command that records exam-paper text blocks, embedded image blocks, vector drawing bounds, and drawing clusters into ignored review metadata.
- Added a diagram crop-proposal command that combines layout inventory with rendered page metadata to generate ready-to-run crop commands for candidate visual assets.
- Documented the repeatable layout inventory and crop proposal workflow for future Standard and Extension paper imports.

## 0.15.0 - 2026-06-06

- Added source-reviewed prompt and answer overrides for 2024 Mathematics Extension 1 questions with damaged extracted notation.
- Added reviewed source-derived diagram assets for 2024 Mathematics Extension 1 Questions 2, 11, 12, and 13.
- Refined ingestion visual and pi/theta audits to reduce false positives while preserving checks for missing shown diagrams and raw extracted notation.

## 0.14.0 - 2026-06-06

- Added source-reviewed prompt and answer overrides for 2024 Mathematics Extension 2 questions with damaged extracted notation.
- Added reviewed source-derived diagram assets for 2024 Mathematics Extension 2 Questions 14, 15, and 16.
- Fixed multipart marking-guide heading parsing so sections such as `Question 13 (a) (i)` do not leak into neighbouring answers.
- Tightened the ingestion audit's pi/theta warning rule to avoid false positives from ordinary words such as `distance`.

## 0.13.0 - 2026-06-06

- Added 2024 Mathematics Extension 1 and Extension 2 ingestion profiles and promoted all 30 questions as draft records through the reusable importer.
- Tightened the ingestion audit membership-notation rule to avoid false positives on damaged factorial/perpendicular notation in marking-guide excerpts.
- Corrected the 2024 Mathematics Standard source-pack expected count to 73 questions after source extraction showed Standard 1 has 32 questions and Standard 2 has 41 questions.

## 0.12.0 - 2026-06-06

- Added 2024 Mathematics Standard, Extension 1, and Extension 2 source-pack catalog records and source-linked paper records to prepare repeatable ingestion.
- Aligned the public corpus metadata version with the current package version.

## 0.11.0 - 2026-06-06

- Added a reusable Standard/Extension exam-ingestion core with paper-specific profiles for source files, expected counts, section structure, and explicit PDF text boundaries.
- Replaced the 2025-only promotion command implementation with the reusable profile-driven importer while keeping the old command name as an alias.

## 0.10.0 - 2026-06-06

- Added a deterministic ingestion-quality audit for promoted exam records, covering flattened multiple-choice options, missing visual assets, mojibake, raw membership notation, stray section instructions, and collapsed multipart marking-guide excerpts.
- Documented the audit as a required gate before Standard and Extension reingestion records are considered acceptable.

## 0.9.0 - 2026-06-06

- Promoted 2025 Mathematics Standard 1, Mathematics Standard 2, Mathematics Extension 1, and Mathematics Extension 2 draft question records from official exam and marking-guide PDFs.
- Added displayable 2017 and 2024 syllabus nodes for Mathematics Standard, Extension 1, and Extension 2 so those courses can be browsed and filtered in the app.
- Added PDF text extraction and 2025 additional-mathematics promotion scripts for repeatable source processing.
- Added marking-feedback coverage for the imported 2025 Standard and Extension Section II records.

## 0.8.0 - 2026-06-06

- Added a GitHub Actions workflow that validates, tests, builds, uploads, and deploys the static Vite app to GitHub Pages.
- Added a GitHub Pages build script using the `/HSCMathsDB/` base path.
- Updated public asset rendering so diagram paths resolve correctly when the app is served from the GitHub Pages repository subpath.
- Documented the GitHub Pages deployment target and workflow.

## 0.7.0 - 2026-06-06

- Added first-class course metadata and course-aware filtering/source coverage for Advanced, Standard, Extension 1, Extension 2, and the Mathematics 2 Unit archive.
- Added 2025 Mathematics Standard, Mathematics Extension 1, and Mathematics Extension 2 source-pack and paper records with official exam, marking-guide, and marking-feedback PDF links.
- Updated import coverage reporting to support multi-paper source packs such as Mathematics Standard.

## 0.6.1 - 2026-06-06

- Tightened the worked-solution LLM mathematical syntax contract to require MathJax `\\( ... \\)` / `\\[ ... \\]` delimiters and reject dollar delimiters, raw TeX, plain ASCII maths, nested delimiters, and corrupt TeX fragments.
- Updated the worked-solution generator to prompt with `hsc-explanation-v2`, repair TeX JSON escapes before parsing, and gate generated records with the notation audit before writing.
- Added `data:audit-worked-solution-math` and regenerated/repaired the worked-solution sidecar so all 127 records pass the notation audit.

## 0.6.0 - 2026-06-06

- Added HSC marking-feedback ingestion, validation coverage, and question-detail display cards for better-response and improvement feedback.
- Added part-aware grouping in the question detail view for multipart official working and marking-feedback items.
- Updated the import workflow to require near-verbatim exam prompt replication, marking-guide step preservation, and marking-feedback ingestion by default.

## 0.5.1 - 2026-06-06

- Made the official answer panel collapsible and collapsed by default in the question detail view.

## 0.5.0 - 2026-06-06

- Generalised the syllabus conversion artifact to support multiple mathematics courses.
- Added conversion-only mappings for Mathematics Extension 1, Mathematics Extension 2, and Mathematics Standard 2017-to-2024 syllabuses.
- Added a separate `SyllabusConversion` staging builder and staged additional-course conversion artifact.
- Updated conversion validation so future courses can be mapped before their exam corpora are imported.

## 0.4.0 - 2026-06-06

- Reworked question detail flow so answers appear before collapsed worked solutions, with syllabus links last.
- Renamed the answer section to identify it as the official HSC marking-guide answer.
- Removed the temporary LLM comparison tab from the app.
- Fixed question ordering so question numbers sort numerically within each year.
- Made filter control sizing stable across syllabus views and reduced the syllabus toggle prominence.
- Added display formatting for multipart question prompts such as `(a)` and `(b)`.

## 0.3.1 - 2026-06-06

- Fixed Vite development styling by wiring Tailwind/PostCSS directly into the Vite CSS pipeline.

## 0.3.0 - 2026-06-06

- Added a validated 2017-to-2024 Mathematics Advanced syllabus conversion artifact.
- Added 2024 Mathematics Advanced syllabus nodes to the corpus for future direct question tagging.
- Added selector support for displaying questions under either the native or mapped syllabus era.
- Added a user-facing syllabus-view toggle that shows only one syllabus at a time across filters, syllabus browsing, and question detail links.
- Documented the syllabus conversion architecture and future import contract.

## 0.2.0 - 2026-06-06

- Added primary worked-solution sidecar support with generated/reviewed status metadata and question-detail rendering.
- Added reusable OpenRouter worked-solution generation and reporting scripts.
- Added a dev-only LLM explanation comparison workflow using OpenRouter sample generation for 12 representative questions.
- Added per-model generation timing capture for comparing candidate LLM response speed.
- Added a Vite development review view for comparing worked-solution drafts across candidate models.
- Documented the LLM explanation prompt, output format, sidecar model, generation workflow, and review process.

## 0.1.0 - 2026-06-06

- Completed the 2022 Mathematics Advanced official draft import by promoting Section I Q1-Q10 with answer-key-backed multiple-choice records and exam-derived graph assets.
- Promoted 2022 Mathematics Advanced Q26-Q32 with exam-derived circle, hyperbola, exponential-rectangle, and intercept-triangle assets.
- Promoted 2022 Mathematics Advanced Q21-Q25 with exam-derived annuity-table and actor-character scatterplot assets.
- Promoted 2022 Mathematics Advanced Q16-Q20 with exam-derived enclosed-area and house-of-cards assets.
- Started the 2022 Mathematics Advanced official draft import by preparing the source pack and promoting Q11-Q15 with exam-derived table, graph, and Pareto chart assets.
- Completed the 2023 Mathematics Advanced official draft import by promoting Section I Q1-Q10 with answer-key-backed multiple-choice records and exam-derived assets.
- Promoted 2023 Mathematics Advanced Q26-Q32, completing the current Section II draft import with exam-derived graph assets where needed.
- Promoted 2023 Mathematics Advanced Q21-Q25 with exam-derived prism, normal-table, and garden-path assets.
- Promoted 2023 Mathematics Advanced Q16-Q20 with exam-derived rectangle-arc, regression-grid, and graphing-grid assets.
- Started the 2023 Mathematics Advanced official draft import with Q11-Q15 covering sequences, probability distributions, calculus, and annuity factors.
- Cached, text-extracted, candidate-extracted, and rendered the 2023 Mathematics Advanced source pack to prepare the next official draft import.
- Completed the 2024 Mathematics Advanced official draft import by promoting Q1-Q11 with answer-key-backed multiple-choice records and early-section graph assets.
- Promoted 2024 Mathematics Advanced Q28 and Q31 with exam-derived Ferris wheel and annular-sector diagram assets.
- Promoted 2024 Mathematics Advanced Q21-Q23 with exam-derived scatterplot, shaded-area, and normal-table diagram assets.
- Promoted four 2024 Mathematics Advanced visual draft questions with exam-derived population graph, shaded-region, box-plot, and tower-bearing assets.
- Promoted four additional 2024 Mathematics Advanced draft questions covering exponential capacitor models, quartic sketching, density functions, and present-value withdrawals.
- Promoted six additional diagram-free 2024 Mathematics Advanced draft questions covering calculus, probability, financial mathematics, and graphing.
- Started the 2024 Mathematics Advanced official draft import with Q12 and cached/extracted the 2024 source pack.
- Added compact import coverage reporting and reviewed-crop metadata support for faster future year imports.
- Completed the 2025 Mathematics Advanced official draft import by promoting Q1, Q2, Q4, Q6, Q9, and Q10 with graph assets where needed.
- Promoted 2025 Mathematics Advanced Q29 with an exam-derived mountain height and bearing diagram crop.
- Promoted 2025 Mathematics Advanced Q28 with exam-derived circular-segment and trigonometric graph crops.
- Promoted 2025 Mathematics Advanced Q27 with an exam-derived shaded exponential-region graph crop.
- Promoted 2025 Mathematics Advanced Q25 with an exam-derived `x sin x` region graph crop.
- Promoted 2025 Mathematics Advanced Q24 with an exam-derived common-tangent graph crop.
- Promoted 2025 Mathematics Advanced Q16 with an exam-derived partial graph crop.
- Promoted 2025 Mathematics Advanced Q15 with an exam-derived sound-wave graph crop.
- Promoted 2025 Mathematics Advanced Q11 with an exam-derived quadratic graph crop.
- Promoted four diagram-free 2025 Mathematics Advanced Section I multiple-choice questions and recorded the 2025 source pack's expected 31-question coverage target.
- Promoted six additional 2025 Mathematics Advanced official draft questions covering loans, conditional probability, continuous random variables, normal models, optimisation, and trigonometric solution counts.
- Promoted six more 2025 Mathematics Advanced official draft questions covering calculus, functions, financial mathematics, and trigonometry.
- Corrected the 2025 Q14 syllabus mapping to the marking-guide content code `MA-S2`.
- Promoted 2025 Mathematics Advanced Q14 as the first official draft question record, including its exam-derived scatterplot asset.
- Added a source-pack catalog for official NSW current and archive exam-pack intake status.
- Added data validation and official source-list audit scripts.
- Added source asset discovery, PDF download, and raw text extraction scripts for the import workflow.
- Added raw question-candidate extraction and reporting for cached source packs.
- Added validation for raw question candidates and embedded PDF image extraction metadata.
- Added PDF page rendering and diagram crop candidate tooling for vector exam diagrams.
- Added a Sources view showing import and asset extraction coverage.
- Added the initial Vite React TypeScript scaffold.
- Added Tailwind design tokens and MathJax rendering.
- Added a validated JSON seed corpus for HSC Mathematics Advanced and archive links.
- Added question browsing, filtering, question-to-syllabus links, and syllabus-to-question reverse lookup.
- Added Vitest coverage for corpus validation and selectors.
