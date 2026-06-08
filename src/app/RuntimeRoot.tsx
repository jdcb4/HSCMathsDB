import { useEffect, useState } from "react";
import { loadHscRuntimeData, type HscRuntimeData } from "../services/hscRuntimeData";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  options: {
    enableMenu: false,
    enableEnrichment: false,
    enableSpeech: false,
    enableBraille: false,
    enableExplorer: false,
    enableComplexity: false,
    enableAssistiveMml: false,
    menuOptions: {
      settings: {
        enrich: false,
        collapsible: false,
        speech: false,
        braille: false,
        assistiveMml: false
      }
    },
    a11y: {
      speech: false,
      braille: false,
      subtitles: false,
      voicing: false
    }
  },
  tex: {
    inlineMath: [
      ["\\(", "\\)"],
      ["$", "$"]
    ],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true
  }
};

type ReadyRuntime = {
  App: typeof import("./App").App;
  MathJaxContext: typeof import("better-react-mathjax").MathJaxContext;
  data: HscRuntimeData;
};

export function RuntimeRoot() {
  const [readyRuntime, setReadyRuntime] = useState<ReadyRuntime>();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([import("./App"), import("better-react-mathjax"), loadHscRuntimeData()])
      .then(([appModule, mathJaxModule, data]) => {
        if (!active) {
          return;
        }

        setReadyRuntime({
          App: appModule.App,
          MathJaxContext: mathJaxModule.MathJaxContext,
          data
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Failed to load HSCMathsDB.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (errorMessage) {
    return (
      <main className="min-h-dvh bg-surface-base p-6 text-text-primary">
        <section className="mx-auto max-w-3xl rounded-md border border-accent-danger bg-surface-raised p-5">
          <p className="text-caption font-semibold uppercase text-accent-danger">HSCMathsDB</p>
          <h1 className="mt-2 text-h2 font-semibold">Could not load the question database</h1>
          <p className="mt-3 text-body text-text-secondary">{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (!readyRuntime) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface-base p-6 text-text-primary">
        <section className="w-full max-w-sm rounded-md border border-border-default bg-surface-raised p-5">
          <p className="text-caption font-semibold uppercase text-accent-info">HSCMathsDB</p>
          <h1 className="mt-2 text-h3 font-semibold">Loading question database</h1>
          <p className="mt-2 text-body-sm text-text-secondary">
            Preparing the searchable HSC mathematics corpus.
          </p>
        </section>
      </main>
    );
  }

  const { App, MathJaxContext, data } = readyRuntime;

  return (
    <MathJaxContext config={mathJaxConfig} version={4} asyncLoad>
      <App
        database={data.database}
        syllabusConversion={data.syllabusConversion}
        workedSolutionCoverage={data.workedSolutionCoverage}
        loadWorkedSolution={data.loadWorkedSolution}
      />
    </MathJaxContext>
  );
}
