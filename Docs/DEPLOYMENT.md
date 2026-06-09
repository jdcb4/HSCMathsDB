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
