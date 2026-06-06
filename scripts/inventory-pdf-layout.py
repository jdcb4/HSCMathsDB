from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import fitz
except ImportError as exc:  # pragma: no cover - exercised by local environment setup
    raise SystemExit("PyMuPDF is required. Install it with `python -m pip install PyMuPDF`.") from exc


Rect = tuple[float, float, float, float]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inventory cached PDF page text, images, and vector drawing bounds into ignored JSON."
    )
    parser.add_argument("pack_ids", nargs="*", help="Optional source pack IDs to inventory.")
    parser.add_argument("--all-documents", action="store_true", help="Include marking guides and feedback PDFs.")
    parser.add_argument("--pages", help="Optional 1-based page list/ranges, for example 2-5,8.")
    args = parser.parse_args()

    input_root = Path("var/source-assets")
    output_root = Path("var/layout-inventory")
    if not input_root.exists():
        raise SystemExit("No cached PDFs found. Run pnpm run data:download-sources first.")

    pack_directories = select_pack_directories(input_root, set(args.pack_ids))
    output_root.mkdir(parents=True, exist_ok=True)

    for pack_directory in pack_directories:
        pack_output_root = output_root / pack_directory.name
        pack_output_root.mkdir(parents=True, exist_ok=True)
        metadata: dict[str, Any] = {
            "packId": pack_directory.name,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "documents": [],
        }

        for pdf_path in select_pdfs(pack_directory, args.all_documents):
            document_metadata = inventory_document(pdf_path, args.pages)
            metadata["documents"].append(document_metadata)
            document_path = pack_output_root / f"{pdf_path.stem}.json"
            document_path.write_text(json.dumps(document_metadata, indent=2), encoding="utf-8")
            print(
                f"{pdf_path.name}: inventoried {len(document_metadata['pages'])}/"
                f"{document_metadata['pageCount']} page(s)"
            )

        metadata_path = pack_output_root / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"Wrote layout inventory -> {metadata_path}")


def select_pack_directories(input_root: Path, requested_pack_ids: set[str]) -> list[Path]:
    pack_directories = [path for path in input_root.iterdir() if path.is_dir()]
    if requested_pack_ids:
        pack_directories = [path for path in pack_directories if path.name in requested_pack_ids]
        found_pack_ids = {path.name for path in pack_directories}
        missing_pack_ids = sorted(requested_pack_ids - found_pack_ids)
        if missing_pack_ids:
            raise SystemExit(f"No cached PDFs found for: {', '.join(missing_pack_ids)}")
    return sorted(pack_directories)


def select_pdfs(pack_directory: Path, include_all_documents: bool) -> list[Path]:
    pdfs = sorted(pack_directory.glob("*.pdf"))
    if not include_all_documents:
        pdfs = [pdf for pdf in pdfs if "exam-paper" in pdf.name]
    if not pdfs:
        raise SystemExit(f"No cached PDF files found in {pack_directory}")
    return pdfs


def inventory_document(pdf_path: Path, page_filter: str | None) -> dict[str, Any]:
    document = fitz.open(pdf_path)
    selected_pages = resolve_pages(document.page_count, page_filter)
    pages: list[dict[str, Any]] = []

    for page_number in selected_pages:
        page = document.load_page(page_number - 1)
        text_dict = page.get_text("dict")
        text_blocks = extract_text_blocks(text_dict)
        image_blocks = extract_image_blocks(text_dict)
        drawings = extract_drawings(page)
        drawing_clusters = cluster_rects([drawing["bbox"] for drawing in drawings])

        pages.append(
            {
                "page": page_number,
                "width": round(page.rect.width, 3),
                "height": round(page.rect.height, 3),
                "textBlocks": text_blocks,
                "imageBlocks": image_blocks,
                "drawings": drawings,
                "drawingClusters": drawing_clusters,
            }
        )

    return {
        "sourcePdf": normalise_path(pdf_path),
        "pageCount": document.page_count,
        "pages": pages,
    }


