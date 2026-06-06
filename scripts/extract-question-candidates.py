from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


PAGE_RE = re.compile(r"^--- page (\d+) ---$")
SECTION_II_QUESTION_RE = re.compile(r"^Question\s+(\d+)(?:\s+\(([^)]*)\))?")
MULTIPLE_CHOICE_RE = re.compile(r"^(\d{1,2})\s+(.+)")
MARKING_QUESTION_RE = re.compile(r"^Question\s+(\d+)(?:\s+\(([^)]*)\))?$")
ANSWER_KEY_RE = re.compile(r"^(\d{1,2})\s+([A-D])$")


@dataclass
class Candidate:
    question_number: str
    section: str
    style: str
    marks: int | None
    prompt_lines: list[str] = field(default_factory=list)
    page_refs: set[int] = field(default_factory=set)
    answer_candidates: list[dict[str, str]] = field(default_factory=list)
    extraction_notes: list[str] = field(default_factory=list)

    def to_json(self) -> dict[str, Any]:
        return {
            "questionNumber": self.question_number,
            "section": self.section,
            "style": self.style,
            "marks": self.marks,
            "pageRefs": sorted(self.page_refs),
            "rawPrompt": clean_text("\n".join(self.prompt_lines)),
            "answerCandidates": self.answer_candidates,
            "extractionNotes": self.extraction_notes,
            "reviewStatus": "needs-review",
        }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create ignored raw question candidates from extracted exam and marking-guide text."
    )
    parser.add_argument("pack_ids", nargs="+", help="Source pack IDs to process, for example source-adv-2025.")
    args = parser.parse_args()

    input_root = Path("var/extracted-text")
    output_root = Path("var/question-candidates")
    output_root.mkdir(parents=True, exist_ok=True)

    for pack_id in args.pack_ids:
        pack_directory = input_root / pack_id
        if not pack_directory.exists():
            raise SystemExit(f"No extracted text found for {pack_id}. Run pnpm run data:extract-text first.")

        exam_path = find_one(pack_directory, "*exam-paper*.txt")
        marking_guide_path = find_one(pack_directory, "*marking-guide*.txt")

        candidates = extract_exam_candidates(exam_path)
        attach_marking_candidates(candidates, marking_guide_path)

        output = {
            "packId": pack_id,
            "sourceFiles": {
                "examPaperText": str(exam_path).replace("\\", "/"),
                "markingGuideText": str(marking_guide_path).replace("\\", "/"),
            },
            "candidateCount": len(candidates),
            "candidates": [candidate.to_json() for candidate in sorted(candidates.values(), key=question_sort_key)],
        }

        output_path = output_root / f"{pack_id}.json"
        output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Extracted {len(candidates)} question candidates -> {output_path}")


def find_one(directory: Path, pattern: str) -> Path:
    matches = sorted(directory.glob(pattern))
    if len(matches) != 1:
        raise SystemExit(f"Expected exactly one {pattern} file in {directory}, found {len(matches)}")
    return matches[0]


def extract_exam_candidates(exam_path: Path) -> dict[str, Candidate]:
    candidates: dict[str, Candidate] = {}
    current_page = 0
    current: Candidate | None = None
    in_section_i = False
    in_section_ii = False

    for raw_line in exam_path.read_text(encoding="utf-8").splitlines():
        line = normalise_line(raw_line)
        page_match = PAGE_RE.match(line)
        if page_match:
            current_page = int(page_match.group(1))
            continue

        if "Section II Answer Booklet" in line:
            in_section_i = False
            in_section_ii = True
            current = None
            continue

        if line == "Section I":
            in_section_i = True
            in_section_ii = False
            continue

        if not line or is_noise_line(line):
            continue

        if in_section_i:
            match = MULTIPLE_CHOICE_RE.match(line)
            if match and 1 <= int(match.group(1)) <= 10:
                current = Candidate(
                    question_number=match.group(1),
                    section="I",
                    style="multiple-choice",
                    marks=1,
                    prompt_lines=[match.group(2)],
                    page_refs={current_page},
                )
                candidates[current.question_number] = current
                continue

            if current:
                current.prompt_lines.append(line)
                current.page_refs.add(current_page)
            continue

        if in_section_ii:
            match = SECTION_II_QUESTION_RE.match(line)
            if match and not is_continuation_label(match.group(2)):
                question_number = match.group(1)
                current = candidates.get(question_number)
                if current is None:
                    current = Candidate(
                        question_number=question_number,
                        section="II",
                        style="short-answer" if int(question_number) < 24 else "extended-response",
                        marks=parse_marks(match.group(2)),
                        page_refs={current_page},
                    )
                    candidates[question_number] = current
                elif current.marks is None:
                    current.marks = parse_marks(match.group(2))
                continue

            if match and current and is_continuation_label(match.group(2)):
                current.page_refs.add(current_page)
                continue

            if current:
                current.prompt_lines.append(line)
                current.page_refs.add(current_page)

    for candidate in candidates.values():
        if candidate.raw_prompt_is_sparse():
            candidate.extraction_notes.append("Prompt may be sparse because the source page is diagram-heavy.")

    return candidates


