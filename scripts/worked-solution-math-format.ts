const INLINE_MATH_PATTERN = /\\\([\s\S]*?\\\)/g;
const DISPLAY_MATH_PATTERN = /\\\[[\s\S]*?\\\]/g;
const RAW_TEX_COMMAND_PATTERN =
  /\\(?:frac|dfrac|sqrt|left|right|text|textbf|times|cdot|approx|geq|leq|neq|infty|pi|theta|sin|cos|tan|ln|log|to)\b/;
const PLAIN_ASCII_MATH_PATTERNS = [
  /\b[A-Za-z](?:_\{?[A-Za-z0-9]+\}?)?\s*(?:=|<|>|<=|>=)\s*[-+A-Za-z0-9().^/ ]+/,
  /\b[A-Za-z]\([^)]+\)\s*(?:=|<|>|<=|>=)\s*[-+A-Za-z0-9().^/ ]+/,
  /\bP\([^)]+\)/,
  /\b(?:sin|cos|tan|ln|log)\s+[A-Za-z0-9]/,
  /\b\d+\/\d+\b/,
  /(?<![A-Za-z])\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)(?![A-Za-z])/
];
const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\u00e2\u2020\u2019/g, "\\(\\to\\)"],
  [/\u00e2\u2030\u02c6/g, "\\(\\approx\\)"],
  [/\u00e2\u2030\u00a4/g, "\\(\\le\\)"],
  [/\u00e2\u2030\u00a5/g, "\\(\\ge\\)"],
  [/\u00e2\u02c6\u2019/g, "-"],
  [/\u00e2\u20ac\u201d/g, " - "],
  [/\u00e2\u20ac\u201c/g, " - "],
  [/\u00e2\u20ac\u2122/g, "'"],
  [/\u00e2\u20ac\u02dc/g, "'"],
  [/\u00e2\u20ac\u0153/g, '"'],
  [/\u00e2\u20ac\u009d/g, '"'],
  [/\u00c2\u00b2/g, "^2"],
  [/\u00c2\u00b3/g, "^3"],
  [/\u00c3\u2014/g, "\\(\\times\\)"]
];

export type WorkedSolutionMathIssue = {
  code:
    | "raw-dollar-delimiter"
    | "raw-tex-command"
    | "mojibake"
    | "unicode-operator"
    | "plain-ascii-math"
    | "nested-math-delimiter"
    | "corrupt-tex-command";
  message: string;
};

export function normalizeWorkedSolutionText(value: string): string {
  let normalized = value;

  MOJIBAKE_REPLACEMENTS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  normalized = convertDollarMathDelimiters(normalized);
  normalized = removeNonMathFormattingTex(normalized);
  normalized = replaceUnicodeOperatorsOutsideMath(normalized);

  return normalized
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

export function auditWorkedSolutionText(value: string): WorkedSolutionMathIssue[] {
  const issues: WorkedSolutionMathIssue[] = [];
  const textOutsideMath = stripDelimitedMath(value);

  if (hasRawDollarDelimiter(value)) {
    issues.push({
      code: "raw-dollar-delimiter",
      message: "Use \\( ... \\) or \\[ ... \\], not $ ... $ or $$ ... $$."
    });
  }

  if (RAW_TEX_COMMAND_PATTERN.test(textOutsideMath)) {
    issues.push({
      code: "raw-tex-command",
      message: "TeX commands must be inside MathJax delimiters."
    });
  }

  if (/[\u00e2\u00c2\u00c3]/.test(value)) {
    issues.push({
      code: "mojibake",
      message: "Text contains likely encoding artefacts."
    });
  }

  if (/[\u2248\u2264\u2265\u00d7\u2192\u221e\u03c0\u03b8]/.test(textOutsideMath)) {
    issues.push({
      code: "unicode-operator",
      message: "Mathematical operators should be represented in TeX inside delimiters."
    });
  }

  if (PLAIN_ASCII_MATH_PATTERNS.some((pattern) => pattern.test(textOutsideMath))) {
    issues.push({
      code: "plain-ascii-math",
      message: "Mathematical notation should be TeX inside MathJax delimiters, not plain ASCII."
    });
  }

  if (/\\\([^)]*\\\(|\\\)\s*\\\(|\\\)[^(]*\\\)/.test(value)) {
    issues.push({
      code: "nested-math-delimiter",
      message: "MathJax delimiters must not be nested or adjacent inside a single expression."
    });
  }

  if (/(^|[^A-Za-z\\])(?:imes|heta|ext\{)|\f/.test(value)) {
    issues.push({
      code: "corrupt-tex-command",
      message: "Text contains likely TeX command corruption from JSON escape handling."
    });
  }

  return issues;
}

export function formatMathIssues(issues: WorkedSolutionMathIssue[]): string {
  return [...new Set(issues.map((issue) => issue.code))].join(", ");
}

function convertDollarMathDelimiters(value: string): string {
  let converted = value.replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_match, inner: string) => {
    const trimmed = inner.trim();
    return trimmed ? `\\[${trimmed}\\]` : "";
  });

  converted = converted.replace(/(?<!\\)\$([\s\S]*?)(?<!\\)\$/g, (match, inner: string) => {
    const trimmed = inner.trim();

    if (!trimmed) {
      return match;
    }

    if (looksLikeAccidentalCurrencySpan(trimmed)) {
      return `\\$${trimmed}\\$`;
    }

    return `\\(${trimmed}\\)`;
  });

  return converted.replace(/(?<!\\)\$/g, "\\$");
}

function looksLikeAccidentalCurrencySpan(value: string): boolean {
  const wordCount = value.split(/\s+/).filter(Boolean).length;
  return wordCount > 8 || /\b(?:repayment|payment|owing|dollars|principal|interest|months?)\b/i.test(value);
}

function removeNonMathFormattingTex(value: string): string {
  return transformOutsideMath(value, (segment) =>
    segment.replace(/\\textbf\{([^{}]+)\}/g, (_match, inner: string) => inner)
  );
}

function replaceUnicodeOperatorsOutsideMath(value: string): string {
  return transformOutsideMath(value, (segment) =>
    segment
      .replace(/\u2192/g, " so ")
      .replace(/\u2248/g, "\\(\\approx\\)")
      .replace(/\u2264/g, "\\(\\le\\)")
      .replace(/\u2265/g, "\\(\\ge\\)")
      .replace(/\u00d7/g, "\\(\\times\\)")
      .replace(/\u221e/g, "\\(\\infty\\)")
      .replace(/\u03c0/g, "\\(\\pi\\)")
      .replace(/\u03b8/g, "\\(\\theta\\)")
  );
}

function transformOutsideMath(value: string, transform: (segment: string) => string): string {
  const ranges = getMathRanges(value);
  let result = "";
  let cursor = 0;

  ranges.forEach(([start, end]) => {
    result += transform(value.slice(cursor, start));
    result += value.slice(start, end);
    cursor = end;
  });

  result += transform(value.slice(cursor));
  return result;
}

function getMathRanges(value: string): Array<[number, number]> {
  return [...value.matchAll(INLINE_MATH_PATTERN), ...value.matchAll(DISPLAY_MATH_PATTERN)]
    .map((match): [number, number] => [match.index ?? 0, (match.index ?? 0) + match[0].length])
    .sort((left, right) => left[0] - right[0]);
}

function stripDelimitedMath(value: string): string {
  return value.replace(INLINE_MATH_PATTERN, "").replace(DISPLAY_MATH_PATTERN, "");
}

function hasRawDollarDelimiter(value: string): boolean {
  return /(?<!\\)\$/.test(value);
}
