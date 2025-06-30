# Alpine Route Optimizer 🗻

An intelligent Next.js application that uses AI-powered pathfinding to plan optimal mountain hiking routes. The app analyzes elevation data, terrain complexity, and trail networks to generate safe, efficient routes with comprehensive visualization.

## ✨ Key Features

### 🧠 Advanced Pathfinding
- **A* Algorithm Implementation**: Sophisticated pathfinding with heuristic cost calculation
- **Terrain-Aware Routing**: Factors in elevation gain, slope steepness, and terrain complexity
- **Trail Integration**: Leverages OpenStreetMap trail data for realistic route planning
- **Multi-Modal Options**: Support for trails-only, roads-only, or mixed routing
- **Performance Optimized**: Modular architecture with efficient spatial indexing

### 🗺️ Interactive Visualization
- **Mapbox GL JS Integration**: Professional interactive terrain maps
- **Elevation Profiling**: Dynamic elevation charts with gradient visualization
- **Route Overlay**: Color-coded route segments based on elevation and difficulty
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Fallback Support**: Graceful degradation to static maps when needed

### ⚙️ Comprehensive Controls
- **Pathfinding Tuning**: Adjustable parameters for iterations, waypoints, and trail preferences
- **Route Preferences**: Configurable penalties and bonuses for different terrain types
- **Example Routes**: Pre-loaded routes for popular hiking destinations
- **Real-time Updates**: Live preview of route changes as parameters are adjusted

### 🎯 Smart Route Planning
- **Linear Route Detection**: Automatic detection and optimization for park/linear trails
- **Emergency Fallbacks**: Multiple fallback strategies for robust route generation
- **Trail Chaining**: Intelligent connection of trail segments for optimal paths
- **Cost Optimization**: Realistic hiking speed calculations using Tobler's function

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
- **State Management**: React hooks with optimized rendering

### Key Components
- **Route Input Form**: Coordinate input with validation and example routes
- **Pathfinding Engine**: Modular A* implementation with terrain analysis
- **Interactive Map**: Mapbox-powered visualization with elevation-colored routes  
- **Elevation Chart**: Dynamic profiling with gradient visualization
- **Control Panel**: Comprehensive pathfinding parameter tuning

### API Integration
- **Open-Meteo Elevation API**: High-resolution elevation data
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
- **Type Safety**: Comprehensive TypeScript interfaces and strict typing
- **Performance**: Optimized algorithms with spatial indexing and caching
- **Maintainability**: Constants-based architecture for easy localization
- **Professional Standards**: Enterprise-level code organization and patterns

## 🗺️ Route Planning Features

### Smart Pathfinding
- **Adaptive Step Sizing**: Variable resolution based on terrain complexity
- **Trail Detection**: Automatic snapping to established hiking paths
- **Safety Considerations**: Exponential penalties for dangerous slopes
- **Multi-Objective Optimization**: Balance distance, time, safety, and trail preference

### Route Types
- **Trail Routes**: Prioritize established hiking paths and trails
- **Road Routes**: Focus on roads and paved surfaces for accessibility
- **Mixed Routes**: Intelligent combination of trails and roads
- **Linear Routes**: Optimized for park environments and linear paths

### Visualization Options
- **Elevation Gradient**: Color-coded segments showing elevation changes
- **Interactive Controls**: Zoom, pan, and fullscreen map exploration
- **Route Metrics**: Distance, elevation gain, estimated time, and difficulty
- **Alternative Paths**: Multiple route options with different optimization goals

## 📊 Current Status

### ✅ Implemented Features
- Core A* pathfinding algorithm with terrain analysis
- Interactive Mapbox GL JS mapping with elevation visualization
- Comprehensive pathfinding controls and parameter tuning
- Trail data integration with OpenStreetMap
- Modular architecture with clean separation of concerns
- Professional UI with responsive design

### 🚧 Development Roadmap
See `DEVELOPMENT_TODO_LIST.md` for detailed enhancement plans:
- Enhanced terrain analysis with higher resolution data
- Advanced trail network optimization
- Multi-objective route optimization
- Weather and seasonal condition integration

## 🤝 Contributing

This project follows professional development standards:
- **Clean Commits**: Atomic commits with descriptive messages
- **Type Safety**: Comprehensive TypeScript coverage
- **Code Quality**: ESLint enforcement and professional patterns
- **Documentation**: Clear inline documentation and architectural decisions

## 📄 License

This project is available for educational and personal use. See repository for specific licensing terms.

---

**Built with ❤️ for the hiking and mountaineering community**