import { useContext, useEffect, useRef } from "react";
import { MathJaxBaseContext } from "better-react-mathjax";
import { splitLatexTables } from "./latexTables";

export function MathText({ children, block = false }: { children: string; block?: boolean }) {
  const segments = splitLatexTables(children);

  if (segments.some((segment) => segment.type === "table")) {
    const Wrapper = block ? "div" : "span";

    return (
      <Wrapper className={block ? "math-text block whitespace-pre-line" : "math-text"}>
        {segments.map((segment, segmentIndex) =>
          segment.type === "text" ? (
            <MathTextSpan key={`text-${segmentIndex}`} text={segment.text} />
          ) : (
            <span
              key={`table-${segmentIndex}`}
              className="my-4 block overflow-x-auto rounded-md border border-border-subtle bg-surface-raised"
            >
              <table className="min-w-full border-collapse text-left text-body-sm">
                <tbody>
                  {segment.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="border-b border-border-subtle last:border-b-0">
                      {row.map((cell, cellIndex) => {
                        const Cell = rowIndex === 0 ? "th" : "td";

                        return (
                          <Cell
                            key={`cell-${cellIndex}`}
                            className="border-r border-border-subtle px-3 py-2 align-top last:border-r-0"
                          >
                            <MathTextSpan text={cell} />
                          </Cell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </span>
          )
        )}
      </Wrapper>
    );
  }

  return <MathTextSpan text={children} block={block} />;
}

function MathTextSpan({ text, block = false }: { text: string; block?: boolean }) {
  const mathJax = useContext(MathJaxBaseContext);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    let cancelled = false;

    if (!element || !mathJax || mathJax.version === 2) {
      return () => {
        cancelled = true;
      };
    }

    void mathJax.promise
      .then(async (mathJaxObject) => {
        const typesetter = mathJaxObject as {
          startup?: { promise?: Promise<void> };
          typesetClear?: (elements: HTMLElement[]) => void;
          typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
        };

        await typesetter.startup?.promise;
        if (cancelled || containerRef.current !== element || !typesetter.typesetPromise) {
          return;
        }

        typesetter.typesetClear?.([element]);
        await typesetter.typesetPromise([element]);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("MathJax typesetting failed", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text, mathJax]);

  return (
    <span
      key={text}
      ref={containerRef}
      className={block ? "math-text block whitespace-pre-line" : "math-text"}
      style={{ display: block ? "block" : "inline" }}
    >
      {text}
    </span>
  );
}
