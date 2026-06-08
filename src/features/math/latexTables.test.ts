import { describe, expect, it } from "vitest";
import { splitLatexTables } from "./latexTables";

describe("splitLatexTables", () => {
  it("extracts simple tabular environments from display math blocks", () => {
    const segments = splitLatexTables(
      "Before\n\n\\[\\begin{tabular}{|l|c|} \\hline Subject & Score \\\\ \\hline French & 82 \\\\ \\hline \\end{tabular}\\]\n\nAfter"
    );

    expect(segments).toEqual([
      { type: "text", text: "Before\n\n" },
      {
        type: "table",
        rows: [
          ["Subject", "Score"],
          ["French", "82"]
        ]
      },
      { type: "text", text: "\n\nAfter" }
    ]);
  });

  it("normalises common table-only TeX wrappers and escaped currency", () => {
    const segments = splitLatexTables(
      "\\[\\begin{tabular}{|l|l|}\\hline \\textit{Taxable income} & \\multicolumn{1}{|c|}{Tax payable} \\\\ \\hline \\$18\\,201 & 19\\% \\\\ \\hline \\end{tabular}\\]"
    );

    expect(segments).toEqual([
      {
        type: "table",
        rows: [
          ["Taxable income", "Tax payable"],
          ["$18,201", "19%"]
        ]
      }
    ]);
  });
});
