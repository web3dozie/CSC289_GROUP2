<#
.SYNOPSIS
    Cleanup tracked generated artifact files and update git index to stop tracking them.

.DESCRIPTION
    This script untracks common build / cache / coverage artifacts and commits the index change if requested.
    It does NOT delete your local files; it only removes them from the git index so they will no longer be versioned.

    Usage: .\scripts\cleanup.ps1 -Commit
#>

param(
    [switch]$Commit
)

Write-Output "Starting repository cleanup: untrack build/test artifacts (won't delete local files)"

$paths = @(
    'backend/htmlcov',
    'backend/.coverage',
    '.coverage',
    'backend/.pytest_cache',
    '.pytest_cache',
    'backend/__pycache__',
    '__pycache__',
    'frontend/dist',
    'frontend/coverage',
    'frontend/node_modules',
    'frontend/tsconfig.tsbuildinfo',
    '.venv',
    'backend/.venv'
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Output "Untracking $p"
        git rm -r --cached $p | Out-Null
    }
    else {
        Write-Output "Skipping (not found): $p"
    }
}

Write-Output "Adding updated .gitignore to index"
git add .gitignore | Out-Null

if ($Commit) {
    $m = 'chore(cleanup): remove generated artifacts and stop tracking build/test caches'
    Write-Output "Committing: $m"
    git commit -m $m
    Write-Output "Done. Please push your branch with 'git push origin <branch>'"
}
else {
    Write-Output "Index updated. Review the changes and run 'git commit -m "chore(cleanup): remove generated artifacts"' to commit."
}

Write-Output "Cleanup done. Run 'git status' to verify the changes and 'pytest -q' to ensure tests still pass."
