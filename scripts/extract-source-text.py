from __future__ import annotations

import argparse
from pathlib import Path

from pypdf import PdfReader


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract text from cached source PDFs into var/extracted-text.")
    parser.add_argument("pack_ids", nargs="*", help="Optional source pack IDs to extract.")
    args = parser.parse_args()

    input_root = Path("var/source-assets")
    output_root = Path("var/extracted-text")

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
        output_directory = output_root / pack_directory.name
        output_directory.mkdir(parents=True, exist_ok=True)

        for pdf_path in sorted(pack_directory.glob("*.pdf")):
            reader = PdfReader(str(pdf_path))
            pages = []

            for index, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                pages.append(f"--- page {index} ---\n{text.strip()}\n")

            output_path = output_directory / f"{pdf_path.stem}.txt"
            output_path.write_text("\n".join(pages), encoding="utf-8")
            print(f"Extracted {len(reader.pages)} pages -> {output_path}")


if __name__ == "__main__":
    main()
