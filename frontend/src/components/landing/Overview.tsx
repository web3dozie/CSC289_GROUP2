import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const Overview: React.FC = () => {
  const overviewContent = `# Project Overview — Task Line

Tagline: "Lock in. Get it done. Stay zen."

## Vision
A classy, local‑first task companion that's fast, private, and helps you lock in—so you finish what matters and enjoy the process.

## What It Is (Plain English)
- Runs entirely on your computer inside a local container (no cloud).
- Stores your data locally using a small database.
- You set a simple PIN to lock/unlock the app.
- Optional: an AI "coach chat" you can enable if you provide an AI API URL. If you don't, everything still works.

## Core Features (V1)
- Tasks: add, edit, delete with clear validation and inline errors.
- Organize: categories, drag‑to‑reorder, star/highlight important tasks.
- Dates: start / end (or due) dates; agenda‑style calendar.
- Views: fast List, visual Board (Todo → In‑Progress → Done), light Calendar (agenda), and Review (history & notes).
- Search & Filters: instant search; filters by category/status.
- Tutorial: first‑run guided tour (60–90s), learn‑by‑doing.
- Completion Notes (optional): prompt to capture a quick note when marking done.
- Estimates & Time: per‑task estimate; automatic "completed_at" timestamp. Optional focus timer you can open on demand.
- Analytics (local‑only): completions, streaks, estimate accuracy, category split.
- Safety: autosave, undo, export/import to a single JSON file.
- Privacy: local‑only by default; no internet required.

## Simple How‑To (Non‑Technical)
1) Set your PIN (4–8 digits).
2) You land on "Today." Click "Add task," type a title, press Enter.
3) Drag tasks to reorder; star to highlight.
4) Switch views: List (speed), Board (drag between stages), Calendar (see dates), Review (see what you finished).
5) Mark done. Optionally write a quick note about what you learned.
6) Open Chat if enabled and ask for help planning your day.
7) Export your data to a file whenever you want a backup.

## Views
- List: fast, keyboard‑friendly list with filters and search.
- Board: lanes for Todo / In‑Progress / Done; drag tasks across.
- Calendar (Agenda‑Only): date‑grouped list (Today, Tomorrow, This Week); quick "change date."
- Review: daily/weekly summaries, completion notes, simple charts.
- Chat (Optional): guided prompts (check‑ins, reviews, "split into steps").

## Optional Coach Chat ("Zedd Mode")
- Off by default; appears when you provide an AI API URL.
- Lives in a side panel; suggests top 3 for today; can turn thoughts into tasks.
- Completion reflections go to Review; end‑of‑day summary.
- Every AI action shows a preview and requires your confirmation.

## Data & Privacy
- Local‑only storage (SQLite). Nothing leaves your device unless you export.
- PIN lock: 4–8 digits. Auto‑lock after idle (default 10 minutes; configurable).
- Export/Import: one JSON bundle (tasks, categories, settings, journal). Optional raw DB backup for power users.

## Analytics (Compute‑on‑Read)
- Stats are calculated when you open Review/Analytics ("how many done this week," "estimate vs actual," etc.).
- This keeps the system simple and always up‑to‑date for V1.

## Accessibility (A11y) Baseline
- Keyboard navigable with visible focus and skip links.
- WCAG 2.1 AA contrast targets; reduced motion option.
- Semantic HTML; form labels, clear errors, screen‑reader friendly.
- Drag‑and‑drop has keyboard alternatives.

## Architecture (Decisive, Simple)
- Frontend: React 19, Vite, TypeScript, Tailwind, TanStack Router/Query.
- Backend: Modular monolith using Django + Django REST Framework (DRF).
- Database: SQLite (WAL mode) in the backend container.
- Packaging: Two containers (frontend, backend). No external services required.
- Tests: pytest/pytest‑django (backend) and Vitest/Testing Library (frontend).

### Backend Apps (Modules)
- auth: PIN set/verify; session via HTTP‑only cookie.
- tasks: tasks, categories, reorder, highlight, dates, estimates, completed_at.
- review: journal entries, completion notes, summaries/analytics (on read).
- settings: feature toggles (notes, timer, AI URL), themes, idle auto‑lock.
- timer (optional): start/pause/stop focus sessions linked to tasks.
- agent (optional): validates "tool" actions when AI chat is enabled.

### API Endpoints (High‑Level)
- /api/auth/*: set_pin, login, logout, change_pin
- /api/tasks/*: CRUD, reorder, highlight, categories, dates, estimates, complete
- /api/review/*: log/read journal; weekly/daily summaries
- /api/settings/*: get/set preferences (notes, timer, AI URL, auto‑lock)
- /api/timer/* (optional): focus session controls
- /api/agent/* (optional): propose/apply tool actions with confirmation

## Brand & Visuals
- Product name: Task Line.
- Visual tone: calm, premium, minimal.
- Colors: reuse the landing page palette from \`sample_frontend\`.
- Delight: subtle micro‑animations; clean typography; celebratory moments.

## Scope (V1)
- Everything listed under "Core Features," "Views," "Notes," "Estimates & Time," and "Analytics," plus PIN/auto‑lock, tutorial, export/import.
- Optional: Coach Chat and Focus Timer (off by default; user‑enabled).

## Out of Scope (V1)
- Multi‑user, collaboration, or cloud sync.
- Heavy calendar (full month/week grid) and scheduling automation.
- External telemetry or analytics.

## Success Metrics (V1)
- Reliability: core flows work offline; autosave/undo verified.
- Performance: cold start < 5 seconds on a student laptop; smooth drag‑and‑drop.
- Quality: ≥ 12 backend tests, ≥ 8 UI tests; accessibility checks pass.
- Packaging: one‑command container run; export/import verified.
- Docs: tutorial, user guide, and repo docs complete.

## Why This Wins
- Feels premium and effortless, yet fully private and offline.
- Balances "lock‑in" focus with calm design and optional coaching.
- Ambitious but achievable for a capstone with clear boundaries.

---

Questions welcome. This doc stays the single source of truth for scope and vision.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
                Task Line
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-md"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            <div className="prose prose-lg prose-purple max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-gray-700 mb-4 ml-6 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-gray-700 mb-4 ml-6 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-600 mb-4">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <hr className="border-gray-300 my-8" />
                  ),
                }}
              >
                {overviewContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Your data stays local and private
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Overview;