# GoalCheck HSC

GoalCheck HSC is a browseable question map for NSW HSC Mathematics Advanced and the archived Mathematics 2 Unit course. It stores question records, answers, syllabus links, source URLs, and supporting diagram references in a validated local JSON corpus rendered in a React web interface with MathJax.

The current corpus is not a complete transcription of all NESA papers. Entries marked `transcriptionStatus: "demo"` are placeholders for validating the schema and UI; entries marked `draft` have been promoted from official source material but still need final review before they are treated as verified.

## Current status

- Project scaffold: Vite + React + TypeScript.
- Git repository: not initialised.
- Dependencies: installed with pnpm.
- Package scripts: available in `package.json`.

## Quick start

```powershell
pnpm install
pnpm run dev
```

Run all checks:

```powershell
pnpm run verify
```

Data-specific checks:

```powershell
pnpm run data:validate
pnpm run data:audit-sources
```

## Data

The local corpus lives at `src/data/hsc-math-advanced.json` and is validated on import by Zod schemas in `src/domain/hscSchemas.ts`. It contains both question records and a separate `sourcePacks` catalog for official NSW exam-pack sources that still need transcription. Supporting images and diagrams live under `public/assets/diagrams/`.

## License

Unlicensed pending a project licence decision. Do not publish copied NESA question text or diagrams until usage permissions and attribution requirements are confirmed.
