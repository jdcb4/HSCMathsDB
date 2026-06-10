# Deployment

HSCMathsDB deploys as a static Vite site. The repository supports GitHub Pages and Cloudflare Pages builds from the same source tree.

## GitHub Pages

```powershell
pnpm run build:github-pages
```

The production output is `dist/`. The GitHub Pages build uses Vite base path `/HSCMathsDB/` because the repository is deployed at `https://jdcb4.github.io/HSCMathsDB/`.

Deployment is handled by `.github/workflows/deploy.yml`:

- trigger: push to `main` or manual `workflow_dispatch`
- package manager: pnpm 9.15.0 through Corepack
- Node.js: 22.19.0
- checks before deploy: data validation, typecheck, lint, tests, and GitHub Pages build
- artefact: `dist/`, uploaded with `actions/upload-pages-artifact`
- target environment: `github-pages`, deployed with `actions/deploy-pages`

No runtime environment variables or repository secrets are required for the current static app.

The repository GitHub Pages setting must use **Build and deployment > Source: GitHub Actions**.

## Cloudflare Pages

```powershell
pnpm run build:cloudflare-pages
```

The production output is `dist/`. The Cloudflare Pages build uses Vite base path `/` because Cloudflare Pages serves the site from a domain root or custom domain rather than the GitHub repository subpath.

Recommended Cloudflare Pages project settings:

- repository: `jdcb4/HSCMathsDB`
- production branch: `main`
- framework preset: `React (Vite)`
- root directory: repository root
- build command: `pnpm run build:cloudflare-pages`
- build output directory: `dist`
- Node.js version: `22.19.0`
- pnpm version: `9.15.0`

Cloudflare's Pages build configuration documentation lists React (Vite) output as `dist` and uses a framework build command for the site. Its GitHub integration can connect a Pages project to the repository and automatically deploy branch pushes.

### Feedback Functions

Question feedback is Cloudflare-only. The static GitHub Pages deployment can still serve the app, but `/api/feedback` only works on Cloudflare Pages.

Create the D1 database once:

```powershell
pnpm exec wrangler login
pnpm exec wrangler d1 create hscmathsdb-feedback
```

Apply the schema migration:

```powershell
pnpm exec wrangler d1 migrations apply hscmathsdb-feedback --remote
```

In the Cloudflare Pages project, configure:

- D1 binding: `FEEDBACK_DB` -> `hscmathsdb-feedback`
- secret variable: `FEEDBACK_IP_SALT` -> a long random string

The Pages Function lives at `functions/api/feedback.ts` and handles `POST /api/feedback`. It validates request bodies, rejects cross-origin submissions, hashes the client IP with `FEEDBACK_IP_SALT`, and rate-limits obvious overuse before inserting into D1.

For local Cloudflare-style testing after a build:

```powershell
pnpm run build:cloudflare-pages
pnpm exec wrangler pages dev dist --d1 FEEDBACK_DB=hscmathsdb-feedback --compatibility-date=2026-06-10
```

Feedback review is local and private through Wrangler:

```powershell
pnpm run feedback:list -- --limit 50
pnpm run feedback:list -- --status new
pnpm run feedback:update -- 123 triaged --note "Checked source paper."
pnpm run feedback:export -- --out output/feedback-dashboard.html
```

The scripts default to the remote D1 database `hscmathsdb-feedback`. Use `FEEDBACK_D1_NAME` or `--database <name>` if the database is renamed, and use `--local` for local Wrangler state.

## Local verification before deploy

Run `pnpm run verify`.

To verify the exact Pages build locally, run:

```powershell
pnpm run build:github-pages
```

To verify the exact Cloudflare Pages build locally, run:

```powershell
pnpm run build:cloudflare-pages
```
