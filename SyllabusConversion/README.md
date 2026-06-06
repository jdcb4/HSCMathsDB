# Syllabus Conversion Staging

This folder is the isolated staging area for syllabus conversion work before it is merged into app artifacts.

## Current Contents

- `build-additional-maths-conversions.mjs` builds the additional Mathematics Extension 1, Mathematics Extension 2, and Mathematics Standard conversion courses.
- `additional-maths-course-conversions.json` is the staged output for those three courses only.
- `sources/` contains locally downloaded official 2017 syllabus DOCX files used while extracting old syllabus topic structures.

## Merge Target

The merged app artifact is:

```text
src/data/syllabus-conversion.json
```

That file now contains `courses[]` for Mathematics Advanced, Extension 1, Extension 2, and Standard. The current app UX still displays Mathematics Advanced only because no Extension 1, Extension 2, or Standard exams have been imported yet.

## Rebuild

```powershell
node SyllabusConversion\build-additional-maths-conversions.mjs
pnpm run data:validate
```

The builder preserves the existing Mathematics Advanced course mapping and appends the staged additional-course mappings.
