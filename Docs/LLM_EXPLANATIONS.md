# LLM Explanation Pipeline

This document describes how to generate student-facing worked explanations after the question and answer extraction pass is complete.

## Goal

Use an LLM to turn each reviewed question record and marking-guide answer into a clear explanation for a Year 12 student. The explanation should show how to approach the problem, not just state the final answer.

Generated explanations are learning content, not source transcriptions. They must be validated structurally and reviewed mathematically before they are shown as final content.

## Recommended shape

Keep explanations in a separate validated sidecar file:

```text
src/data/hsc-math-advanced.json
src/data/hsc-math-advanced-explanations.json
```

The sidecar should be keyed by `questionId` instead of embedded in each question. This keeps the core corpus smaller and makes regeneration, review, and prompt-version tracking easier.

Add a domain schema alongside `QuestionSchema`, for example:

```ts
export const ExplanationStepSchema = z.object({
  title: z.string().min(1),
  bodyLatex: z.string().min(1)
});

export const QuestionExplanationSchema = z.object({
  questionId: z.string().min(1),
  promptVersion: z.string().min(1),
  model: z.string().min(1),
  generatedAt: z.string().datetime(),
  sourceQuestionHash: z.string().min(1),
  reviewStatus: z.enum(["draft", "reviewed", "rejected"]),
  summaryLatex: z.string().min(1),
  approachLatex: z.string().min(1),
  steps: z.array(ExplanationStepSchema).min(2),
  finalAnswerLatex: z.string().min(1),
  commonMistakesLatex: z.array(z.string().min(1)).default([]),
  checkLatex: z.string().min(1).optional()
});
```

Then load both files in `src/services/hscDatabase.ts` and expose explanations through selectors:

- `getExplanationForQuestion(questionId)`
- `getQuestionsMissingExplanations(database, explanations)`
- `getExplanationCoverage(database, explanations)`

The app should display only explanations with `reviewStatus: "reviewed"` unless an explicit internal review mode is added.

## Generation input

Send one normalized question at a time. Do not send whole papers, full PDFs, source pages, or unrelated candidate text.

Each request should include:

- Stable question metadata: `id`, `year`, `courseName`, `questionNumber`, `marks`, `style`.
- The reviewed `promptLatex`.
- The current `answerLatex` and `workingLatex`.
- Linked syllabus node codes, titles, and content.
- Asset labels and alt text, not image files, unless a later vision workflow is deliberately added.
- Source refs such as paper page and marking-guide page for traceability.

Do not send secrets, local file paths, raw PDF caches, or unreviewed candidate text. Candidate text can be used during internal import work, but the explanation-generation script should operate from the normalized, validated corpus.

## Prompt

Use a pinned prompt version such as `hsc-explanation-v1`. Keep temperature low and require JSON only.

```text
You are writing a worked explanation for a NSW HSC Mathematics Advanced student aged 17-18.

Your job is to explain how to get from the question to the answer. Be clearer and more helpful than a marking guide, but do not add syllabus content that is not needed for this question.

Audience:
- A capable Year 12 student revising the topic.
- They know the syllabus basics but may not see the key move immediately.

Style rules:
- Use Australian English.
- Be direct and calm.
- Explain the decision points: why this method is appropriate, what to notice first, and how each algebraic/probability/calculus step follows.
- Use TeX for all mathematical notation.
- Keep each step focused. Do not write a textbook chapter.
- Do not mention the marking guide, NESA, the prompt, JSON, or that you are an AI.
- Do not invent alternative answers.
- If a diagram is referenced, use only the supplied diagram description.
- If the supplied answer appears mathematically wrong or incomplete, set "needsReview" to true and explain the concern in "reviewNote".

Return valid JSON only, matching this shape:
{
  "needsReview": false,
  "reviewNote": "",
  "summaryLatex": "1-2 sentences naming the main idea.",
  "approachLatex": "What to notice first and why the method works.",
  "steps": [
    {
      "title": "Short step title",
      "bodyLatex": "Detailed student-facing explanation with TeX."
    }
  ],
  "finalAnswerLatex": "The final answer, stated cleanly.",
  "commonMistakesLatex": [
    "A likely mistake and how to avoid it."
  ],
  "checkLatex": "Optional quick check or sanity check."
}

Question input:
<QUESTION_JSON>
```

The script should replace `<QUESTION_JSON>` with compact JSON:

```json
{
  "id": "adv-2025-q14-bivariate-data",
  "year": 2025,
  "courseName": "Mathematics Advanced",
  "questionNumber": "Question 14",
  "marks": 4,
  "style": "short-answer",
  "topic": "Statistical analysis",
  "subtopic": "Bivariate data",
  "syllabus": [
    {
      "code": "MA-S2",
      "title": "Bivariate data analysis",
      "content": "Model, analyse and interpret bivariate numerical data using scatterplots, correlation and least-squares regression."
    }
  ],
  "promptLatex": "...",
  "answerLatex": "...",
  "workingLatex": ["..."],
  "assets": [
    {
      "label": "Scatterplot",
      "alt": "Scatterplot showing ..."
    }
  ],
  "source": {
    "pageRef": "Exam paper page 12",
    "markingGuideRef": "Marking guidelines pages 6-7"
  }
}
```

