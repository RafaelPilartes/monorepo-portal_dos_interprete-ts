#!/usr/bin/env bash
# Recreates the annotated version tags of the continuous run and pushes them.
# The cloud session cannot push tags (docs/plan/auto-decisions.md, AD-002),
# so each step records its tag here. Run from a clone with push access:
#   git fetch origin dev && bash scripts/release-tags.sh
set -euo pipefail

create_tag() {
  local version="$1" commit="$2" message="$3"
  if git rev-parse -q --verify "refs/tags/${version}" >/dev/null; then
    echo "skip ${version}: already exists"
    return
  fi
  git cat-file -e "${commit}^{commit}" || { echo "missing commit ${commit} for ${version}; run git fetch origin dev" >&2; exit 1; }
  git tag -a "${version}" "${commit}" -m "${message}"
  echo "created ${version} -> ${commit}"
}

# --- tags (one line per closed step; appended by each step) ---
# TAGS-BEGIN
# TAGS-END

git push origin --tags
