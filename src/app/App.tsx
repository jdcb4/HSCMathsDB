import { useCallback, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, FileText, Filter } from "lucide-react";
import { QuestionDetail } from "../features/questions/QuestionDetail";
import { QuestionList } from "../features/questions/QuestionList";
import {
  getDatasetSummary,
  getCourseOptions,
  getDefaultSyllabusEraForCourse,
  getDisplaySyllabusNodesForQuestion,
  getFilterOptionsForCourse,
  getSyllabusNodesForView,
  queryQuestions,
  type SyllabusEraView
} from "../domain/hscSelectors";
import type { HscDatabase, QuestionStyle, SyllabusConversion, WorkedSolution } from "../domain/hscSchemas";

type Filters = {
  courseId: string;
  year: string;
  style: string;
  syllabusNodeId: string;
};

const defaultFilters: Filters = {
  courseId: "advanced",
  year: "all",
  style: "all",
  syllabusNodeId: "all"
};

const ARCHIVE_COURSE_ID = "mathematics-archive";

export function App({
  database,
  syllabusConversion,
  loadWorkedSolution
}: {
  database: HscDatabase;
  syllabusConversion: SyllabusConversion;
  loadWorkedSolution: (paperId: string, questionId: string) => Promise<WorkedSolution | undefined>;
}) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedQuestionId, setSelectedQuestionId] = useState(database.questions[0]?.id ?? "");
  const [preferredSyllabusEra, setPreferredSyllabusEra] = useState<SyllabusEraView>("advanced-2017");
  const [workedSolutionsByQuestionId, setWorkedSolutionsByQuestionId] = useState<
    Record<string, WorkedSolution | null>
  >({});
  const [loadingWorkedSolutionId, setLoadingWorkedSolutionId] = useState("");
  const [workedSolutionErrorsByQuestionId, setWorkedSolutionErrorsByQuestionId] = useState<
    Record<string, string>
  >({});

  const courseOptions = useMemo(
    () => getCourseOptions(database).filter((course) => course.id !== ARCHIVE_COURSE_ID),
    [database]
  );
  const selectedCourse = courseOptions.find((course) => course.id === filters.courseId) ?? courseOptions[0];
  const selectedSyllabusEra =
    selectedCourse?.syllabusEras.find((era) => era.id === preferredSyllabusEra) ??
    selectedCourse?.syllabusEras[0];
  const options = useMemo(
    () => getFilterOptionsForCourse(database, selectedCourse?.id),
    [database, selectedCourse]
  );
  const summary = useMemo(() => getDatasetSummary(database), [database]);
  const visibleSyllabusNodes = useMemo(
    () => getSyllabusNodesForView(database, preferredSyllabusEra),
    [database, preferredSyllabusEra]
  );

  const filteredQuestions = useMemo(
    () =>
      queryQuestions(database, {
        courseId: selectedCourse?.id,
        year: filters.year === "all" ? undefined : Number(filters.year),
        style: filters.style === "all" ? undefined : (filters.style as QuestionStyle),
        syllabusNodeId: filters.syllabusNodeId === "all" ? undefined : filters.syllabusNodeId,
        syllabusConversion
      }),
    [database, filters, selectedCourse, syllabusConversion]
  );

  const selectedQuestion = useMemo(
    () => database.questions.find((question) => question.id === selectedQuestionId) ?? filteredQuestions[0],
    [database, filteredQuestions, selectedQuestionId]
  );

  const selectedQuestionSyllabus = selectedQuestion
    ? getDisplaySyllabusNodesForQuestion(database, selectedQuestion, preferredSyllabusEra, syllabusConversion)
    : [];
  const selectedWorkedSolution = selectedQuestion
    ? (workedSolutionsByQuestionId[selectedQuestion.id] ?? undefined)
    : undefined;
  const syllabusSummariesByQuestionId = useMemo(
    () =>
      Object.fromEntries(
        filteredQuestions.map((question) => {
          const nodes = getDisplaySyllabusNodesForQuestion(
            database,
            question,
            preferredSyllabusEra,
            syllabusConversion
          );
          return [
            question.id,
            nodes.length > 0
              ? nodes.map((node) => `${node.code} ${node.title}`).join(" / ")
              : `${question.topic} / ${question.subtopic}`
          ];
        })
      ),
    [database, filteredQuestions, preferredSyllabusEra, syllabusConversion]
  );
  const selectedQuestionIndex = selectedQuestion
    ? filteredQuestions.findIndex((question) => question.id === selectedQuestion.id)
    : -1;
  const previousQuestion =
    selectedQuestionIndex > 0 ? filteredQuestions[selectedQuestionIndex - 1] : undefined;
  const nextQuestion =
    selectedQuestionIndex >= 0 && selectedQuestionIndex < filteredQuestions.length - 1
      ? filteredQuestions[selectedQuestionIndex + 1]
      : undefined;

  const requestSelectedWorkedSolution = useCallback(async () => {
    if (!selectedQuestion) {
      return;
    }

    if (
      selectedQuestion.id in workedSolutionsByQuestionId ||
      loadingWorkedSolutionId === selectedQuestion.id
    ) {
      return;
    }

    setLoadingWorkedSolutionId(selectedQuestion.id);
    setWorkedSolutionErrorsByQuestionId((current) => {
      const next = { ...current };
      delete next[selectedQuestion.id];
      return next;
    });

    try {
      const workedSolution = await loadWorkedSolution(selectedQuestion.paperId, selectedQuestion.id);
      setWorkedSolutionsByQuestionId((current) => ({
        ...current,
        [selectedQuestion.id]: workedSolution ?? null
      }));
    } catch (error) {
      setWorkedSolutionErrorsByQuestionId((current) => ({
        ...current,
        [selectedQuestion.id]: error instanceof Error ? error.message : "Failed to load the worked solution."
      }));
    } finally {
      setLoadingWorkedSolutionId((current) => (current === selectedQuestion.id ? "" : current));
    }
  }, [loadWorkedSolution, loadingWorkedSolutionId, selectedQuestion, workedSolutionsByQuestionId]);

  const setFilter = (name: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const setCourse = (courseId: string) => {
    const nextCourse = courseOptions.find((course) => course.id === courseId);
    const nextSyllabusEra = getDefaultSyllabusEraForCourse(nextCourse);

    setFilters((currentFilters) => ({
      ...currentFilters,
      courseId,
      year: "all",
      style: "all",
      syllabusNodeId: "all"
    }));
    setPreferredSyllabusEra(nextSyllabusEra);
    setSelectedQuestionId(
      database.questions.find(
        (question) => database.papers.find((paper) => paper.id === question.paperId)?.courseId === courseId
      )?.id ?? ""
    );
  };

  const openQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
  };

  return (
    <div className="min-h-dvh bg-surface-base text-text-primary">
      <header className="border-b border-border-subtle bg-surface-raised">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-caption font-semibold uppercase text-accent-info">HSCMathsDB</p>
              <h1 className="text-h1 font-semibold">Mathematics question database</h1>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric icon={<FileText size={17} />} label="Questions" value={summary.questionCount} />
              <Metric icon={<BookOpen size={17} />} label="Exams" value={summary.paperCount} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Course" value={selectedCourse?.id ?? ""} onChange={setCourse}>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.shortTitle}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label="Year" value={filters.year} onChange={(value) => setFilter("year", value)}>
                <option value="all">All years</option>
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Style"
                value={filters.style}
                onChange={(value) => setFilter("style", value)}
              >
                <option value="all">All styles</option>
                {options.styles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Syllabus content"
                value={filters.syllabusNodeId}
                onChange={(value) => setFilter("syllabusNodeId", value)}
              >
                <option value="all">All content</option>
                {visibleSyllabusNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.code} {node.title}
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[330px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside>
          <QuestionList
            questions={filteredQuestions}
            selectedQuestionId={selectedQuestion?.id ?? ""}
            syllabusSummariesByQuestionId={syllabusSummariesByQuestionId}
            onSelectQuestion={setSelectedQuestionId}
          />
        </aside>

        <section className="min-w-0">
          {selectedQuestion ? (
            <div className="space-y-3">
              <QuestionNavigator
                currentIndex={selectedQuestionIndex}
                total={filteredQuestions.length}
                previousTitle={previousQuestion?.questionNumber}
                nextTitle={nextQuestion?.questionNumber}
                onPrevious={previousQuestion ? () => openQuestion(previousQuestion.id) : undefined}
                onNext={nextQuestion ? () => openQuestion(nextQuestion.id) : undefined}
              />
              <QuestionDetail
                question={selectedQuestion}
                paper={database.papers.find((paper) => paper.id === selectedQuestion.paperId)}
                workedSolution={selectedWorkedSolution}
                workedSolutionLoading={loadingWorkedSolutionId === selectedQuestion.id}
                workedSolutionError={workedSolutionErrorsByQuestionId[selectedQuestion.id]}
                syllabusNodes={selectedQuestionSyllabus}
                syllabusViewLabel={selectedSyllabusEra?.label ?? "2017 syllabus"}
                onRequestWorkedSolution={requestSelectedWorkedSolution}
              />
            </div>
          ) : (
            <div className="rounded-md border border-border-default bg-surface-raised p-5">
              <h2 className="text-h2 font-semibold">No questions match these filters</h2>
              <p className="mt-2 text-body text-text-secondary">
                Try a different year, course, style, or syllabus content.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex min-w-32 items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 py-2">
      <span className="shrink-0 text-text-subtle">{icon}</span>
      <span className="text-h4 font-semibold">{value}</span>
      <span className="text-caption text-text-secondary">{label}</span>
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
    <label className="flex min-w-0 flex-col gap-1 text-caption font-medium text-text-secondary">
      {label}
      <span className="flex items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary focus-within:shadow-focus">
        <Filter size={16} className="shrink-0 text-text-subtle" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 truncate bg-transparent outline-none"
          aria-label={label}
        >
          {children}
        </select>
      </span>
    </label>
  );
}

function QuestionNavigator({
  currentIndex,
  total,
  previousTitle,
  nextTitle,
  onPrevious,
  onNext
}: {
  currentIndex: number;
  total: number;
  previousTitle?: string;
  nextTitle?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const position = currentIndex >= 0 ? currentIndex + 1 : 0;

  return (
    <nav
      className="flex flex-col gap-2 rounded-md border border-border-default bg-surface-raised p-2 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Question navigation"
    >
      <QuestionNavButton direction="previous" label={previousTitle} onClick={onPrevious} />
      <div className="order-first text-center text-caption font-medium text-text-secondary sm:order-none">
        Question {position} of {total}
      </div>
      <QuestionNavButton direction="next" label={nextTitle} onClick={onNext} />
    </nav>
  );
}

function QuestionNavButton({
  direction,
  label,
  onClick
}: {
  direction: "previous" | "next";
  label?: string;
  onClick?: () => void;
}) {
  const isPrevious = direction === "previous";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
    >
      {isPrevious ? <ChevronLeft size={16} /> : null}
      <span>{isPrevious ? "Previous" : "Next"}</span>
      {label ? <span className="hidden text-caption text-text-subtle sm:inline">{label}</span> : null}
      {!isPrevious ? <ChevronRight size={16} /> : null}
    </button>
  );
}
