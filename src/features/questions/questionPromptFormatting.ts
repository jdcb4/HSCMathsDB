const MULTIPART_MARKER_PATTERN = /\s+\(([a-z])\)\s+/g;

export function formatMultipartQuestionPrompt(promptLatex: string): string {
  const markers = [...promptLatex.matchAll(MULTIPART_MARKER_PATTERN)].map((match) => match[1]);

  if (!hasConsecutiveMultipartMarkers(markers)) {
    return promptLatex;
  }

  return promptLatex.replace(MULTIPART_MARKER_PATTERN, (match) => {
    const markerText = match.trim();
    return `\n\n${markerText} `;
  });
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
