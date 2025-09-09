# Momentum Landing Page

A classy, desktop-first landing page for the Momentum task management system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── landing/       # Landing page components
│   │       ├── Header.tsx
│   │       ├── Hero.tsx
│   │       ├── WhyDifferent.tsx
│   │       ├── Features.tsx
│   │       ├── Views.tsx
│   │       ├── CoachChat.tsx
│   │       ├── Tutorial.tsx
│   │       ├── Analytics.tsx
│   │       ├── Privacy.tsx
│   │       ├── FAQ.tsx
│   │       ├── CTA.tsx
│   │       └── Footer.tsx
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles & Tailwind
├── public/                # Static assets
├── tailwind.config.js     # Tailwind configuration
└── vite.config.ts         # Vite configuration
```

## Content Management

All landing page content is defined directly in the component files for easy editing:

- **Branding**: Default name is "Momentum" with alternatives shown in header/footer
- **Copy**: All text content follows the specifications in the components
- **Colors**: Purple-based palette defined in `tailwind.config.js`
- **Links**:
  - "Open App" → `/#/app` (placeholder)
  - "Read Overview" → `/OVERVIEW.md`
  - "Try Tutorial" → `/#/tutorial` (placeholder)

## Accessibility Features

- Skip to main content link
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Reduced motion support
- Sufficient color contrast

## Development

```bash
# Run development server (opens at http://localhost:5173)
npm run dev

# Type checking
npm run tsc

# Linting (if configured)
npm run lint
```

## Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

Built files will be in the `dist/` directory.

## Performance

- Desktop-first responsive design
- Optimized for fast loading
- Minimal JavaScript
- Tailwind CSS purging for small bundle size
- Lazy loading considerations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Desktop-optimized, tablet-responsive
- Graceful degradation for older browsers
