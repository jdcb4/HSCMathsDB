export type LatexTextSegment = {
  type: "text";
  text: string;
};

export type LatexTableSegment = {
  type: "table";
  rows: string[][];
};

export type LatexContentSegment = LatexTextSegment | LatexTableSegment;

const TABULAR_PATTERN = /(?:\\\[\s*)?\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}(?:\s*\\\])?/g;

export function splitLatexTables(source: string): LatexContentSegment[] {
  const segments: LatexContentSegment[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(TABULAR_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const leadingText = source.slice(lastIndex, matchIndex);
    if (leadingText) {
      segments.push({ type: "text", text: leadingText });
    }

    segments.push({ type: "table", rows: parseLatexTableRows(match[1]) });
    lastIndex = matchIndex + match[0].length;
  }

  const trailingText = source.slice(lastIndex);
  if (trailingText) {
    segments.push({ type: "text", text: trailingText });
  }

  return segments.length > 0 ? segments : [{ type: "text", text: source }];
}

function parseLatexTableRows(tableBody: string): string[][] {
  return tableBody
    .split(/\\\\/)
    .map((row) => row.replace(/\\hline/g, "").trim())
    .filter(Boolean)
    .map((row) => row.split("&").map(normaliseLatexTableCell));
}

function normaliseLatexTableCell(cell: string): string {
  return stripSimpleLatexWrappers(cell.trim())
    .replace(/\\,/g, ",")
    .replace(/\\\$/g, "$")
    .replace(/\\%/g, "%")
    .replace(/\s+/g, " ")
    .trim();
}

function stripSimpleLatexWrappers(value: string): string {
  let previous = "";
  let current = value;

  while (current !== previous) {
    previous = current;
    current = current
      .replace(/\\multicolumn\{[^{}]*\}\{[^{}]*\}\{([^{}]*)\}/g, "$1")
      .replace(/\\(?:textit|textbf|mathrm|text)\{([^{}]*)\}/g, "$1");
  }

  return current;
}