def attach_marking_candidates(candidates: dict[str, Candidate], marking_guide_path: Path) -> None:
    current_page = 0
    answer_key: dict[str, str] = {}
    sections: dict[str, list[tuple[int, str]]] = {}
    current_key: str | None = None

    for raw_line in marking_guide_path.read_text(encoding="utf-8").splitlines():
        line = normalise_line(raw_line)
        page_match = PAGE_RE.match(line)
        if page_match:
            current_page = int(page_match.group(1))
            continue

        if not line:
            continue

        answer_key_match = ANSWER_KEY_RE.match(line)
        if answer_key_match:
            answer_key[answer_key_match.group(1)] = answer_key_match.group(2)
            continue

        question_match = MARKING_QUESTION_RE.match(line)
        if question_match:
            question_number = question_match.group(1)
            part = question_match.group(2)
            current_key = question_number if part is None else f"{question_number} ({part})"
            sections.setdefault(current_key, [])
            continue

        if current_key:
            sections[current_key].append((current_page, line))

    for question_number, answer in answer_key.items():
        candidate = candidates.get(question_number)
        if candidate:
            candidate.answer_candidates.append(
                {"kind": "multiple-choice-answer-key", "pageRef": "1", "rawText": answer}
            )

    for key, lines in sections.items():
        question_number = key.split(" ", 1)[0]
        candidate = candidates.get(question_number)
        if not candidate:
            continue

        page_refs = sorted({page for page, _ in lines if page > 0})
        candidate.answer_candidates.append(
            {
                "kind": "marking-guide-section",
                "questionPart": key,
                "pageRef": ",".join(map(str, page_refs)),
                "rawText": clean_text("\n".join(line for _, line in lines)),
            }
        )


def clean_text(value: str) -> str:
    value = re.sub(r"\n{3,}", "\n\n", value.strip())
    value = value.replace(".........................................................................................................................................", "")
    value = value.replace("...............................................................................................................................", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def normalise_line(line: str) -> str:
    return line.strip().replace("–", "-").replace("−", "-")


def is_noise_line(line: str) -> bool:
    return (
        line.startswith("Office Use Only")
        or line.startswith("Do NOT write")
        or line.startswith("Please turn over")
        or line.startswith("©")
        or bool(re.fullmatch(r"[0-9 ]{8,}", line))
        or bool(re.fullmatch(r"-\s*\d+\s*-", line))
    )


def is_continuation_label(value: str | None) -> bool:
    return value is not None and "continued" in value.lower()


def parse_marks(value: str | None) -> int | None:
    if value is None:
        return None
    match = re.search(r"(\d+)\s+marks?", value)
    return int(match.group(1)) if match else None


def question_sort_key(candidate: Candidate) -> int:
    return int(candidate.question_number)


def raw_prompt_is_sparse(self: Candidate) -> bool:
    return len(clean_text("\n".join(self.prompt_lines))) < 40


Candidate.raw_prompt_is_sparse = raw_prompt_is_sparse  # type: ignore[attr-defined]


if __name__ == "__main__":
    main()
