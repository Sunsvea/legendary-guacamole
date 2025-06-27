# Alpine Route Optimizer - Development TODO List

## 🗻 **Terrain-Aware Alpine Pathfinding Plan**

### **Current Issues Analysis**
The existing algorithm has these limitations:
1. **Straight-line bias**: Falls back to direct interpolation between start/end
2. **Simplistic terrain costs**: Only basic elevation difference penalties
3. **Limited search space**: 8-direction grid with 220m steps
4. **No real-world constraints**: Ignores cliffs, water, dangerous terrain
5. **Missing trail data**: Doesn't leverage existing hiking paths

---

## 🎯 **Phase 1: Enhanced Terrain Analysis**

### **1.1 Realistic Hiking Cost Model**
```typescript
interface TerrainCost {
  slope: number;        // Grade percentage
  surface: string;      // rock, trail, vegetation, scree
  difficulty: number;   // 1-5 scale
  timeMultiplier: number; // Speed reduction factor
}
```

**Implementation:**
- [ ] **Slope analysis**: Calculate grade percentage (rise/run × 100)
- [ ] **Tobler's hiking function**: Use proven formula for hiking speed on slopes
- [ ] **Terrain penalties**: Different costs for different surface types
- [ ] **Safety factors**: Exponential cost increase for dangerous grades (>45°)

### **1.2 Multi-Source Elevation Data**
- [ ] **Current**: Open-Meteo (90m resolution)
- [ ] **Enhanced**: Integrate higher resolution DEM data
- [ ] **Validation**: Cross-reference multiple elevation sources
- [ ] **Interpolation**: Improved algorithms for between-point elevation

---

## 🗺️ **Phase 2: Trail Integration** 

### **2.1 OpenStreetMap Trail Data**
```typescript
interface TrailSegment {
  coordinates: Coordinate[];
  difficulty: 'easy' | 'moderate' | 'difficult' | 'expert';
  surface: string;
  trail_visibility: string;
  sac_scale?: string; // Swiss Alpine Club scale
}
```

**Benefits:**
- [ ] **Existing paths**: Leverage established, safe routes
- [ ] **Local knowledge**: Trails represent accumulated hiking wisdom
- [ ] **Cost reduction**: Lower movement costs on marked trails
- [ ] **Safety**: Avoid cliff faces, loose rock, unmarked terrain

### **2.2 Mapbox Terrain Data**
Since you have full Mapbox API access, we can use:
- [ ] **Terrain RGB tiles**: High-resolution elevation data
- [ ] **Land cover data**: Vegetation, water, rock classification
- [ ] **Contour analysis**: Identify ridges, valleys, saddles

---

## 🧠 **Phase 3: Advanced Pathfinding**

### **3.1 Improved A* Algorithm**
```typescript
interface AdvancedPathfindingNode {
  coordinate: Coordinate;
  terrainType: TerrainType;
  onTrail: boolean;
  riskLevel: number;
  energyCost: number;
  timeCost: number;
  weatherFactor: number;
}
```

**Enhancements:**
- [ ] **Variable step sizes**: Smaller steps in complex terrain, larger on simple slopes
- [ ] **Direction weighting**: Prefer established switchback patterns
- [ ] **Risk assessment**: Avoid hazardous terrain (steep faces, loose rock)
- [ ] **Energy modeling**: Consider human endurance over long routes

### **3.2 Multi-Objective Optimization**
Consider multiple factors simultaneously:
- [ ] **Distance**: Shortest path
- [ ] **Time**: Fastest route considering terrain
- [ ] **Energy**: Least strenuous route
- [ ] **Safety**: Lowest risk route
- [ ] **Scenic**: Most interesting/beautiful route

---

## 🛠️ **Phase 4: Implementation Roadmap**

### **Sprint 1: Enhanced Cost Functions** (1-2 days)
- [ ] **Implement Tobler's hiking function**
- [ ] **Add realistic slope penalties**
- [ ] **Create surface type detection**
- [ ] **Test with current elevation data**

### **Sprint 2: Trail Integration** (2-3 days)
- [ ] **OSM Overpass API integration**
- [ ] **Trail data fetching and caching**
- [ ] **Trail-aware pathfinding**
- [ ] **Performance optimization**

### **Sprint 3: Advanced Terrain Analysis** (3-4 days)
- [ ] **Mapbox Terrain RGB integration**
- [ ] **Land cover classification**
- [ ] **Risk zone identification**
- [ ] **Multi-resolution pathfinding**

### **Sprint 4: Route Optimization** (2-3 days)
- [ ] **Multi-objective cost functions**
- [ ] **Route preferences UI**
- [ ] **Alternative route suggestions**
- [ ] **Performance profiling and optimization**

---

## 🎮 **Current Priority: Sprint 1**

**Immediate tasks to improve route quality:**

1. **Tobler's hiking function** for realistic speed/time calculations
2. **Enhanced slope analysis** with exponential penalties for steep terrain  
3. **Terrain surface detection** using elevation gradient analysis
4. **Improved neighbor generation** with variable step sizes

This will immediately improve route quality while keeping the same data sources, then we can progressively add trail data and advanced terrain analysis.

---

## 📋 **Completed Items**

### ✅ **Mapbox Integration** (December 2024)
- [x] Replace custom tile implementation with professional Mapbox GL JS
- [x] Add responsive map container with dynamic heights (384px-600px)
- [x] Implement elevation-colored route segments for terrain visualization
- [x] Add interactive controls (zoom, pan, compass, fullscreen)
- [x] Include graceful fallback to static map view on authentication errors
- [x] Support both outdoors terrain style and satellite imagery
- [x] Add proper error handling and loading states
- [x] Configure environment variables for public/private token separation

---

## 🔄 **Technical Debt & Maintenance**

- [ ] **Performance optimization**: Profile pathfinding algorithm performance
- [ ] **Error handling**: Improve fallback mechanisms for API failures
- [ ] **Testing**: Add unit tests for pathfinding algorithms
- [ ] **Documentation**: Document terrain cost calculation methods
- [ ] **Caching**: Implement elevation data caching for better performance
- [ ] **Type safety**: Strengthen TypeScript interfaces for terrain data