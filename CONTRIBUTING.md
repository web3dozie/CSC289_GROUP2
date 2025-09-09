# Contributing to Task Line

This doc explains how we work together. Keep it simple, predictable, and kind.

## Branch Model
- `main`: Stable, release‑ready (protected).
- `dev`: Team integration branch (protected).
- Personal named branches: one per developer (e.g., `dozie`, `natiza`, `john`, etc.).
- No feature branches. Work happens on your named branch, then PR into `dev`.
- Releases: PR `dev` → `main` when we’re ready.

## Protections & Reviews
- No force‑push on `dev`/`main`.
- Reviews required: 1 reviewer for PRs into `dev`; 2 reviewers for PRs into `main`.
- CI must be green before merge on `dev`/`main`.

## Commits & Merges
- Use Conventional Commits for clear history:
  - `feat(tasks): add drag-to-reorder`
  - `fix(auth): show error on wrong pin`
  - `docs(readme): add quick start`
  - Types: feat, fix, docs, chore, refactor, test, perf, build, ci
- Squash merge PRs (one clean commit per PR) to keep history tidy.

## Trello‑First Workflow (Free Tier Friendly)
- Source of truth: Trello board.
- For each change, include a Trello card link in the PR description.
- Attach the PR link back on the Trello card (Power‑Up or plain link).
- Optional automations (Butler) if available on free tier; otherwise move cards manually.

## Code Style & Tooling
- Backend: Black (format), Ruff (lint), isort (imports), pytest.
- Frontend: Prettier (format), ESLint (lint), Vitest + Testing Library.
- Pre‑commit hooks: We’ll add configs so these run automatically before commits.

## CI (GitHub Actions)
- Lint + test for backend and frontend on PRs to `dev` and `main`.
- Build landing on every PR (fast check).

## How to Propose Changes
1) Pick up a Trello card.
2) Do work on your named branch.
3) Open a PR to `dev` with:
   - Clear title (Conventional Commits style)
   - Description with screenshots (if UI) + Trello link
   - What changed, how to test
4) Request review. Address feedback.
5) Squash merge when approved and CI passes.

## Local Environment
- Python: 3.12+ (or 3.13 if team agrees)
- Node: 20+, pnpm recommended
- Containers: Docker Desktop (for compose)

## License
Open source (team to confirm license file).

Be respectful, ship small PRs, and keep the docs fresh. 💛