def resolve_pages(page_count: int, pages: str | None) -> list[int]:
    if not pages:
        return list(range(1, page_count + 1))

    requested: set[int] = set()
    for part in pages.split(","):
        text = part.strip()
        if not text:
            continue
        start_text, _, end_text = text.partition("-")
        start = int(start_text)
        end = int(end_text) if end_text else start
        if start < 1 or end < start or end > page_count:
            raise SystemExit(f"Invalid --pages range {text!r} for {page_count}-page document")
        requested.update(range(start, end + 1))
    return sorted(requested)


def extract_text_blocks(text_dict: dict[str, Any]) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    for block in text_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        text = " ".join(
            span.get("text", "").strip()
            for line in block.get("lines", [])
            for span in line.get("spans", [])
            if span.get("text", "").strip()
        ).strip()
        if text:
            blocks.append({"bbox": rounded_rect(block["bbox"]), "text": text})
    return blocks


def extract_image_blocks(text_dict: dict[str, Any]) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    for block in text_dict.get("blocks", []):
        if block.get("type") != 1:
            continue
        blocks.append(
            {
                "bbox": rounded_rect(block["bbox"]),
                "width": block.get("width"),
                "height": block.get("height"),
                "extension": block.get("ext"),
                "bytes": block.get("size"),
            }
        )
    return blocks


def extract_drawings(page: fitz.Page) -> list[dict[str, Any]]:
    drawings: list[dict[str, Any]] = []
    for drawing in page.get_drawings():
        rect = drawing.get("rect")
        if not rect or rect.is_empty or rect.is_infinite:
            continue
        bbox = rounded_rect((rect.x0, rect.y0, rect.x1, rect.y1))
        if rect_area(bbox) <= 1:
            continue
        drawings.append(
            {
                "bbox": bbox,
                "itemCount": len(drawing.get("items", [])),
                "hasFill": drawing.get("fill") is not None,
                "hasStroke": drawing.get("color") is not None,
            }
        )
    return drawings


def cluster_rects(rects: list[list[float]], tolerance: float = 10) -> list[dict[str, Any]]:
    clusters: list[dict[str, Any]] = []
    for rect in rects:
        current: Rect = tuple(rect)  # type: ignore[assignment]
        merged = False
        for cluster in clusters:
            if rects_overlap_or_near(tuple(cluster["bbox"]), current, tolerance):
                cluster["bbox"] = rounded_rect(union_rect(tuple(cluster["bbox"]), current))
                cluster["pathCount"] += 1
                merged = True
                break
        if not merged:
            clusters.append({"bbox": rounded_rect(current), "pathCount": 1})

    changed = True
    while changed:
        changed = False
        output: list[dict[str, Any]] = []
        for cluster in clusters:
            target = next(
                (
                    candidate
                    for candidate in output
                    if rects_overlap_or_near(tuple(candidate["bbox"]), tuple(cluster["bbox"]), tolerance)
                ),
                None,
            )
            if target:
                target["bbox"] = rounded_rect(union_rect(tuple(target["bbox"]), tuple(cluster["bbox"])))
                target["pathCount"] += cluster["pathCount"]
                changed = True
            else:
                output.append(cluster)
        clusters = output

    return sorted(
        (
            {**cluster, "area": round(rect_area(tuple(cluster["bbox"])), 3)}
            for cluster in clusters
            if rect_area(tuple(cluster["bbox"])) > 1
        ),
        key=lambda cluster: (cluster["bbox"][1], cluster["bbox"][0]),
    )


def rects_overlap_or_near(left: Rect, right: Rect, tolerance: float) -> bool:
    return not (
        left[2] + tolerance < right[0]
        or right[2] + tolerance < left[0]
        or left[3] + tolerance < right[1]
        or right[3] + tolerance < left[1]
    )


def union_rect(left: Rect, right: Rect) -> Rect:
    return (
        min(left[0], right[0]),
        min(left[1], right[1]),
        max(left[2], right[2]),
        max(left[3], right[3]),
    )


def rect_area(rect: Rect | list[float]) -> float:
    return max(0, rect[2] - rect[0]) * max(0, rect[3] - rect[1])


def rounded_rect(rect: Rect | tuple[float, float, float, float]) -> list[float]:
    return [round(value, 3) for value in rect]


def normalise_path(path: Path) -> str:
    return str(path).replace("\\", "/")


if __name__ == "__main__":
    main()
