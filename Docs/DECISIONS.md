# Decisions

Durable architecture and tooling decisions. Use ADR-lite format: each entry is dated, names the decision, gives the reasoning, and records rejected alternatives.

This file is valid before the project is initialised. The first setup pass should add entries for the chosen stack, package manager, deployment target, persistence model, and any meaningful dependencies.

When adding a new entry, append to the bottom. Do not delete past decisions; supersede them with a new entry that links back.

## Format

```md
## YYYY-MM-DD: <decision title>

**Decision:** <one sentence>

**Reasoning:** <why this won>

**Rejected alternatives:** <what else was considered and why not>

**Supersedes:** <link to a prior decision, if applicable>
```

---

## Pending initial decisions

Record these during setup if they are known:

- Project name and product goal.
- App/runtime shape.
- Package manager.
- Framework(s).
- Test/lint/format tooling.
- Persistence approach.
- Deployment target.

---

## 2026-06-06: Use Vite React TypeScript for the web app

**Decision:** Build GoalCheck HSC as a Vite React TypeScript static web app.

**Reasoning:** The first product surface is an interactive browser for a local corpus, so a static client app keeps setup small while still supporting MathJax rendering, filters, and future static deployment.

**Rejected alternatives:** Next.js was unnecessary without server routes, auth, or dynamic rendering. A backend-first app was deferred until ingestion, search, or editing needs justify it.

**Supersedes:** Not applicable.

## 2026-06-06: Use JSON as the initial question database

**Decision:** Store papers, questions, syllabus nodes, source links, and asset references in `src/data/hsc-math-advanced.json`, validated by Zod on import.

**Reasoning:** JSON is sufficient for the seed corpus and gives a clear schema for future import scripts. It also supports static hosting and deterministic tests before the full corpus is transcribed.

**Rejected alternatives:** SQLite and Postgres were deferred because the current app does not yet need multi-user editing, migrations, relational queries at scale, or server-side search.

**Supersedes:** Not applicable.

## 2026-06-06: Render mathematics with MathJax

**Decision:** Store question and answer text as TeX/LaTeX strings and render them with MathJax through `better-react-mathjax`.

**Reasoning:** TeX is compact, familiar for HSC mathematics, and works well for browser rendering. MathJax preserves a path to richer MathML output if accessibility requirements grow.

**Rejected alternatives:** Raw HTML was rejected because it weakens output safety. Images-only rendering was rejected because it blocks search and syllabus-level reuse.

**Supersedes:** Not applicable.

## 2026-06-06: Keep official-source transcription explicit

**Decision:** Seed records may link to official NESA sources, but full question text and diagrams must be marked with a transcription status and should not be represented as verified until checked against source materials.

**Reasoning:** The user wants past-paper content, but the app needs a reliable import and verification workflow before claiming complete coverage. The current seed examples validate product behaviour without implying all NESA material has been copied.

**Rejected alternatives:** Bulk copying paper text during scaffold was rejected because it would be unverifiable in this setup and may require permission or attribution review.

**Supersedes:** Not applicable.

## 2026-06-06: Add a separate source-pack catalog

**Decision:** Track official NSW exam-pack sources in `sourcePacks` separately from imported `questions`.

**Reasoning:** The final product needs all past questions, answers, syllabus links, and diagrams, but source discovery, transcription, marking-guide extraction, and diagram extraction progress at different rates. A source catalog gives the project an auditable intake checklist without pretending untranscribed papers are already browseable.

**Rejected alternatives:** Representing only imported questions was rejected because it hides missing years. Representing every official pack as fake question rows was rejected because it would pollute search and mislead users.

**Supersedes:** Not applicable.

## 2026-06-06: Use tsx for data utility scripts

**Decision:** Use `tsx` for local validation and source-audit scripts that import TypeScript domain schemas directly.

**Reasoning:** Reusing the app's TypeScript Zod schema avoids maintaining a duplicate JavaScript validation schema for JSON corpus checks.

**Rejected alternatives:** Plain Node scripts were rejected because they would require schema duplication or a build step before data validation.

**Supersedes:** Not applicable.

## 2026-06-06: Keep source caches out of git

**Decision:** Download official PDFs and extracted raw text into ignored `var/` folders rather than committing them.

**Reasoning:** Source PDFs and extracted text are import material, not the normalized app database. Keeping them out of git avoids committing large binaries and avoids publishing unreviewed source transcriptions.

**Rejected alternatives:** Committing raw PDFs was rejected because it would create repository weight and copyright/republication concerns. Extracting directly into question records was rejected because PDF text extraction requires review before records are reliable.

**Supersedes:** Not applicable.

## 2026-06-06: Store generated explanations in a reviewed sidecar

**Decision:** Generate LLM-assisted worked explanations into ignored draft files first, then promote reviewed explanations into a separate validated sidecar keyed by `questionId`.

**Reasoning:** Explanations will be longer and more frequently regenerated than canonical question records. A sidecar preserves stable question data, supports prompt/model/source-hash tracking, and lets the app hide unreviewed or stale generated content.

**Rejected alternatives:** Embedding explanation text directly in each question was rejected because it would bloat core corpus diffs and mix source transcription with generated learning content. Generating explanations in the browser was rejected because it would expose API keys and create nondeterministic end-user behaviour.

**Supersedes:** Not applicable.

## 2026-06-06: Use MiniMax as the preferred worked-solution model

**Decision:** Use `minimax/minimax-m2.5:nitro` as the default OpenRouter model for student-facing worked-solution generation, with `z-ai/glm-4.7:nitro` and `google/gemini-3.1-flash-lite` as fallback/comparison models.

**Reasoning:** In the 12-question comparison, MiniMax outputs were preferred for explanation quality. GLM 4.7 and Gemini were both fast and acceptable, but GLM was materially more expensive, while Gemini was less preferred for answer style. MiniMax was about three times slower but still acceptable for the current bounded corpus size.

**Rejected alternatives:** Making Gemini the default was rejected because lower cost did not outweigh the quality preference. Making GLM the default was rejected because its quality was not clearly better than MiniMax and its observed cost was higher.

**Supersedes:** Not applicable.

## 2026-06-06: Deploy the static app to GitHub Pages

**Decision:** Deploy GoalCheck HSC from the `main` branch to GitHub Pages using a GitHub Actions workflow that builds the Vite app and publishes `dist/`.

**Reasoning:** The app is a static client-side corpus browser with no runtime server, database, auth, or secrets, so GitHub Pages fits the current hosting needs and keeps deployment close to the repository.

**Rejected alternatives:** Branch-based Pages deployment was rejected because Vite needs a build step. Server-backed hosts were deferred until the product needs server-side search, editing workflows, authentication, or managed persistence.

**Supersedes:** Not applicable.
