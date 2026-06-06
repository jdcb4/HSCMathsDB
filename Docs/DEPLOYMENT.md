# Deployment

GoalCheck HSC deploys as a static Vite site to GitHub Pages from the `main` branch.

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

## Local verification before deploy

Run `pnpm run verify`.

To verify the exact Pages build locally, run:

```powershell
pnpm run build:github-pages
```
