# Project Index

The first stop for navigating this project. Keep this file factual: it should describe the project as it exists now, not the project you expect to create later.

## What this project is

GoalCheck HSC is a Vite React TypeScript web app for browsing NSW HSC Mathematics Advanced and archived Mathematics 2 Unit question records by year, topic, style, and syllabus content. It supports question-to-syllabus and syllabus-to-question navigation using a validated JSON corpus.

## Current setup state

- App scaffold: Vite + React + TypeScript.
- Git repository: initialised locally.
- Package manager: pnpm.
- Runtime/deployment target: static web app; hosting provider not chosen.

## Important folders

- `src/app` - app shell and Vite entrypoint.
- `src/features` - feature-specific UI for questions, syllabus, and math rendering.
- `src/domain` - Zod schemas and framework-independent selectors.
- `src/services` - validated local data loading.
- `src/data` - local JSON corpus.
- `src/styles` - Tailwind entry CSS and design tokens.
- `src/tests` - shared test setup.
- `public/assets/diagrams` - static diagram and image assets referenced by the corpus.
- `var/source-assets` - ignored local cache for official PDFs downloaded during import.
- `var/extracted-text` - ignored local text extraction output used during transcription.
- `var/question-candidates` - ignored raw candidate records extracted from source text.
- `var/extracted-images` - ignored embedded-image extraction output used during diagram review.
- `var/rendered-pages` - ignored rendered PDF pages used for vector diagram review.
- `var/diagram-crops` - ignored crop candidates produced from rendered PDF pages.
- `Docs` - durable project documentation.

## Commands

| Command                                      | Purpose                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm run dev`                               | Start the development server.                                                     |
| `pnpm run data:validate`                     | Validate the JSON corpus through the TypeScript Zod schema.                       |
| `pnpm run data:audit-sources`                | Compare the source catalog with visible official NSW pack titles.                 |
| `pnpm run data:audit-assets`                 | Confirm each cataloged pack exposes exam, marking, and feedback PDFs.             |
| `pnpm run data:download-sources`             | Download official PDFs into ignored local cache.                                  |
| `pnpm run data:extract-text`                 | Extract raw text from cached PDFs into ignored local output.                      |
| `pnpm run data:extract-candidates`           | Create ignored raw candidate records from extracted source text.                  |
| `pnpm run data:validate-candidates`          | Validate ignored raw candidate records before review.                             |
| `pnpm run data:report-candidates`            | Summarize ignored candidate extraction output.                                    |
| `pnpm run data:extract-images`               | Extract embedded PDF images into ignored local output.                            |
| `pnpm run data:render-pages`                 | Render cached PDF pages into ignored PNG page images.                             |
| `pnpm run data:generate-explanation-samples` | Generate ignored LLM explanation comparison samples for the dev-only review view. |
| `pnpm run data:report-renders`               | Summarize ignored page render metadata.                                           |
| `pnpm run data:crop-render`                  | Crop a rendered PDF page into an ignored diagram candidate.                       |
| `pnpm run typecheck`                         | TypeScript checking.                                                              |
| `pnpm run lint`                              | ESLint.                                                                           |
| `pnpm run format`                            | Prettier check.                                                                   |
| `pnpm test`                                  | Vitest once.                                                                      |
| `pnpm run test:watch`                        | Vitest in watch mode.                                                             |
| `pnpm run build`                             | Production build.                                                                 |
| `pnpm run verify`                            | Data validation + typecheck + lint + test + build.                                |

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
- [`LLM_EXPLANATIONS.md`](LLM_EXPLANATIONS.md) - planned LLM workflow for generating reviewed student explanations.
- [`../SECURITY.md`](../SECURITY.md) - security rules.
