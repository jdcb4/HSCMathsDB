import { useContext, useEffect, useRef } from "react";
import { MathJaxBaseContext } from "better-react-mathjax";

export function MathText({ children, block = false }: { children: string; block?: boolean }) {
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
  }, [children, mathJax]);

  return (
    <span
      key={children}
      ref={containerRef}
      className={block ? "math-text block whitespace-pre-line" : "math-text"}
      style={{ display: block ? "block" : "inline" }}
    >
      {children}
    </span>
  );
}