## Response validation

Validate every model response with Zod before writing it anywhere durable.

Minimum validation rules:

- JSON parses cleanly.
- Required fields are non-empty.
- `steps.length >= 2`.
- No unexpected top-level fields unless the schema deliberately allows them.
- `finalAnswerLatex` is consistent with `answerLatex` by human review or a later deterministic check where practical.
- `needsReview: true` responses are stored for review but not promoted to the public sidecar.

Keep raw model responses in ignored local output:

```text
var/llm-explanations/raw/
var/llm-explanations/drafts/
var/llm-explanations/rejected/
```

Promote generated records into `src/data/hsc-math-advanced-worked-solutions.json`. Records generated by the preferred model can be displayed in the app with `reviewStatus: "generated"`; records that have been manually checked can later be moved to `reviewStatus: "reviewed"`.

## OpenRouter integration

Use a local script, not browser runtime calls, so the API key never reaches end users.

Suggested script:

```text
scripts/generate-worked-solutions.ts
```

Environment:

```powershell
$env:OPENROUTER_API_KEY="..."
pnpm run data:generate-worked-solutions -- --model minimax/minimax-m2.5:nitro --limit 20
```

Add a small env parser in the script or a shared `src/config/env.ts` only if runtime configuration grows. Do not commit `.env` files.

OpenRouter uses an OpenAI-compatible chat-completions style API, so the script can call a selected model by name. The preferred model order after the 12-question comparison is:

- `minimax/minimax-m2.5:nitro` - best observed answer quality, about 3x slower than the fast models, still acceptable for bounded corpus runs.
- `z-ai/glm-4.7:nitro` - comparable speed to Gemini and generally strong answers, but observed as significantly more expensive than the other candidates.
- `google/gemini-3.1-flash-lite` - fast and low cost, acceptable answers, but less preferred than MiniMax and GLM in the sample review.

The script should accept flags:

- `--model <id>`
- `--question <questionId>`
- `--paper <paperId>`
- `--limit <n>`
- `--concurrency <n>`
- `--dry-run`
- `--prompt-version <version>`
- `--force`
- `--no-import-samples`

Use low temperature, for example `0.2`, and set a maximum token budget per question. If provider-side JSON schema response formatting is available for the chosen model, use it; otherwise enforce JSON through the prompt and local validation.

## Efficiency

Use batching at the script level, but keep each LLM request to one question. This gives better isolation, easier retries, and fewer unusable batch responses.

Recommended approach:

1. Load and validate the corpus.
2. Load existing explanation drafts and reviewed sidecar records.
3. Compute a `sourceQuestionHash` from the fields sent to the model.
4. Skip questions that already have an explanation for the same `promptVersion`, `model`, and `sourceQuestionHash`.
5. Queue only missing or stale questions.
6. Run limited parallel requests, starting at concurrency `3`.
7. Retry transient failures with exponential backoff.
8. Write each valid draft immediately so a long run can resume.
9. Produce a coverage report at the end.

This avoids resending the same content and keeps failures local to a single question.

## Review workflow

The generation pipeline should remain draft-first:

1. Generate drafts into `var/llm-explanations/drafts/`.
2. Run structural validation.
3. Review mathematical correctness and tone.
4. Promote reviewed explanations into the public sidecar file.
5. Run `pnpm run data:validate`, `pnpm run typecheck`, `pnpm test`, and `pnpm run build`.

Add a reporting command once the sidecar exists:

```powershell
pnpm run data:report-explanations
```

The current command is:

```powershell
pnpm run data:report-worked-solutions
```

The report should show:

- total questions
- reviewed explanations
- draft explanations
- stale explanations where `sourceQuestionHash` no longer matches
- explanations needing review
- missing explanations by paper

## Comparison samples

Use the sample workflow to compare candidate models before committing to the production explanation pipeline:

```powershell
pnpm run data:generate-explanation-samples
```

The script uses `OPENROUTER_API_KEY` from `.env` or the shell environment, calls the configured OpenRouter models, records per-response generation time, and writes ignored output to:

```text
var/llm-explanation-samples/samples.json
var/llm-explanation-samples/raw/
```

Generated sample drafts are ignored local artifacts and are not part of the production build. Review the JSON output directly when comparing candidate models.

## End-user display

In `QuestionDetail`, show a new section below the current answer panel:

- Heading: `Explanation`
- A compact summary.
- `How to think about it` using `approachLatex`.
- Numbered worked steps.
- `Common mistakes` when present.
- `Quick check` when present.

Use `MathText` for all TeX fields. Keep the existing `Answer` section because it is useful for fast checking; the explanation section is for learning.

For unreviewed or missing explanations, show nothing to ordinary users. During an internal review mode, show a small status such as `Explanation draft needs review`, but do not expose draft generated text as final learning content.

## Failure modes

- If the model flags `needsReview`, do not auto-promote the explanation.
- If JSON validation fails, store the raw response under `var/llm-explanations/rejected/` with the parse error.
- If a question has pending assets or draft transcription, the explanation may be generated but should remain draft until the question itself is verified enough for publication.
- If an explanation becomes stale after prompt or answer edits, hide it until regenerated or reviewed.
