import ReactDOM from "react-dom/client";
import { MathJaxContext } from "better-react-mathjax";
import { App } from "./App";
import "../styles/index.css";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [
      ["\\(", "\\)"],
      ["$", "$"]
    ],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true
  }
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MathJaxContext config={mathJaxConfig}>
    <App />
  </MathJaxContext>
);
