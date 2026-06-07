# Project Index

The first stop for navigating this project. Keep this file factual: it should describe the project as it exists now, not the project you expect to create later.

## What this project is

GoalCheck HSC is a Vite React TypeScript web app for browsing NSW HSC mathematics question records and source packs by course, year, topic, style, and syllabus content. It currently includes browseable Mathematics Advanced, Mathematics Standard, Mathematics Extension 1, Mathematics Extension 2, and archived Mathematics 2 Unit question records. It supports question-to-syllabus and syllabus-to-question navigation using a validated JSON corpus, with toggleable 2017 and 2024 syllabus views resolved through a multi-course conversion map.

## Current setup state

- App scaffold: Vite + React + TypeScript.
- Git repository: initialised locally.
- Package manager: pnpm.
- Runtime/deployment target: static Vite web app deployed to GitHub Pages from GitHub Actions.

## Important folders

- `src/app` - app shell and Vite entrypoint.
- `src/features` - feature-specific UI for questions, syllabus, and math rendering.
- `src/domain` - Zod schemas and framework-independent selectors.
- `src/services` - validated local data loading.
- `src/data` - local JSON corpus, worked-solution sidecar, and syllabus conversion map.
- `src/styles` - Tailwind entry CSS and design tokens.
- `src/tests` - shared test setup.
- `SyllabusConversion` - separate staging area for building and reviewing syllabus conversion expansions before merging them into app data artifacts.
- `public/assets/diagrams` - static diagram and image assets referenced by the corpus.
- `var/source-assets` - ignored local cache for official PDFs downloaded during import.
- `var/extracted-text` - ignored local text extraction output used during transcription.
- `var/question-candidates` - ignored raw candidate records extracted from source text.
- `var/extracted-images` - ignored embedded-image extraction output used during diagram review.
- `var/layout-inventory` - ignored PDF layout metadata for text blocks, images, and vector drawing clusters.
- `var/rendered-pages` - ignored rendered PDF pages used for vector diagram review.
- `var/diagram-crop-proposals` - ignored proposed crop rectangles generated from layout inventory and rendered pages.
- `var/diagram-crops` - ignored crop candidates produced from rendered PDF pages.
- `Docs` - durable project documentation.

## Commands

| Command                                         | Purpose                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm run dev`                                  | Start the development server.                                                             |
| `pnpm run data:validate`                        | Validate the JSON corpus through the TypeScript Zod schema.                               |
| `pnpm run data:audit-sources`                   | Compare the source catalog with visible official NSW pack titles.                         |
| `pnpm run data:audit-assets`                    | Confirm each cataloged pack exposes exam, marking, and feedback PDFs.                     |
| `pnpm run data:download-sources`                | Download official PDFs into ignored local cache.                                          |
| `pnpm run data:extract-text`                    | Extract raw text from cached PDFs into ignored local output.                              |
| `pnpm run data:ingest-additional-maths`         | Ingest configured Standard/Extension paper profiles into draft question records.          |
| `pnpm run data:promote-2025-additional-maths`   | Promote the 2025 Standard and Extension source text into draft question records.          |
| `pnpm run data:extract-candidates`              | Create ignored raw candidate records from extracted source text.                          |
| `pnpm run data:validate-candidates`             | Validate ignored raw candidate records before review.                                     |
| `pnpm run data:report-candidates`               | Summarize ignored candidate extraction output.                                            |
| `pnpm run data:audit-ingested-exams`            | Audit promoted question records for ingestion-quality regressions.                        |
| `pnpm run data:extract-images`                  | Extract embedded PDF images into ignored local output.                                    |
| `pnpm run data:inventory-layout`                | Inventory cached PDF text, image, and vector drawing layout into ignored JSON.            |
| `pnpm run data:render-pages`                    | Render cached PDF pages into ignored PNG page images.                                     |
| `pnpm run data:propose-diagram-crops`           | Generate reviewable diagram crop proposals from inventory and rendered pages.             |
| `pnpm run data:propose-gemini-ingestion`        | Generate Gemini page-image ingestion proposals and a local review report.                 |
| `pnpm run data:publish-gemini-ingestion-report` | Publish an ignored Gemini ingestion report copy under `public/` for local browser review. |
| `pnpm run data:generate-explanation-samples`    | Generate ignored LLM explanation comparison samples for manual review.                    |
| `pnpm run data:generate-worked-solutions`       | Generate or refresh primary worked-solution sidecar records through OpenRouter.           |
| `pnpm run data:report-worked-solutions`         | Report worked-solution sidecar coverage and model counts.                                 |
| `pnpm run data:report-renders`                  | Summarize ignored page render metadata.                                                   |
| `pnpm run data:crop-render`                     | Crop a rendered PDF page into an ignored diagram candidate.                               |
| `pnpm run typecheck`                            | TypeScript checking.                                                                      |
| `pnpm run lint`                                 | ESLint.                                                                                   |
| `pnpm run format`                               | Prettier check.                                                                           |
| `pnpm test`                                     | Vitest once.                                                                              |
| `pnpm run test:watch`                           | Vitest in watch mode.                                                                     |
| `pnpm run build`                                | Production build.                                                                         |
| `pnpm run build:github-pages`                   | Production build with the `/HSCMathsDB/` base path required by GitHub Pages.              |
| `pnpm run verify`                               | Data validation + typecheck + lint + test + build.                                        |

## Key docs

- [`../AGENTS.md`](../AGENTS.md) - every-turn agent ruleset.
- [`../INITIALISE.md`](../INITIALISE.md) - first setup pass for a fresh folder.
- [`AGENT_REFERENCE.md`](AGENT_REFERENCE.md) - detailed agent reference.
- [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md) - colour, type, and layout token system.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - module boundaries and runtime shape.
- [`VERIFICATION.md`](VERIFICATION.md) - required checks once tooling exists.
- [`VERSIONING.md`](VERSIONING.md) - version rules.
- [`DECISIONS.md`](DECISIONS.md) - durable decisions.
- [`ROADMAP.md`](ROADMAP.md) - future ideas only, not active work.
- [`CHANGELOG.md`](CHANGELOG.md) - notable changes by version.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - deploy instructions once chosen.
- [`IMPORT_WORKFLOW.md`](IMPORT_WORKFLOW.md) - source download, extraction, and transcription workflow.
- [`GEMINI_INGESTION_ENGINE.md`](GEMINI_INGESTION_ENGINE.md) - Gemini page-image proposal engine and review workflow.
- [`LLM_EXPLANATIONS.md`](LLM_EXPLANATIONS.md) - planned LLM workflow for generating reviewed student explanations.
- [`SYLLABUS_CONVERSION.md`](SYLLABUS_CONVERSION.md) - 2017-to-2024 syllabus conversion data and selector contract.
- [`../SECURITY.md`](../SECURITY.md) - security rules.
