import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, FileText, Filter, Info, X } from "lucide-react";
import { QuestionDetail } from "../features/questions/QuestionDetail";
import { QuestionList } from "../features/questions/QuestionList";
import { PdfExportPanel } from "../features/questions/PdfExportPanel";
import { buildPdfExportQuestions } from "../features/questions/pdfExportSelectors";
import { defaultPdfExportOptions, type PdfExportOptions } from "../features/questions/pdfExportTypes";
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
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [selectedExportQuestionIds, setSelectedExportQuestionIds] = useState<string[]>([]);
  const [showPdfExport, setShowPdfExport] = useState(false);
  const [pdfExportOptions, setPdfExportOptions] = useState<PdfExportOptions>(defaultPdfExportOptions);

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
  const selectedExportQuestionIdSet = useMemo(
    () => new Set(selectedExportQuestionIds),
    [selectedExportQuestionIds]
  );
  const pdfExportQuestions = useMemo(
    () =>
      buildPdfExportQuestions({
        database,
        questionIds: selectedExportQuestionIdSet,
        orderedQuestions: filteredQuestions,
        syllabusEra: preferredSyllabusEra,
        syllabusConversion,
        workedSolutionsByQuestionId
      }),
    [
      database,
      filteredQuestions,
      preferredSyllabusEra,
      selectedExportQuestionIdSet,
      syllabusConversion,
      workedSolutionsByQuestionId
    ]
  );
  const exportWorkedSolutionsLoading =
    showPdfExport &&
    pdfExportOptions.includeWorkedSolution &&
    pdfExportQuestions.some(
      (item) =>
        !(item.question.id in workedSolutionsByQuestionId) || loadingWorkedSolutionId === item.question.id
    );

  useEffect(() => {
    const visibleQuestionIds = new Set(filteredQuestions.map((question) => question.id));
    setSelectedExportQuestionIds((current) =>
      current.filter((questionId) => visibleQuestionIds.has(questionId))
    );
  }, [filteredQuestions]);

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

  const loadWorkedSolutionForQuestion = useCallback(
    async (paperId: string, questionId: string) => {
      if (questionId in workedSolutionsByQuestionId || loadingWorkedSolutionId === questionId) {
        return;
      }

      setLoadingWorkedSolutionId(questionId);
      setWorkedSolutionErrorsByQuestionId((current) => {
        const next = { ...current };
        delete next[questionId];
        return next;
      });

      try {
        const workedSolution = await loadWorkedSolution(paperId, questionId);
        setWorkedSolutionsByQuestionId((current) => ({
          ...current,
          [questionId]: workedSolution ?? null
        }));
      } catch (error) {
        setWorkedSolutionsByQuestionId((current) => ({
          ...current,
          [questionId]: null
        }));
        setWorkedSolutionErrorsByQuestionId((current) => ({
          ...current,
          [questionId]: error instanceof Error ? error.message : "Failed to load the worked solution."
        }));
      } finally {
        setLoadingWorkedSolutionId((current) => (current === questionId ? "" : current));
      }
    },
    [loadWorkedSolution, loadingWorkedSolutionId, workedSolutionsByQuestionId]
  );

  useEffect(() => {
    if (!showPdfExport || !pdfExportOptions.includeWorkedSolution) {
      return;
    }

    const nextQuestion = pdfExportQuestions.find(
      (item) =>
        !(item.question.id in workedSolutionsByQuestionId) && loadingWorkedSolutionId !== item.question.id
    );

    if (!nextQuestion) {
      return;
    }

    void loadWorkedSolutionForQuestion(nextQuestion.question.paperId, nextQuestion.question.id);
  }, [
    loadWorkedSolutionForQuestion,
    loadingWorkedSolutionId,
    pdfExportOptions.includeWorkedSolution,
    pdfExportQuestions,
    showPdfExport,
    workedSolutionsByQuestionId
  ]);

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

  const toggleExportQuestion = (questionId: string) => {
    setSelectedExportQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((candidate) => candidate !== questionId)
        : [...current, questionId]
    );
  };

  const toggleVisibleExportQuestions = () => {
    const visibleQuestionIds = filteredQuestions.map((question) => question.id);
    const allVisibleSelected =
      visibleQuestionIds.length > 0 &&
      visibleQuestionIds.every((questionId) => selectedExportQuestionIdSet.has(questionId));

    setSelectedExportQuestionIds((current) => {
      if (allVisibleSelected) {
        const visibleQuestionIdSet = new Set(visibleQuestionIds);
        return current.filter((questionId) => !visibleQuestionIdSet.has(questionId));
      }

      return [...new Set([...current, ...visibleQuestionIds])];
    });
  };

  const printPdfExport = async () => {
    await waitForMathJax();
    window.print();
  };

  return (
    <>
      <div className="min-h-dvh bg-surface-base text-text-primary print:hidden">
        <header className="border-b border-border-subtle bg-surface-raised">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-8">
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="pr-12">
                <h1 className="text-h1 font-semibold">HSCMathsDB</h1>
                <p className="mt-2 max-w-3xl text-body text-text-secondary">
                  All the questions from the NSW HSC maths courses since 2017, along with worked solutions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Metric icon={<FileText size={17} />} label="Questions" value={summary.questionCount} />
                <Metric icon={<BookOpen size={17} />} label="Exams" value={summary.paperCount} />
              </div>
              <button
                type="button"
                onClick={() => setShowInfoToast((current) => !current)}
                className="absolute right-0 top-0 inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
                aria-label="About this project"
                aria-expanded={showInfoToast}
              >
                <Info size={18} />
              </button>
              {showInfoToast ? (
                <div
                  role="status"
                  className="absolute right-0 top-12 z-10 w-full max-w-md rounded-md border border-border-default bg-surface-overlay p-4 shadow-focus"
                >
                  <div className="flex items-start gap-3">
                    <Info size={18} className="mt-0.5 shrink-0 text-accent-info" />
                    <p className="text-body-sm text-text-secondary">
                      This is a project I'm using to test pdf ingestion and AI answer generation. Most of
                      these questions and answers haven't been human QA'd. If you have ideas of how to make
                      this more useful, or spot errors, please let me know.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowInfoToast(false)}
                      className="shrink-0 rounded-md p-1 text-text-subtle hover:text-text-primary"
                      aria-label="Close project information"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <details open className="rounded-md border border-border-default bg-surface-sunken p-3 sm:p-4">
              <summary className="cursor-pointer text-h4 font-semibold text-text-primary">
                Choose what questions you want
              </summary>
              <p className="mt-2 text-body-sm text-text-secondary">
                Filter by course, year, question style, or syllabus content.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FilterSelect label="Course" value={selectedCourse?.id ?? ""} onChange={setCourse}>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.shortTitle}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
                  label="Year"
                  value={filters.year}
                  onChange={(value) => setFilter("year", value)}
                >
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
            </details>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[330px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside>
            <QuestionList
              questions={filteredQuestions}
              selectedQuestionId={selectedQuestion?.id ?? ""}
              selectedExportQuestionIds={selectedExportQuestionIdSet}
              syllabusSummariesByQuestionId={syllabusSummariesByQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onToggleExportQuestion={toggleExportQuestion}
              onToggleVisibleExportQuestions={toggleVisibleExportQuestions}
              onClearExportSelection={() => setSelectedExportQuestionIds([])}
              onOpenPdfExport={() => setShowPdfExport(true)}
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
                  appVersion={database.meta.version}
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
      <PdfExportPanel
        open={showPdfExport}
        exportQuestions={pdfExportQuestions}
        options={pdfExportOptions}
        workedSolutionsLoading={exportWorkedSolutionsLoading}
        onOptionsChange={setPdfExportOptions}
        onClose={() => setShowPdfExport(false)}
        onPrint={printPdfExport}
      />
    </>
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

async function waitForMathJax() {
  await new Promise((resolve) => window.setTimeout(resolve, 250));

  const mathJax = (
    window as Window & {
      MathJax?: {
        startup?: { promise?: Promise<void> };
        typesetPromise?: () => Promise<void>;
      };
    }
  ).MathJax;

  await mathJax?.startup?.promise;
  await mathJax?.typesetPromise?.();
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
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-md border border-border-default bg-surface-raised p-2"
      aria-label="Question navigation"
    >
      <QuestionNavButton direction="previous" label={previousTitle} onClick={onPrevious} />
      <div className="text-center text-caption font-medium text-text-secondary">
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
      className={`inline-flex min-h-10 min-w-0 items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45 ${
        isPrevious ? "justify-start" : "justify-end"
      }`}
    >
      {isPrevious ? <ChevronLeft size={16} /> : null}
      <span>{isPrevious ? "Previous" : "Next"}</span>
      {label ? <span className="hidden text-caption text-text-subtle sm:inline">{label}</span> : null}
      {!isPrevious ? <ChevronRight size={16} /> : null}
    </button>
  );
}
