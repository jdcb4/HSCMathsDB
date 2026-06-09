# GoalCheck HSC

GoalCheck HSC is a browseable question map for NSW HSC mathematics courses. It stores question records, answers, syllabus links, source URLs, and supporting diagram references in a validated local JSON corpus rendered in a React web interface with MathJax.

The current corpus is not a complete transcription of all NESA papers. Entries marked `transcriptionStatus: "demo"` are placeholders for validating the schema and UI; entries marked `draft` have been promoted from official source material but still need final review before they are treated as verified.

## Current status

- Project scaffold: Vite + React + TypeScript.
- Git repository: initialised and connected to `jdcb4/HSCMathsDB`.
- Dependencies: installed with pnpm.
- Package scripts: available in `package.json`.
- Deployment: GitHub Pages through GitHub Actions, with a Cloudflare Pages build target.

## Quick start

```powershell
pnpm install
pnpm run dev
```

Run all checks:

```powershell
pnpm run verify
```

Build the GitHub Pages artefact:

```powershell
pnpm run build:github-pages
```

Build the Cloudflare Pages artefact:

```powershell
pnpm run build:cloudflare-pages
```

Data-specific checks:

```powershell
pnpm run data:validate
pnpm run data:audit-sources
```

## Data

The local corpus lives at `src/data/hsc-math-advanced.json` and is validated on import by Zod schemas in `src/domain/hscSchemas.ts`. It contains course metadata, question records, and a separate `sourcePacks` catalog for official NSW exam-pack sources. The current browseable question corpus includes Mathematics Advanced, 2025 Mathematics Standard, 2025 Mathematics Extension 1, 2025 Mathematics Extension 2, and a Mathematics 2 Unit archive seed. Supporting images and diagrams live under `public/assets/diagrams/`.

## License

Unlicensed pending a project licence decision. Do not publish copied NESA question text or diagrams until usage permissions and attribution requirements are confirmed.
