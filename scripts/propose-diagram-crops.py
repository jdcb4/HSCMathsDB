from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create reviewable crop proposals from PDF layout inventory and rendered page metadata."
    )
    parser.add_argument("pack_ids", nargs="*", help="Optional source pack IDs to process.")
    parser.add_argument("--padding", type=float, default=16, help="Padding around proposed bounds, in PDF points.")
    parser.add_argument("--min-width", type=float, default=35, help="Minimum proposal width in PDF points.")
    parser.add_argument("--min-height", type=float, default=18, help="Minimum proposal height in PDF points.")
    parser.add_argument("--min-area", type=float, default=600, help="Minimum proposal area in PDF points.")
    parser.add_argument("--min-drawing-paths", type=int, default=4, help="Minimum vector paths for drawing proposals.")
    args = parser.parse_args()

    inventory_root = Path("var/layout-inventory")
    render_root = Path("var/rendered-pages")
    output_root = Path("var/diagram-crop-proposals")
    if not inventory_root.exists():
        raise SystemExit("No layout inventory found. Run pnpm run data:inventory-layout first.")
    if not render_root.exists():
        raise SystemExit("No rendered pages found. Run pnpm run data:render-pages first.")

    pack_directories = select_pack_directories(inventory_root, set(args.pack_ids))
    output_root.mkdir(parents=True, exist_ok=True)

    for pack_directory in pack_directories:
        render_metadata = read_render_metadata(render_root, pack_directory.name)
        inventory = json.loads((pack_directory / "metadata.json").read_text(encoding="utf-8"))
        proposals = build_pack_proposals(inventory, render_metadata, args)

        pack_output_root = output_root / pack_directory.name
        pack_output_root.mkdir(parents=True, exist_ok=True)
        metadata = {
            "packId": pack_directory.name,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "proposalCount": len(proposals),
            "proposals": proposals,
        }
        metadata_path = pack_output_root / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"{pack_directory.name}: wrote {len(proposals)} crop proposal(s) -> {metadata_path}")


def select_pack_directories(input_root: Path, requested_pack_ids: set[str]) -> list[Path]:
    pack_directories = [path for path in input_root.iterdir() if path.is_dir()]
    if requested_pack_ids:
        pack_directories = [path for path in pack_directories if path.name in requested_pack_ids]
        found_pack_ids = {path.name for path in pack_directories}
        missing_pack_ids = sorted(requested_pack_ids - found_pack_ids)
        if missing_pack_ids:
            raise SystemExit(f"No layout inventory found for: {', '.join(missing_pack_ids)}")
    return sorted(pack_directories)


def read_render_metadata(render_root: Path, pack_id: str) -> dict[str, Any]:
    metadata_path = render_root / pack_id / "metadata.json"
    if not metadata_path.exists():
        raise SystemExit(f"No render metadata found for {pack_id}. Run pnpm run data:render-pages -- {pack_id}.")
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def build_pack_proposals(inventory: dict[str, Any], render_metadata: dict[str, Any], args: Any) -> list[dict[str, Any]]:
    render_lookup = build_render_lookup(render_metadata)
    scale = float(render_metadata["scale"])
    proposals: list[dict[str, Any]] = []

    for document in inventory["documents"]:
        document_key = Path(document["sourcePdf"]).stem
        for page in document["pages"]:
            rendered_page = render_lookup.get((document_key, page["page"]))
            if not rendered_page:
                continue
            for index, candidate in enumerate(visual_candidates(page), start=1):
                bbox = candidate["bbox"]
                if should_skip_candidate(candidate, page["width"], page["height"], args):
                    continue
                crop = bbox_to_crop(bbox, page["width"], page["height"], scale, args.padding)
                proposal_id = f"{document_key}-p{page['page']:03d}-{index:02d}"
                proposals.append(
                    {
                        "id": proposal_id,
                        "sourcePdf": document["sourcePdf"],
                        "page": page["page"],
                        "renderedPagePath": rendered_page["path"],
                        "reason": candidate["reason"],
                        "reviewStatus": "needs-review",
                        "bboxPoints": [round(value, 3) for value in bbox],
                        "crop": crop,
                        "cropCommand": crop_command(rendered_page["path"], proposal_id, crop),
                    }
                )

    return proposals


def build_render_lookup(render_metadata: dict[str, Any]) -> dict[tuple[str, int], dict[str, Any]]:
    lookup: dict[tuple[str, int], dict[str, Any]] = {}
    for document in render_metadata["documents"]:
        key = Path(document["sourcePdf"]).stem
        for page in document["renderedPages"]:
            lookup[(key, int(page["page"]))] = page
    return lookup


def visual_candidates(page: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for block in page.get("imageBlocks", []):
        candidates.append({"bbox": tuple(block["bbox"]), "reason": "embedded-image"})
    for cluster in page.get("drawingClusters", []):
        candidates.append(
            {
                "bbox": tuple(cluster["bbox"]),
                "reason": f"vector-drawing-cluster:{cluster['pathCount']}",
                "pathCount": cluster["pathCount"],
            }
        )
    return candidates


def should_skip_candidate(candidate: dict[str, Any], page_width: float, page_height: float, args: Any) -> bool:
    if candidate["reason"].startswith("vector-drawing-cluster") and candidate.get("pathCount", 0) < args.min_drawing_paths:
        return True

    bbox = candidate["bbox"]
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    area = width * height
    page_area = page_width * page_height

    if width < args.min_width or height < args.min_height or area < args.min_area:
        return True
    if area > page_area * 0.75:
        return True
    if height < 12 and width > 250:
        return True
    return False


def bbox_to_crop(
    bbox: tuple[float, float, float, float],
    page_width: float,
    page_height: float,
    scale: float,
    padding: float,
) -> dict[str, int]:
    x0 = max(0, bbox[0] - padding)
    y0 = max(0, bbox[1] - padding)
    x1 = min(page_width, bbox[2] + padding)
    y1 = min(page_height, bbox[3] + padding)
    return {
        "x": math.floor(x0 * scale),
        "y": math.floor(y0 * scale),
        "width": math.ceil((x1 - x0) * scale),
        "height": math.ceil((y1 - y0) * scale),
    }


def crop_command(rendered_page_path: str, proposal_id: str, crop: dict[str, int]) -> str:
    output = f"var/diagram-crops/{proposal_id}.png"
    return (
        "pnpm run data:crop-render -- "
        f"--input \"{rendered_page_path}\" "
        f"--x {crop['x']} --y {crop['y']} --width {crop['width']} --height {crop['height']} "
        f"--output \"{output}\" --review-status needs-review"
    )


if __name__ == "__main__":
    main()
