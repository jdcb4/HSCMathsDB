import { ExternalLink, Flag, Image as ImageIcon } from "lucide-react";
import { type SyntheticEvent, useState } from "react";
import type { Paper, Question, SyllabusNode, WorkedSolution } from "../../domain/hscSchemas";
import { MathText } from "../math/MathText";
import { QuestionFeedbackDialog } from "./QuestionFeedbackDialog";
import { resolvePublicAssetPath, resolvePublicWebpAssetPath } from "./questionAssetPaths";
import { formatMultipartQuestionPrompt } from "./questionPromptFormatting";

type DetailPanelKey = "officialAnswer" | "markingFeedback" | "markingCriteria" | "workedSolution";

type DetailPanelState = Record<DetailPanelKey, boolean> & {
  questionId: string;
};

const closedDetailPanels = {
  officialAnswer: false,
  markingFeedback: false,
  markingCriteria: false,
  workedSolution: false
} satisfies Record<DetailPanelKey, boolean>;

export function QuestionDetail({
  question,
  paper,
  workedSolution,
  workedSolutionLoading = false,
  workedSolutionError,
  syllabusNodes,
  syllabusViewLabel,
  appVersion,
  onRequestWorkedSolution
}: {
  question: Question;
  paper?: Paper;
  workedSolution?: WorkedSolution;
  workedSolutionLoading?: boolean;
  workedSolutionError?: string;
  syllabusNodes: SyllabusNode[];
  syllabusViewLabel: string;
  appVersion: string;
  onRequestWorkedSolution: () => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [panelState, setPanelState] = useState<DetailPanelState>({
    questionId: question.id,
    ...closedDetailPanels
  });
  const openPanels =
    panelState.questionId === question.id
      ? panelState
      : {
          questionId: question.id,
          ...closedDetailPanels
        };
  const groupedWorkingSteps = groupItemsByQuestionPart(question.workingLatex);
  const groupedBetterFeedback = groupItemsByQuestionPart(question.markingFeedback?.betterResponses ?? []);
  const groupedImprovementFeedback = groupItemsByQuestionPart(
    question.markingFeedback?.improvementAreas ?? []
  );
  const displayableAssets = question.assets.filter((asset) => asset.sourceStatus !== "pending");
  const handlePanelToggle = (panel: DetailPanelKey) => (event: SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = event.currentTarget.open;
    if (panel === "workedSolution" && isOpen) {
      onRequestWorkedSolution();
    }

    setPanelState((current) => {
      const base =
        current.questionId === question.id
          ? current
          : {
              questionId: question.id,
              ...closedDetailPanels
            };

      return {
        ...base,
        [panel]: isOpen
      };
    });
  };

  return (
    <article className="space-y-4 rounded-md border border-border-default bg-surface-raised p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-caption font-medium text-text-subtle">
            <span>{question.year}</span>
            <span>{paper?.courseName ?? "Mathematics"}</span>
            <span>{question.questionNumber}</span>
            <span>{question.marks} marks</span>
            <span>{question.style}</span>
          </div>
          <h2 className="mt-2 text-h2 font-semibold">{question.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
          >
            <Flag size={16} />
            Report issue
          </button>
          <a
            href={question.source.examPackUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
          >
            <ExternalLink size={16} />
            Exam pack
          </a>
        </div>
      </div>

      <section className="rounded-md border border-border-subtle bg-surface-sunken p-4">
        <h3 className="mb-3 text-h4 font-semibold">Question</h3>
        <div className="text-body text-text-primary">
          <MathText block>{formatMultipartQuestionPrompt(question.promptLatex)}</MathText>
        </div>
        {displayableAssets.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {displayableAssets.map((asset) => {
              const webpPath = resolvePublicWebpAssetPath(asset.path);

              return (
                <figure
                  key={asset.id}
                  className="rounded-md border border-border-default bg-surface-raised p-3"
                >
                  <picture>
                    {webpPath ? <source srcSet={webpPath} type="image/webp" /> : null}
                    <img
                      src={resolvePublicAssetPath(asset.path)}
                      alt={asset.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-auto w-full rounded-sm"
                    />
                  </picture>
                  <figcaption className="mt-2 flex items-center gap-2 text-caption text-text-secondary">
                    <ImageIcon size={14} />
                    {asset.label}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : null}
      </section>

      <details
        open={openPanels.officialAnswer}
        onToggle={handlePanelToggle("officialAnswer")}
        className="rounded-md border border-border-subtle bg-surface-sunken p-4"
      >
        <summary className="cursor-pointer text-h4 font-semibold text-text-primary">
          Answer (Official HSC marking guide)
        </summary>
        <div className="mt-4 text-body text-text-primary">
          <MathText block>{question.answerLatex}</MathText>
        </div>
        {question.workingLatex.length > 0 ? (
          <div className="mt-4">
            <GroupedMathItems
              groups={groupedWorkingSteps}
              itemKind="ordered"
              keyPrefix={`${question.id}-step`}
            />
          </div>
        ) : null}
      </details>

      {question.markingFeedback ? (
        <details
          open={openPanels.markingFeedback}
          onToggle={handlePanelToggle("markingFeedback")}
          className="rounded-md border border-border-subtle bg-surface-sunken p-4"
        >
          <summary className="cursor-pointer text-h4 font-semibold text-text-primary">
            HSC Marking Feedback
          </summary>
          <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="sr-only">HSC Marking Feedback</h3>
            <span className="text-caption text-text-subtle">{question.markingFeedback.sourceRef}</span>
          </div>
          <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
            <div className="min-w-0 rounded-md border border-border-subtle bg-surface-raised p-3">
              <h4 className="mb-2 text-body-sm font-semibold">In better responses, students were able to</h4>
              {question.markingFeedback.betterResponses.length > 0 ? (
                <GroupedMathItems
                  groups={groupedBetterFeedback}
                  itemKind="unordered"
                  keyPrefix={`${question.id}-better-feedback`}
                />
              ) : (
                <p className="text-body-sm text-text-secondary">No better-response feedback recorded.</p>
              )}
            </div>
            <div className="min-w-0 rounded-md border border-border-subtle bg-surface-raised p-3">
              <h4 className="mb-2 text-body-sm font-semibold">Areas for students to improve include</h4>
              {question.markingFeedback.improvementAreas.length > 0 ? (
                <GroupedMathItems
                  groups={groupedImprovementFeedback}
                  itemKind="unordered"
                  keyPrefix={`${question.id}-improvement-feedback`}
                />
              ) : (
                <p className="text-body-sm text-text-secondary">No improvement feedback recorded.</p>
              )}
            </div>
          </div>
        </details>
      ) : null}

      {question.markingCriteria && question.markingCriteria.criteria.length > 0 ? (
        <details
          open={openPanels.markingCriteria}
          onToggle={handlePanelToggle("markingCriteria")}
          className="rounded-md border border-border-subtle bg-surface-sunken p-4"
        >
          <summary className="cursor-pointer text-h4 font-semibold text-text-primary">
            Marking Criteria
          </summary>
          <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="sr-only">Marking Criteria</h3>
            <span className="text-caption text-text-subtle">{question.markingCriteria.sourceRef}</span>
            {question.markingCriteria.guidePages.length > 0 ? (
              <span className="text-caption text-text-subtle">
                Guide pages {formatPageList(question.markingCriteria.guidePages)}
              </span>
            ) : null}
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-surface-raised">
            <table className="w-full border-collapse text-left text-body-sm">
              <thead className="bg-surface-sunken text-caption uppercase text-text-subtle">
                <tr>
                  <th className="border-b border-border-subtle px-3 py-2 font-semibold">Part</th>
                  <th className="border-b border-border-subtle px-3 py-2 font-semibold">Marks</th>
                  <th className="border-b border-border-subtle px-3 py-2 font-semibold">Criterion</th>
                </tr>
              </thead>
              <tbody>
                {question.markingCriteria.criteria.map((criterion, index) => (
                  <tr
                    key={`${question.id}-criteria-${index}`}
                    className="border-b border-border-subtle last:border-b-0"
                  >
                    <td className="w-20 px-3 py-2 text-text-secondary">
                      {criterion.part ? `(${criterion.part})` : "Whole"}
                    </td>
                    <td className="w-20 px-3 py-2 text-text-secondary">{criterion.marks}</td>
                    <td className="px-3 py-2 text-text-primary">
                      <MathText block>{criterion.criterion}</MathText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      <details
        open={openPanels.workedSolution}
        onToggle={handlePanelToggle("workedSolution")}
        className="rounded-md border border-border-subtle bg-surface-sunken p-4"
      >
        <summary className="cursor-pointer text-h4 font-semibold text-text-primary">Worked Solution</summary>
        <div className="mt-4 space-y-4">
          {workedSolutionLoading ? (
            <p className="rounded-md border border-border-subtle bg-surface-raised p-3 text-body-sm text-text-secondary">
              Loading worked solution...
            </p>
          ) : null}
          {workedSolutionError ? (
            <p className="rounded-md border border-accent-danger bg-surface-raised p-3 text-body-sm text-text-secondary">
              {workedSolutionError}
            </p>
          ) : null}
          {!workedSolution && !workedSolutionLoading && !workedSolutionError ? (
            <p className="rounded-md border border-border-subtle bg-surface-raised p-3 text-body-sm text-text-secondary">
              Open this panel to load the worked solution.
            </p>
          ) : null}
          {workedSolution ? (
            <>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-caption text-text-secondary">Generated with {workedSolution.model}</p>
                </div>
                <span className="inline-flex w-fit rounded-md border border-border-default px-2 py-1 text-caption font-medium text-text-secondary">
                  {workedSolution.reviewStatus}
                </span>
              </div>

              {workedSolution.needsReview ? (
                <div className="rounded-md border border-accent-warning bg-surface-raised p-3 text-body-sm text-text-secondary">
                  {workedSolution.reviewNote}
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="rounded-md border border-border-subtle bg-surface-raised p-3">
                  <h4 className="mb-2 text-body-sm font-semibold">Idea</h4>
                  <MathText block>{workedSolution.summaryLatex}</MathText>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-raised p-3">
                  <h4 className="mb-2 text-body-sm font-semibold">How to start</h4>
                  <MathText block>{workedSolution.approachLatex}</MathText>
                </div>
              </div>

              <section className="rounded-md border border-border-subtle bg-surface-raised p-3">
                <h4 className="mb-3 text-body-sm font-semibold">Steps</h4>
                <ol className="space-y-3">
                  {workedSolution.steps.map((step, index) => (
                    <li
                      key={`${workedSolution.questionId}-worked-step-${index}`}
                      className="rounded-md border border-border-subtle bg-surface-sunken p-3"
                    >
                      <p className="mb-2 text-body-sm font-semibold">
                        Step {index + 1}: {step.title}
                      </p>
                      <MathText block>{step.bodyLatex}</MathText>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="rounded-md border border-border-subtle bg-surface-raised p-3">
                <h4 className="mb-2 text-body-sm font-semibold">Final answer</h4>
                <MathText block>{workedSolution.finalAnswerLatex}</MathText>
              </div>

              {workedSolution.commonMistakesLatex.length > 0 ? (
                <div className="rounded-md border border-border-subtle bg-surface-raised p-3">
                  <h4 className="mb-2 text-body-sm font-semibold">Common mistakes</h4>
                  <ul className="space-y-2 text-body-sm text-text-secondary">
                    {workedSolution.commonMistakesLatex.map((mistake, index) => (
                      <li key={`${workedSolution.questionId}-mistake-${index}`}>
                        <MathText block>{mistake}</MathText>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {workedSolution.checkLatex ? (
                <div className="rounded-md border border-border-subtle bg-surface-raised p-3">
                  <h4 className="mb-2 text-body-sm font-semibold">Quick check</h4>
                  <MathText block>{workedSolution.checkLatex}</MathText>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </details>

      <details className="rounded-md border border-border-subtle bg-surface-sunken p-4">
        <summary className="cursor-pointer text-h4 font-semibold text-text-primary">
          {syllabusViewLabel} links
        </summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {syllabusNodes.map((node) => (
            <div
              key={node.id}
              className="w-full rounded-md border border-border-default bg-surface-raised p-3 text-left"
            >
              <p className="text-caption font-semibold uppercase text-accent-info">{node.code}</p>
              <p className="text-body-sm font-medium">{node.title}</p>
              <p className="mt-1 text-caption text-text-secondary">{node.topic}</p>
            </div>
          ))}
          {syllabusNodes.length === 0 ? (
            <p className="text-body-sm text-text-secondary">No mapped syllabus link.</p>
          ) : null}
        </div>
      </details>

      <footer className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
        <span>Transcription: {question.source.transcriptionStatus}</span>
        {question.source.pageRef ? <span>Paper: {question.source.pageRef}</span> : null}
        {question.source.markingGuideRef ? <span>Guide: {question.source.markingGuideRef}</span> : null}
      </footer>
      <QuestionFeedbackDialog
        open={feedbackOpen}
        question={question}
        paper={paper}
        appVersion={appVersion}
        onClose={() => setFeedbackOpen(false)}
      />
    </article>
  );
}

type PartGroup = {
  label: string;
  items: string[];
  isPartSpecific: boolean;
};

function GroupedMathItems({
  groups,
  itemKind,
  keyPrefix
}: {
  groups: PartGroup[];
  itemKind: "ordered" | "unordered";
  keyPrefix: string;
}) {
  const hasPartGroups = groups.some((group) => group.isPartSpecific);

  if (!hasPartGroups) {
    const List = itemKind === "ordered" ? "ol" : "ul";
    return (
      <List className="space-y-2 text-body-sm text-text-secondary">
        {groups
          .flatMap((group) => group.items)
          .map((item, index) => (
            <li
              key={`${keyPrefix}-${index}`}
              className={
                itemKind === "ordered"
                  ? "min-w-0 break-words rounded-md border border-border-subtle bg-surface-raised p-3"
                  : "min-w-0 break-words"
              }
            >
              <MathText block>{item}</MathText>
            </li>
          ))}
      </List>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => {
        const List = itemKind === "ordered" ? "ol" : "ul";

        return (
          <section
            key={`${keyPrefix}-group-${groupIndex}`}
            className="min-w-0 overflow-hidden rounded-md border border-border-subtle bg-surface-raised p-3"
          >
            <h5 className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
              {group.label}
            </h5>
            <List className="space-y-2 text-body-sm text-text-secondary">
              {group.items.map((item, itemIndex) => (
                <li key={`${keyPrefix}-${groupIndex}-${itemIndex}`} className="min-w-0 break-words">
                  <MathText block>{item}</MathText>
                </li>
              ))}
            </List>
          </section>
        );
      })}
    </div>
  );
}

function groupItemsByQuestionPart(items: string[]): PartGroup[] {
  const groups: PartGroup[] = [];

  items.forEach((item) => {
    const parsed = parsePartPrefix(item);
    const label = parsed.part ? `Part (${parsed.part})` : "Whole question";
    let group = groups.find((candidate) => candidate.label === label);

    if (!group) {
      group = {
        label,
        items: [],
        isPartSpecific: Boolean(parsed.part)
      };
      groups.push(group);
    }

    group.items.push(parsed.text);
  });

  return groups;
}

function parsePartPrefix(item: string): { part?: string; text: string } {
  const parenthesisedPrefix = /^\(([a-z])\)\s+(.+)$/i.exec(item);
  if (parenthesisedPrefix) {
    return { part: parenthesisedPrefix[1].toLowerCase(), text: parenthesisedPrefix[2] };
  }

  const prosePrefix = /^For part \(([a-z])\),?\s+(.+)$/i.exec(item);
  if (prosePrefix) {
    return { part: prosePrefix[1].toLowerCase(), text: prosePrefix[2] };
  }

  const headingPrefix = /^Part \(([a-z])\):?\s+(.+)$/i.exec(item);
  if (headingPrefix) {
    return { part: headingPrefix[1].toLowerCase(), text: headingPrefix[2] };
  }

  return { text: item };
}

function formatPageList(pages: number[]): string {
  return [...new Set(pages)].sort((left, right) => left - right).join(", ");
}
