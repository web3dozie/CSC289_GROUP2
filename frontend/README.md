# Task Line Frontend

A compact frontend for Task Line. Built with React + TypeScript and Vite.

## Quick start

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

Notes:
- This project uses Vite and TypeScript. Use `npm run type-check` to run the TypeScript-only check.
- `pnpm` is also supported if you prefer it (`pnpm install`, `pnpm dev`, ...).

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Vitest + Testing Library for unit/QA tests

## Project structure (actual)

```
frontend/
├─ public/                    # Static assets (mockServiceWorker, icons)
├─ src/
│  ├─ components/
│  │  └─ landing/              # Landing & auth UI
│  │     ├─ Header.tsx
│  │     ├─ Hero.tsx
│  │     ├─ Overview.tsx
│  │     ├─ Login.tsx
│  │     ├─ SignUp.tsx
│  │     ├─ FAQ.tsx
│  │     ├─ CTA.tsx
│  │     ├─ Footer.tsx
│  │     └─ Tutorial.tsx
│  ├─ index.css
  │  └─ main.tsx
  └─ routes/
     └─ __root.tsx
├─ tailwind.config.js
├─ vite.config.ts
├─ package.json
└─ __tests__/                 # Vitest + Testing Library tests
```

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build
- `npm run preview` — preview built production files
- `npm run test` — run Vitest (use `test:ui` for the interactive UI)
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` — Prettier

## Testing

- Unit and component tests live in `frontend/__tests__/` and use Vitest + Testing Library.
- MSW (Mock Service Worker) is used to stub network calls during tests (`frontend/__tests__/mocks`).

## Accessibility & content

- Components include ARIA attributes, keyboard handling, and reduced-motion support where applicable.
- Copy/content is kept inside the landing components for now; consider extracting to a JSON/YAML content file if non-dev editing is needed.


