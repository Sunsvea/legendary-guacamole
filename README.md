# Alpine Route Optimizer 🗻

[![Tests](https://github.com/Sunsvea/legendary-guacamole/actions/workflows/test.yml/badge.svg)](https://github.com/Sunsvea/legendary-guacamole/actions/workflows/test.yml)

A Next.js application that uses A* pathfinding to plan optimal mountain hiking routes. The app analyzes elevation data, terrain complexity, and trail networks to generate safe, efficient routes with interactive visualization.

## 🌐 Live Demo
Experience the app at: **[https://legendary-guacamole-dusky.vercel.app](https://legendary-guacamole-dusky.vercel.app)**


## Media

|<img width="400" alt="image" src="https://github.com/user-attachments/assets/a81c8929-be33-45d7-8087-48a6698854a7" />   |<img width="400" alt="image" src="https://github.com/user-attachments/assets/0f1a28e1-0f45-40f4-8b03-80f1a5ccdad5" />   |   
|---|---|
|<img width="400" alt="image" src="https://github.com/user-attachments/assets/1aa2dc4f-ec2e-43a6-9f5d-24ca2db06277" />   |<img width="400" alt="image" src="https://github.com/user-attachments/assets/e4abd247-8f95-475c-924a-dfd1678231ac" />   |   

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

### User Features
- **Authentication System**: Secure user registration and login with Supabase
- **Route Saving**: Save optimized routes to personal collection
- **Route Management**: Organize routes with custom names, tags, and privacy settings
- **Parameter Tuning**: Adjustable settings for iterations, waypoints, and trail preferences
- **Route Preferences**: Configurable penalties and bonuses for different terrain types
- **Example Routes**: Pre-loaded routes for popular hiking destinations

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
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   ```bash
   # Mapbox (required for maps)
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_public_token_here
   
   # Supabase (required for authentication and route saving)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   
   Get your tokens:
   - **Mapbox**: [mapbox.com](https://www.mapbox.com/) (free tier available)
   - **Supabase**: [supabase.com](https://supabase.com/) (free tier available)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

For production deployment, see the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

**Quick deployment checklist:**
1. Configure environment variables in your hosting platform
2. Deploy database tables to Supabase
3. Test authentication and route saving functionality

**Common hosting platforms:**
- **Vercel**: Automatic deployment with GitHub integration
- **Netlify**: Easy static site deployment
- **Railway/Render**: Full-stack hosting options

## 🏗️ Architecture

### Core Technologies
- **Framework**: Next.js 15 with App Router and TypeScript
- **Frontend**: React 19 with hooks and context for state management
- **Styling**: Tailwind CSS v4 with semantic component architecture
- **Mapping**: Mapbox GL JS for interactive terrain visualization
- **Backend**: Supabase for authentication, database, and real-time features
- **Database**: PostgreSQL with Row Level Security (RLS) policies
- **Testing**: Jest with React Testing Library w/ coverage

### Key Components
- **Authentication System**: User registration, login, and session management
- **Route Input Form**: Coordinate input with validation and example routes
- **Pathfinding Engine**: Modular A* implementation with terrain analysis
- **Interactive Map**: Mapbox visualization with elevation-colored routes  
- **Elevation Chart**: Profiling with gradient visualization
- **Route Summary Card**: Metrics display with integrated save functionality
- **Save Route Button**: Modal-based route saving with privacy controls
- **Control Panel**: Pathfinding parameter tuning and preferences

### API Integration
- **Supabase**: User authentication, route persistence, and real-time database
- **Open-Meteo Elevation API**: High-resolution elevation data for pathfinding
- **OpenStreetMap Overpass API**: Hiking trails and path network data
- **Mapbox APIs**: Interactive terrain visualization and geocoding services

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

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
- **Core A* pathfinding algorithm** with terrain analysis and Tobler's hiking function
- **Interactive Mapbox GL JS mapping** with elevation visualization and route overlay
- **User authentication system** with Supabase integration
- **Route persistence** - save, organize, and manage optimized routes
- **Pathfinding controls** and parameter tuning for customization
- **Trail data integration** with OpenStreetMap via Overpass API
- **Modular architecture** with clean separation of concerns and semantic components
- **Responsive UI design** with Tailwind CSS and professional styling
- **Test coverage** across all modules and components

### In Development
- User dashboard for route management
- Public route gallery for community browsing
- Enhanced terrain analysis with weather integration
- Advanced multi-objective optimization

