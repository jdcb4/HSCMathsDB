from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


VALID_SECTIONS = {"I", "II"}
VALID_STYLES = {"multiple-choice", "short-answer", "extended-response"}
VALID_REVIEW_STATUSES = {"needs-review", "reviewed", "promoted", "rejected"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate ignored raw question candidate JSON files.")
    parser.add_argument("pack_ids", nargs="*", help="Optional source pack IDs to validate.")
    args = parser.parse_args()

    root = Path("var/question-candidates")
    if not root.exists():
        raise SystemExit("No question candidates found. Run pnpm run data:extract-candidates first.")

    paths = sorted(root.glob("*.json"))
    if args.pack_ids:
        requested = {f"{pack_id}.json" for pack_id in args.pack_ids}
        paths = [path for path in paths if path.name in requested]
        found = {path.name for path in paths}
        missing = sorted(requested - found)
        if missing:
            raise SystemExit(f"No candidate file found for: {', '.join(name.removesuffix('.json') for name in missing)}")

    issue_count = 0
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        issues = validate_candidate_file(data)
        issue_count += len(issues)

        if issues:
            print(f"{path}: {len(issues)} issue(s)")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"{path}: valid ({data['candidateCount']} candidates)")

    if issue_count:
        raise SystemExit(f"{issue_count} candidate validation issue(s) found")


def validate_candidate_file(data: dict[str, Any]) -> list[str]:
    issues: list[str] = []

    if not isinstance(data.get("packId"), str) or not data["packId"]:
        issues.append("packId must be a non-empty string")

    candidates = data.get("candidates")
    if not isinstance(candidates, list):
        return issues + ["candidates must be a list"]

    if data.get("candidateCount") != len(candidates):
        issues.append("candidateCount does not match candidates length")

    seen_question_numbers: set[str] = set()
    for index, candidate in enumerate(candidates):
        prefix = f"candidate[{index}]"
        question_number = candidate.get("questionNumber")
        if not isinstance(question_number, str) or not question_number.isdigit():
            issues.append(f"{prefix}.questionNumber must be a numeric string")
        elif question_number in seen_question_numbers:
            issues.append(f"{prefix}.questionNumber duplicates {question_number}")
        else:
            seen_question_numbers.add(question_number)

        if candidate.get("section") not in VALID_SECTIONS:
            issues.append(f"{prefix}.section must be one of {sorted(VALID_SECTIONS)}")

        if candidate.get("style") not in VALID_STYLES:
            issues.append(f"{prefix}.style must be one of {sorted(VALID_STYLES)}")

        marks = candidate.get("marks")
        if not isinstance(marks, int) or marks < 1:
            issues.append(f"{prefix}.marks must be a positive integer")

        page_refs = candidate.get("pageRefs")
        if not isinstance(page_refs, list) or not page_refs or not all(isinstance(page, int) for page in page_refs):
            issues.append(f"{prefix}.pageRefs must be a non-empty integer list")

        if not isinstance(candidate.get("rawPrompt"), str) or not candidate["rawPrompt"]:
            issues.append(f"{prefix}.rawPrompt must be non-empty")

        answer_candidates = candidate.get("answerCandidates")
        if not isinstance(answer_candidates, list) or not answer_candidates:
            issues.append(f"{prefix}.answerCandidates must be a non-empty list")
        else:
            for answer_index, answer_candidate in enumerate(answer_candidates):
                answer_prefix = f"{prefix}.answerCandidates[{answer_index}]"
                if not isinstance(answer_candidate.get("kind"), str) or not answer_candidate["kind"]:
                    issues.append(f"{answer_prefix}.kind must be non-empty")
                if not isinstance(answer_candidate.get("rawText"), str) or not answer_candidate["rawText"]:
                    issues.append(f"{answer_prefix}.rawText must be non-empty")

        if candidate.get("reviewStatus") not in VALID_REVIEW_STATUSES:
            issues.append(f"{prefix}.reviewStatus must be one of {sorted(VALID_REVIEW_STATUSES)}")

    expected_numbers = {str(number) for number in range(1, len(candidates) + 1)}
    if seen_question_numbers and seen_question_numbers != expected_numbers:
        issues.append(f"question numbers are not contiguous 1-{len(candidates)}")

    return issues


if __name__ == "__main__":
    main()
