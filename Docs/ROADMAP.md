# Roadmap

Future ideas only. Roadmap entries are not action items.

Do not implement anything from this list unless the user explicitly asks for that feature or moves it into an active plan.

When the user mentions a future idea that is out of scope for the current task, add it here rather than implementing it opportunistically.

## Ideas

> Add ideas as bulleted entries. Keep each one short. Link to a discussion or issue if one exists.

### Source coverage and reusable data

- Ingest and display formula sheets by course and year, and surface the relevant formula sheet alongside questions where students would have had access to it.
  - Current assumption: display the original official PDF formula sheets rather than extracted or rewritten formula content.
  - Before active work: define how a question records which formula sheet version applies; confirm how to handle shared formula sheets across courses; decide whether PDF pages need thumbnails, page anchors, or download-only links.
  - Suggested shape: add formula-sheet metadata to the source catalog first, then expose it through question selectors so UI work does not hard-code course/year rules.
- Ingest past papers from earlier syllabus versions where they are useful for practice, while clearly labelling syllabus era, course name, and mapping confidence.
  - Current assumption: 1995 is the practical earliest target year based on currently visible source availability.
  - Before active work: analyse how substantial the syllabus changes were across eras; define which retired courses are in scope; decide whether questions without reliable syllabus mapping are allowed; decide how strongly to separate historical questions from current-syllabus browsing.
  - Suggested browsing default: prioritise the current and immediately previous syllabus eras first, with older archival material visible only through deliberate filtering until mapping confidence is better understood.
  - Suggested shape: treat earlier-syllabus papers as archival source packs with explicit compatibility metadata instead of forcing them into current syllabus structures.
- Publish the raw question/source data somewhere easy to download, together with a schema document so other people can reuse the corpus.
  - Current assumption: GitHub is the preferred publication channel, with the exact release, repository, or static-file arrangement to be considered later.
  - Before active work: decide the licence, precise hosting location, versioning scheme, file format, citation/source attribution requirements, and whether generated sidecar data is included.
  - Suggested shape: publish validated JSON artifacts plus a human-readable schema guide generated from the same Zod contracts used by the app.
- Abstract the ingestion and browsing process so it can be reused for other HSC courses.
  - Current assumption: mathematics remains the focus until the data model and ingestion workflow are stable.
  - Before active work: identify which parts are genuinely mathematics-specific, which metadata fields are common to all courses, and what evidence would justify starting a non-maths pilot.
  - Suggested shape: extract course-neutral source-pack, paper, question, syllabus, and asset concepts only after the maths workflow is stable enough to show repeated patterns.

### Student practice and feedback

- Allow students to attempt a question and receive AI marking feedback, including support for written mathematical working where practical.
  - Current assumption: feedback should estimate likely marks as well as comment on correctness, missing working, and missed concepts.
  - Before active work: decide whether attempts are text-only, image upload, stylus/tablet writing, or a combination; define privacy expectations; decide how mark estimates are calibrated against official marking guidance; require clear disclaimers and reviewed marking rubrics.
  - Suggested shape: start with opt-in local attempt capture and rubric-based feedback on selected questions before adding account storage, handwriting recognition, tablet-first notation workflows, or broad AI marking coverage.
