# Verification

Run the strongest deterministic checks that exist in the current project before claiming work is complete.

## Standard checks

```powershell
pnpm run data:validate
pnpm run data:audit-sources
pnpm run data:audit-assets
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm test
pnpm run build
pnpm run verify
```

The combined `verify` script runs data validation, typecheck, lint, tests, and build. `format`, `data:audit-sources`, and `data:audit-assets` are separate so formatting and live-source drift checks can be run deliberately.

## Codebase analysis

For significant implementation changes, consider adding Fallow or similar deterministic analysis:

```powershell
pnpm dlx fallow --no-cache --format human
```

If the tool is unavailable or not yet configured, record that it was skipped and perform a local code-quality review before final verification.

## Optional deeper checks

When investigating dead code, duplication, or unused dependencies, use tools appropriate to the project once dependencies exist, for example:

```powershell
pnpm dlx ts-prune
pnpm dlx knip
pnpm dlx jscpd .
```

These may report false positives for framework entrypoints, plugin-loaded files, generated files, and runtime-only dependencies. Document false positives near the relevant config or in this file.

## Environment

Node.js 22.19.0 and pnpm 9.15.0 were used during initial setup.
