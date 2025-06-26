# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Alpine Route Optimizer - a Next.js application that uses AI-powered pathfinding to plan optimal mountain hiking routes. The application analyzes elevation data, calculates route difficulty, and provides visualization through interactive maps and elevation charts.

## Development Commands

Navigate to the `alpine-route-optimizer/` directory first:

```bash
cd alpine-route-optimizer
```

### Core Development
- `npm run dev` - Start development server with Turbopack (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### TypeScript
- TypeScript configuration uses strict mode with Next.js optimizations
- Path alias `@/*` maps to `./src/*`

## Architecture

### Core Algorithm
The application implements A* pathfinding algorithm for route optimization:
- **Pathfinding**: Located in `src/lib/algorithms/pathfinding.ts`
- Uses priority queue with heuristic cost calculation
- Factors in elevation gain, distance, and terrain steepness
- Falls back to direct route with elevation data if pathfinding fails

### Key Components
- **Route Input**: `src/components/forms/route-input-form.tsx` - User input for start/end coordinates
- **Visualization**: `src/components/ui/route-map.tsx` and `src/components/ui/elevation-chart.tsx`
- **Semantic UI**: `src/components/ui/semantic/` - Reusable semantic components like `<FindOptimalRouteButton>`
- **Constants**: `src/constants/` - Centralized text, styles, and color constants for consistency
- **Data Flow**: Main page (`src/app/page.tsx`) coordinates between input, pathfinding, and visualization

### External APIs
- **Elevation Data**: Uses Open-Meteo Elevation API (`src/lib/api/elevation.ts`)
- Fetches elevation points along route with configurable resolution
- Handles API failures gracefully with fallback elevation data

### Type System
Well-defined TypeScript interfaces in `src/types/`:
- `Coordinate` - Basic lat/lng with optional elevation
- `RoutePoint` - Extended coordinate with elevation and risk factors  
- `Route` - Complete route with metadata (distance, difficulty, time estimates)
- `PathfindingNode` - A* algorithm node structure

### Utility Functions
Located in `src/lib/utils/index.ts`:
- `calculateDistance()` - Haversine formula for geographic distance
- `calculateElevationGain()` - Sum positive elevation changes
- `cn()` - Tailwind CSS class merging utility

### Styling & Professional Architecture Standards
- Uses Tailwind CSS v4 with PostCSS
- Responsive design with mobile-first approach
- **Professional Design Patterns** - All code follows enterprise-level standards:
  - **Constants Architecture**: All text strings extracted to `src/constants/ui-text.ts` for internationalization
  - **Style Constants**: Reusable style patterns in `src/constants/styles.ts` and `src/constants/colors.ts`
  - **Semantic Components**: Logical UI elements extracted into semantic components (e.g., `<FindOptimalRouteButton>`)
  - **Consistency**: Avoid custom className repetition - use constants for reused styles
  - **Maintainability**: Components should be easily translatable and theme-able

### Commit Standards you MUST follow:
- Each commit should cover an atomic unit of work and be readable. Examples:
* d21ffe6 fix: improve input text visibility
* ed04e4b feat: create route input form with start/end coordinates
* c29e112 feat: add project structure and component organization
* e6c12e1 feat: initialize Next.js TypeScript project with Tailwind
- Never add the following to your commit messages: 
* 🤖 Generated with [Claude Code](https://claude.ai/code)
* Co-Authored-By: Claude <noreply@anthropic.com>"