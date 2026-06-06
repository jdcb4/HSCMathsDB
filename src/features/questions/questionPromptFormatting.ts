const MULTIPART_MARKER_PATTERN = /\s+\(([a-z])\)\s+/g;
const OPTION_MARKER_PATTERN = /,?\s+([A-D])\.\s+/g;

export function formatMultipartQuestionPrompt(promptLatex: string): string {
  const withOptionBreaks = formatMultipleChoiceOptions(promptLatex);
  const markers = [...withOptionBreaks.matchAll(MULTIPART_MARKER_PATTERN)].map((match) => match[1]);

  if (!hasConsecutiveMultipartMarkers(markers)) {
    return withOptionBreaks;
  }

  return withOptionBreaks.replace(MULTIPART_MARKER_PATTERN, (match) => {
    const markerText = match.trim();
    return `\n\n${markerText} `;
  });
}

function formatMultipleChoiceOptions(promptLatex: string): string {
  if (!promptLatex.includes("Options:")) {
    return promptLatex;
  }

  return promptLatex
    .replace(/\s+Options:\s+/, "\n\nOptions:\n")
    .replace(OPTION_MARKER_PATTERN, (_match, option: string) => `\n${option}. `);
}

function hasConsecutiveMultipartMarkers(markers: string[]): boolean {
  if (markers.length < 2 || markers[0] !== "a") {
    return false;
  }

  return markers.some((marker, index) => {
    if (index === 0) {
      return false;
    }

    return marker.charCodeAt(0) === markers[index - 1].charCodeAt(0) + 1;
  });
}
