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

### Testing
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### TypeScript
- TypeScript configuration uses strict mode with Next.js optimizations
- Path alias `@/*` maps to `./src/*`

### Testing Framework
- **Jest** with React Testing Library for unit testing
- **Test Coverage**: 16 test files covering core algorithms, utilities, types, and constants
- **Test Structure**: Tests located in `__tests__` directories alongside source files
- **Testing Philosophy**: Focus on algorithm correctness, API integration, and type validation

## Architecture

### Core Algorithm
The application implements A* pathfinding algorithm for route optimization:
- **Main Pathfinding**: `src/lib/algorithms/pathfinding.ts` - Coordinates pathfinding workflow
- **Modular Architecture**: Broken into focused components for maintainability:
  - `pathfinding/utilities.ts` - Core A* utilities, movement cost, and heuristics
  - `pathfinding/trail-detection.ts` - Trail detection, chaining, and linear route optimization
  - `pathfinding/terrain/terrain-analyzer.ts` - Terrain analysis with Tobler's function
  - `pathfinding/data-structures/priority-queue.ts` - Optimized priority queue implementation
- Uses priority queue with heuristic cost calculation
- Factors in elevation gain, distance, terrain steepness, and trail availability
- Multiple fallback strategies for robust route generation
- **Development Roadmap**: See `DEVELOPMENT_TODO_LIST.md` for planned enhancements

### Key Components
- **Route Input**: `src/components/forms/route-input-form.tsx` - User input with validation and example routes
- **Interactive Map**: `src/components/ui/route-map.tsx` - Mapbox GL JS integration with elevation-colored routes
- **Elevation Chart**: `src/components/ui/elevation-chart.tsx` - Dynamic profiling with gradient visualization
- **Pathfinding Controls**: `src/components/ui/pathfinding-controls.tsx` - Parameter tuning
- **Semantic UI**: `src/components/ui/semantic/` - Business logic components like `<FindOptimalRouteButton>`
- **Constants**: `src/constants/` - Centralized text, styles, and color constants for i18n
- **Types**: `src/types/` - TypeScript interfaces for pathfinding and route data
- **Data Flow**: Main page (`src/app/page.tsx`) coordinates between input, pathfinding, and visualization

### External APIs
- **Elevation Data**: Open-Meteo Elevation API (`src/lib/api/elevation.ts`) with configurable resolution
- **Trail Data**: OpenStreetMap Overpass API (`src/lib/api/trails.ts`) for hiking paths and trails
- **Mapbox Integration**: Interactive terrain maps with Mapbox GL JS (`src/components/ui/route-map.tsx`)
- **Spatial Indexing**: Efficient trail lookup with spatial optimization for performance
- Handles API failures gracefully with multiple fallback strategies
- Full Mapbox API access for advanced terrain analysis (see `DEVELOPMENT_TODO_LIST.md`)

### Type System
Well-defined TypeScript interfaces in `src/types/`:
- `Coordinate` - Basic lat/lng with optional elevation
- `RoutePoint` - Extended coordinate with elevation and risk factors  
- `Route` - Complete route with metadata (distance, difficulty, time estimates)
- `PathfindingNode` - A* algorithm node structure with parent tracking
- `PathfindingOptions` - Configuration for algorithm tuning
- `TrailSegment` & `TrailNetwork` - Trail data structures with spatial indexing
- `TerrainType` - Enum for different terrain classifications

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

## Development Planning

### Current Status & Priorities
**✅ Recently Completed:**
- Modular pathfinding architecture with clean separation of concerns
- Comprehensive trail integration with OpenStreetMap data
- Terrain analysis module with Tobler's hiking function
- Interactive Mapbox GL JS mapping with elevation visualization
- Advanced pathfinding controls with real-time parameter tuning

**🚧 Current Focus:**
See `DEVELOPMENT_TODO_LIST.md` for the enhancement roadmap:
- **Phase 1**: Enhanced terrain analysis with higher resolution data
- **Phase 2**: Advanced trail network optimization and chaining
- **Phase 3**: Multi-objective optimization (distance, time, safety, scenic value)
- **Phase 4**: Weather integration and seasonal condition awareness

### Commit Standards you MUST follow:
- Each commit should cover an atomic unit of work and be readable. Examples:
* d21ffe6 fix: improve input text visibility
* ed04e4b feat: create route input form with start/end coordinates
* c29e112 feat: add project structure and component organization
* e6c12e1 feat: initialize Next.js TypeScript project with Tailwind
- Never add the following to your commit messages: 
* 🤖 Generated with [Claude Code](https://claude.ai/code)
* Co-Authored-By: Claude <noreply@anthropic.com>"