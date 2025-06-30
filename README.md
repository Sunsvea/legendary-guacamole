# Alpine Route Optimizer 🗻

A Next.js application that uses A* pathfinding to plan optimal mountain hiking routes. The app analyzes elevation data, terrain complexity, and trail networks to generate safe, efficient routes with interactive visualization.

## 🌐 Live Demo
Experience the app at: **[https://legendary-guacamole-dusky.vercel.app](https://legendary-guacamole-dusky.vercel.app)**

## Features

### Pathfinding
- **A\* Algorithm Implementation**: Pathfinding with heuristic cost calculation
- **Terrain-Aware Routing**: Factors in elevation gain, slope steepness, and terrain complexity
- **Trail Integration**: Uses OpenStreetMap trail data for route planning
- **Multi-Modal Options**: Support for trails-only, roads-only, or mixed routing
- **Modular Architecture**: Efficient spatial indexing and organized code structure

### Visualization
- **Mapbox GL JS Integration**: Interactive terrain maps
- **Elevation Profiling**: Elevation charts with gradient visualization
- **Route Overlay**: Color-coded route segments based on elevation and difficulty
- **Responsive Design**: Works on desktop and mobile
- **Fallback Support**: Static maps when interactive maps fail

### Controls
- **Parameter Tuning**: Adjustable settings for iterations, waypoints, and trail preferences
- **Route Preferences**: Configurable penalties and bonuses for different terrain types
- **Example Routes**: Pre-loaded routes for popular hiking destinations
- **Real-time Updates**: Live preview of route changes

### Route Planning
- **Linear Route Detection**: Automatic detection and optimization for park/linear trails
- **Fallback Strategies**: Multiple strategies for robust route generation
- **Trail Chaining**: Connection of trail segments for optimal paths
- **Cost Optimization**: Hiking speed calculations using Tobler's function

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Mapbox access token (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alpine-route-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_public_token_here
   ```
   Get your free Mapbox token at [mapbox.com](https://www.mapbox.com/)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Mapping**: Mapbox GL JS
- **State Management**: React hooks

### Key Components
- **Route Input Form**: Coordinate input with validation and example routes
- **Pathfinding Engine**: Modular A* implementation with terrain analysis
- **Interactive Map**: Mapbox visualization with elevation-colored routes  
- **Elevation Chart**: Profiling with gradient visualization
- **Control Panel**: Pathfinding parameter tuning

### API Integration
- **Open-Meteo Elevation API**: Elevation data
- **OpenStreetMap Overpass API**: Trail and path data
- **Mapbox APIs**: Terrain visualization and geocoding

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── app/                    # Next.js app router
├── components/            
│   ├── forms/             # Input forms and validation
│   ├── ui/                # Reusable UI components
│   └── semantic/          # Business logic components
├── lib/
│   ├── algorithms/        # Pathfinding implementation
│   │   └── pathfinding/   # Modular pathfinding components
│   └── api/               # External API integrations
├── types/                 # TypeScript interfaces
└── constants/             # UI text, styles, and colors
```

### Architecture Principles
- **Modular Design**: Clean separation of concerns with focused modules
- **Type Safety**: TypeScript interfaces and strict typing
- **Performance**: Optimized algorithms with spatial indexing and caching
- **Maintainability**: Constants-based architecture for easy localization

## Route Planning Features

### Pathfinding
- **Adaptive Step Sizing**: Variable resolution based on terrain complexity
- **Trail Detection**: Automatic snapping to established hiking paths
- **Safety Considerations**: Exponential penalties for dangerous slopes
- **Multi-Objective Optimization**: Balance distance, time, safety, and trail preference

### Route Types
- **Trail Routes**: Prioritize established hiking paths and trails
- **Road Routes**: Focus on roads and paved surfaces for accessibility
- **Mixed Routes**: Combination of trails and roads
- **Linear Routes**: Optimized for park environments and linear paths

### Visualization Options
- **Elevation Gradient**: Color-coded segments showing elevation changes
- **Interactive Controls**: Zoom, pan, and fullscreen map exploration
- **Route Metrics**: Distance, elevation gain, estimated time, and difficulty

## Current Status

### Implemented Features
- Core A* pathfinding algorithm with terrain analysis
- Interactive Mapbox GL JS mapping with elevation visualization
- Pathfinding controls and parameter tuning
- Trail data integration with OpenStreetMap
- Modular architecture with clean separation of concerns
- Responsive UI design

## License

This project is available for educational and personal use. See repository for specific licensing terms.
