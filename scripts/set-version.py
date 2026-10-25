#!/usr/bin/env python3
"""Set the single monorepo version in every package.json (architecture.md §9).

    python3 scripts/set-version.py 0.3.0
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    if len(sys.argv) != 2 or not re.fullmatch(r"\d+\.\d+\.\d+", sys.argv[1]):
        print("usage: set-version.py X.Y.Z", file=sys.stderr)
        return 2
    version = sys.argv[1]
    manifests = [ROOT / "package.json", ROOT / "legacy" / "package.json"]
    manifests += sorted(ROOT.glob("apps/*/package.json")) + sorted(ROOT.glob("packages/*/package.json"))
    for manifest in manifests:
        if not manifest.is_file():
            continue
        text = manifest.read_text()
        updated, count = re.subn(r'("version":\s*)"[^"]*"', rf'\g<1>"{version}"', text, count=1)
        if count != 1:
            print(f"no version field in {manifest.relative_to(ROOT)}", file=sys.stderr)
            return 1
        json.loads(updated)
        manifest.write_text(updated)
        print(f"{manifest.relative_to(ROOT)} -> {version}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
