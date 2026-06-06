# Deployment

Deployment hosting is not chosen yet. The app currently builds as a static Vite site.

## Current build artefact

```powershell
pnpm run build
```

The production output is `dist/`. No runtime environment variables are required for the current static app.

## When hosting is chosen

Document:

- hosting provider or runtime
- build command
- output directory or deploy artefact
- required environment variables
- secrets management approach
- preview deployment process, if any
- production deployment process
- rollback process, if any
- verification command before deploy

## Local verification before deploy

Run `pnpm run verify`.
