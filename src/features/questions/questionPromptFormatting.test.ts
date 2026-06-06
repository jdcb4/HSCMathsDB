import { describe, expect, it } from "vitest";
import { formatMultipartQuestionPrompt } from "./questionPromptFormatting";

describe("question prompt formatting", () => {
  it("adds visible breaks before multipart question markers", () => {
    const formatted = formatMultipartQuestionPrompt("Question stub. (a) First part. (b) Second part.");

    expect(formatted).toBe("Question stub.\n\n(a) First part.\n\n(b) Second part.");
  });

  it("leaves ordinary parenthetical text alone", () => {
    const prompt = "Find the value of f(x) when x = 2. Include units (where appropriate).";

    expect(formatMultipartQuestionPrompt(prompt)).toBe(prompt);
  });

  it("adds visible breaks around multiple-choice options", () => {
    const formatted = formatMultipartQuestionPrompt(
      "Which value is correct? Options: A. \\(1\\), B. \\(2\\), C. \\(3\\), D. \\(4\\)."
    );

    expect(formatted).toBe(
      "Which value is correct?\n\nOptions:\nA. \\(1\\)\nB. \\(2\\)\nC. \\(3\\)\nD. \\(4\\)."
    );
  });
});
