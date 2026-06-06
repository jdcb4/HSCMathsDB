from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from pypdf import PdfReader


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract embedded PDF images into ignored var/extracted-images.")
    parser.add_argument("pack_ids", nargs="*", help="Optional source pack IDs to extract.")
    args = parser.parse_args()

    input_root = Path("var/source-assets")
    output_root = Path("var/extracted-images")
    if not input_root.exists():
        raise SystemExit("No cached PDFs found. Run pnpm run data:download-sources first.")

    pack_directories = [path for path in input_root.iterdir() if path.is_dir()]
    requested_pack_ids = set(args.pack_ids)
    if requested_pack_ids:
        pack_directories = [path for path in pack_directories if path.name in requested_pack_ids]
        found_pack_ids = {path.name for path in pack_directories}
        missing_pack_ids = sorted(requested_pack_ids - found_pack_ids)
        if missing_pack_ids:
            raise SystemExit(f"No cached PDFs found for: {', '.join(missing_pack_ids)}")

    output_root.mkdir(parents=True, exist_ok=True)
    for pack_directory in sorted(pack_directories):
        metadata: dict[str, Any] = {"packId": pack_directory.name, "documents": []}
        pack_output_root = output_root / pack_directory.name
        pack_output_root.mkdir(parents=True, exist_ok=True)

        for pdf_path in sorted(pack_directory.glob("*.pdf")):
            reader = PdfReader(str(pdf_path))
            document_output_root = pack_output_root / pdf_path.stem
            document_output_root.mkdir(parents=True, exist_ok=True)
            document_metadata = {"sourcePdf": str(pdf_path).replace("\\", "/"), "pageCount": len(reader.pages), "images": []}

            for page_index, page in enumerate(reader.pages, start=1):
                for image_index, image in enumerate(page.images, start=1):
                    extension = image.name.rsplit(".", 1)[-1] if "." in image.name else "bin"
                    output_name = f"page-{page_index:03d}-image-{image_index:02d}.{extension}"
                    output_path = document_output_root / output_name
                    output_path.write_bytes(image.data)
                    document_metadata["images"].append(
                        {
                            "page": page_index,
                            "name": image.name,
                            "path": str(output_path).replace("\\", "/"),
                            "bytes": len(image.data),
                        }
                    )

            metadata["documents"].append(document_metadata)
            print(f"{pdf_path.name}: extracted {len(document_metadata['images'])} embedded images")

        metadata_path = pack_output_root / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"Wrote image metadata -> {metadata_path}")


if __name__ == "__main__":
    main()
