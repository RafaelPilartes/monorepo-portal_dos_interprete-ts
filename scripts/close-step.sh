#!/usr/bin/env bash
# Tags the current commit for a closed step and records the tag in
# scripts/release-tags.sh, because this session cannot push tags (AD-002).
#   bash scripts/close-step.sh v0.2.0 "step C (empty monorepo)" <tag-body-file>
set -euo pipefail
version="$1" summary="$2" body="$3"
commit="$(git rev-parse HEAD)"
git tag -a "$version" -F "$body" "$commit"
line="create_tag ${version} ${commit} \"${version} - ${summary}\""
python3 - "$line" <<'PY'
import sys
path = "scripts/release-tags.sh"
text = open(path).read()
open(path, "w").write(text.replace("# TAGS-END", sys.argv[1] + "\n# TAGS-END", 1))
PY
bash -n scripts/release-tags.sh
git add scripts/release-tags.sh
printf 'chore(release): record %s tag\n' "$version" > "${TMPDIR:-/tmp}/close-step-msg.txt"
git commit -q -F "${TMPDIR:-/tmp}/close-step-msg.txt"
echo "tagged ${version} at ${commit}"
