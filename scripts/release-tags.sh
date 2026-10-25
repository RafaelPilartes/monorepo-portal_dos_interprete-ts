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
create_tag v0.1.0 077134322982da714e6e5fd1e9c79d62974639e9 "v0.1.0 - steps A and B (2026-10-25)"
create_tag v0.2.0 e847394cbd34fa032d3db9e01a5fec86655e1573 "v0.2.0 - step C, empty monorepo (2026-10-25)"
create_tag v0.3.0 7c9988d3e4f44a11bcfd755332520b228dc40aaa "v0.3.0 - step D1, site-web moved (2026-10-25)"
create_tag v0.4.0 ff501169798ac99dd860da041339543773bd9f5b "v0.4.0 - step D2, admin-web moved (2026-10-25)"
create_tag v0.5.0 ad16ab05f49bf8ebcd4eea5ee3c683bbd7c1785e "v0.5.0 - step D3, requester-web moved (2026-10-25)"
create_tag v0.6.0 03035dc862e410abe4314b5da44d0ad49b73ceda "v0.6.0 - step D4, interpreter-web moved, old SPA deleted (2026-10-25)"
create_tag v0.7.0 623ee1dc6bdf8307d957919daf9419d86111312e "v0.7.0 - step E, shared packages (2026-10-25)"
create_tag v0.8.0 509075b9efd2de3bfa42313118ef6b744f6881b1 "v0.8.0 - step F, local database (2026-10-25)"
create_tag v0.9.0 c81d193c9f23aad8ccb3678944dbe6b2922efa2b "v0.9.0 - step G, API (2026-10-25)"
create_tag v0.10.0 e98efb6ccfbcdcaa43d171194d5ce933137f15e9 "v0.10.0 - step H1, staff, configuration and audit (2026-10-25)"
# TAGS-END

git push origin --tags
