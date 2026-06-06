import { useMemo, useState } from "react";
import { ArrowLeftRight, BookOpen, Database, FileText, Filter, Link as LinkIcon, Search } from "lucide-react";
import { LlmExplanationReview } from "../features/dev/LlmExplanationReview";
import { QuestionDetail } from "../features/questions/QuestionDetail";
import { QuestionList } from "../features/questions/QuestionList";
import { SourceCatalog } from "../features/sources/SourceCatalog";
import { SyllabusBrowser } from "../features/syllabus/SyllabusBrowser";
import {
  getDatasetSummary,
  getFilterOptions,
  getLinkedSyllabusNodes,
  getQuestionsForSyllabusNode,
  getSourcePackCoverage,
  queryQuestions
} from "../domain/hscSelectors";
import { database } from "../services/hscDatabase";
import type { QuestionStyle } from "../domain/hscSchemas";

type ViewMode = "questions" | "syllabus" | "sources" | "llm-review";

type Filters = {
  search: string;
  year: string;
  topic: string;
  style: string;
  syllabusNodeId: string;
};

const defaultFilters: Filters = {
  search: "",
  year: "all",
  topic: "all",
  style: "all",
  syllabusNodeId: "all"
};

const showDevViews = import.meta.env.DEV;

export function App() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedQuestionId, setSelectedQuestionId] = useState(database.questions[0]?.id ?? "");
  const [selectedSyllabusNodeId, setSelectedSyllabusNodeId] = useState(database.syllabus[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>("questions");

  const options = useMemo(() => getFilterOptions(database), []);
  const summary = useMemo(() => getDatasetSummary(database), []);
  const sourcePacks = useMemo(() => getSourcePackCoverage(database), []);

  const filteredQuestions = useMemo(
    () =>
      queryQuestions(database, {
        search: filters.search,
        year: filters.year === "all" ? undefined : Number(filters.year),
        topic: filters.topic === "all" ? undefined : filters.topic,
        style: filters.style === "all" ? undefined : (filters.style as QuestionStyle),
        syllabusNodeId: filters.syllabusNodeId === "all" ? undefined : filters.syllabusNodeId
      }),
    [filters]
  );

  const selectedQuestion = useMemo(
    () => database.questions.find((question) => question.id === selectedQuestionId) ?? filteredQuestions[0],
    [filteredQuestions, selectedQuestionId]
  );

  const selectedQuestionSyllabus = selectedQuestion ? getLinkedSyllabusNodes(database, selectedQuestion) : [];
  const selectedSyllabusNode =
    database.syllabus.find((node) => node.id === selectedSyllabusNodeId) ?? database.syllabus[0];
  const syllabusQuestions = selectedSyllabusNode
    ? getQuestionsForSyllabusNode(database, selectedSyllabusNode.id)
    : [];

  const setFilter = (name: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const openSyllabusNode = (nodeId: string) => {
    setSelectedSyllabusNodeId(nodeId);
    setViewMode("syllabus");
  };

  const openQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setViewMode("questions");
  };

  return (
    <div className="min-h-dvh bg-surface-base text-text-primary">
      <header className="border-b border-border-subtle bg-surface-raised">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-caption font-semibold uppercase text-accent-info">GoalCheck HSC</p>
              <h1 className="text-h1 font-semibold">Mathematics question map</h1>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric icon={<FileText size={17} />} label="Questions" value={summary.questionCount} />
              <Metric icon={<BookOpen size={17} />} label="Syllabus" value={summary.syllabusNodeCount} />
              <Metric icon={<Database size={17} />} label="Sources" value={summary.sourcePackCount} />
              <Metric icon={<LinkIcon size={17} />} label="Links" value={summary.linkCount} />
            </div>
          </div>
          <div className="rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-body-sm text-text-secondary">
            Corpus status: {summary.transcriptionCounts.demo} demo, {summary.transcriptionCounts.draft} draft,{" "}
            {summary.transcriptionCounts.verified} verified questions. Full official-paper transcription and
            diagram extraction are tracked in the source catalog.
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-caption font-medium text-text-secondary">
              Search
              <span className="flex items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary focus-within:shadow-focus">
                <Search size={17} className="shrink-0 text-text-subtle" />
                <input
                  value={filters.search}
                  onChange={(event) => setFilter("search", event.target.value)}
                  className="w-full bg-transparent outline-none"
                  aria-label="Search questions"
                />
              </span>
            </label>
            <FilterSelect label="Year" value={filters.year} onChange={(value) => setFilter("year", value)}>
              <option value="all">All years</option>
              {options.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Topic" value={filters.topic} onChange={(value) => setFilter("topic", value)}>
              <option value="all">All topics</option>
              {options.topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Style" value={filters.style} onChange={(value) => setFilter("style", value)}>
              <option value="all">All styles</option>
              {options.styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Syllabus"
              value={filters.syllabusNodeId}
              onChange={(value) => setFilter("syllabusNodeId", value)}
            >
              <option value="all">All content</option>
              {database.syllabus.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.code} {node.title}
                </option>
              ))}
            </FilterSelect>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <div className="flex rounded-md border border-border-default bg-surface-raised p-1">
            <ModeButton
              active={viewMode === "questions"}
              icon={<FileText size={17} />}
              onClick={() => setViewMode("questions")}
            >
              Questions
            </ModeButton>
            <ModeButton
              active={viewMode === "syllabus"}
              icon={<BookOpen size={17} />}
              onClick={() => setViewMode("syllabus")}
            >
              Syllabus
            </ModeButton>
            <ModeButton
              active={viewMode === "sources"}
              icon={<Database size={17} />}
              onClick={() => setViewMode("sources")}
            >
              Sources
            </ModeButton>
            {showDevViews ? (
              <ModeButton
                active={viewMode === "llm-review"}
                icon={<Database size={17} />}
                onClick={() => setViewMode("llm-review")}
              >
                LLM review
              </ModeButton>
            ) : null}
          </div>
          {viewMode === "questions" ? (
            <QuestionList
              questions={filteredQuestions}
              selectedQuestionId={selectedQuestion?.id ?? ""}
              onSelectQuestion={setSelectedQuestionId}
            />
          ) : viewMode === "syllabus" ? (
            <SyllabusBrowser
              nodes={database.syllabus}
              selectedNodeId={selectedSyllabusNode?.id ?? ""}
              questionCountsByNode={summary.questionCountsBySyllabusNode}
              onSelectNode={setSelectedSyllabusNodeId}
            />
          ) : viewMode === "llm-review" && showDevViews ? (
            <div className="rounded-md border border-border-default bg-surface-raised p-4">
              <p className="text-caption font-semibold uppercase text-accent-info">Dev</p>
              <h2 className="mt-1 text-h4 font-semibold">LLM explanation review</h2>
              <p className="mt-2 text-body-sm text-text-secondary">
                Compare generated worked solutions for the sample question set.
              </p>
            </div>
          ) : (
            <SourceCatalog packs={sourcePacks} />
          )}
        </aside>

        <section className="min-w-0">
          {viewMode === "llm-review" && showDevViews ? (
            <LlmExplanationReview />
          ) : viewMode === "questions" && selectedQuestion ? (
            <QuestionDetail
              question={selectedQuestion}
              paper={database.papers.find((paper) => paper.id === selectedQuestion.paperId)}
              syllabusNodes={selectedQuestionSyllabus}
              onOpenSyllabusNode={openSyllabusNode}
            />
          ) : viewMode === "syllabus" && selectedSyllabusNode ? (
            <div className="space-y-4 rounded-md border border-border-default bg-surface-raised p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-caption font-semibold uppercase text-accent-info">
                    {selectedSyllabusNode.code}
                  </p>
                  <h2 className="text-h2 font-semibold">{selectedSyllabusNode.title}</h2>
                  <p className="mt-2 max-w-3xl text-body text-text-secondary">
                    {selectedSyllabusNode.content}
                  </p>
                </div>
                <a
                  href={selectedSyllabusNode.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
                >
                  <LinkIcon size={16} />
                  Source
                </a>
              </div>
              <div className="grid gap-3">
                {syllabusQuestions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => openQuestion(question.id)}
                    className="rounded-md border border-border-default bg-surface-sunken p-4 text-left hover:border-accent-info"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-caption text-text-subtle">
                      <span>{question.year}</span>
                      <span>{question.questionNumber}</span>
                      <span>{question.style}</span>
                    </div>
                    <p className="mt-1 text-body font-medium">{question.title}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-md border border-border-default bg-surface-raised p-5">
              <div>
                <p className="text-caption font-semibold uppercase text-accent-info">Import coverage</p>
                <h2 className="text-h2 font-semibold">Official source catalog</h2>
                <p className="mt-2 max-w-3xl text-body text-text-secondary">
                  This catalog tracks official NSW exam-pack pages separately from question transcriptions. It
                  is the intake checklist for turning source packs into verified question records,
                  marking-guide answers, and extracted diagram assets.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <CoverageMetric label="Source packs listed" value={summary.sourcePackCount} />
                <CoverageMetric label="Paper records" value={summary.paperCount} />
                <CoverageMetric label="Verified questions" value={summary.verifiedQuestionCount} />
                <CoverageMetric label="Seed questions" value={summary.transcriptionCounts.demo} />
              </div>
              <div className="rounded-md border border-border-subtle bg-surface-sunken p-4 text-body-sm text-text-secondary">
                Run <code className="text-text-primary">pnpm run data:audit-sources</code> to compare the
                local source catalog with the official NSW current and archive listing pages visible today.
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CoverageMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border-default bg-surface-sunken p-4">
      <div className="text-h2 font-semibold">{value}</div>
      <div className="text-caption text-text-secondary">{label}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="min-w-28 rounded-md border border-border-default bg-surface-sunken px-3 py-2">
      <div className="flex items-center gap-2 text-text-subtle">{icon}</div>
      <div className="mt-1 text-h3 font-semibold">{value}</div>
      <div className="text-caption text-text-secondary">{label}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-caption font-medium text-text-secondary">
      {label}
      <span className="flex items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary focus-within:shadow-focus">
        <Filter size={16} className="shrink-0 text-text-subtle" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none"
          aria-label={label}
        >
          {children}
        </select>
      </span>
    </label>
  );
}

function ModeButton({
  active,
  icon,
  onClick,
  children
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-sm px-3 text-body-sm font-medium ${
        active
          ? "bg-accent-primary text-text-onAccent"
          : "text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
      }`}
    >
      {active ? <ArrowLeftRight size={16} /> : icon}
      {children}
    </button>
  );
}
