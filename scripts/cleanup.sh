#!/usr/bin/env bash
# Cleanup script to untrack generated artifacts (POSIX)

set -euo pipefail

COMMIT=false
if [ "${1:-}" = "--commit" ] || [ "${1:-}" = "-c" ]; then
  COMMIT=true
fi

paths=(
  "backend/htmlcov"
  "backend/.coverage"
  ".coverage"
  "backend/.pytest_cache"
  ".pytest_cache"
  "backend/__pycache__"
  "__pycache__"
  "frontend/dist"
  "frontend/coverage"
  "frontend/node_modules"
  "frontend/tsconfig.tsbuildinfo"
  ".venv"
  "backend/.venv"
)

echo "Starting cleanup: untrack build/test artifacts (won't delete local files)"
for p in "${paths[@]}"; do
  if [ -e "$p" ]; then
    echo "Untracking $p"
    git rm -r --cached "$p" >/dev/null 2>&1 || true
  else
    echo "Skipping (not found): $p"
  fi
done

echo "Adding .gitignore to index"
git add .gitignore

if [ "$COMMIT" = true ]; then
  msg='chore(cleanup): remove generated artifacts and stop tracking build/test caches'
  git commit -m "$msg"
  echo "Committed. Push the branch with: git push origin <branch>"
else
  echo "Index updated. Review changes with 'git status' and commit when ready."
fi

echo "Done. Run 'pytest -q' to ensure tests still pass."
