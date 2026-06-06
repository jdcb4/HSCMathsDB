from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Report ignored question candidate extraction status.")
    parser.add_argument("pack_ids", nargs="*", help="Optional source pack IDs to report.")
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

    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        candidates = data["candidates"]
        answer_counts = [len(candidate["answerCandidates"]) for candidate in candidates]
        needs_review = sum(1 for candidate in candidates if candidate["reviewStatus"] == "needs-review")
        sparse_prompts = sum(
            1
            for candidate in candidates
            if any("sparse" in note.lower() for note in candidate.get("extractionNotes", []))
        )

        print(
            f"{data['packId']}: {len(candidates)} candidates, "
            f"{sum(answer_counts)} answer candidate sections, "
            f"{needs_review} needing review, "
            f"{sparse_prompts} sparse prompts"
        )


if __name__ == "__main__":
    main()
