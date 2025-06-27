'use client';

import React from 'react';
import { PathfindingOptions, PATHFINDING_PRESETS } from '@/types/pathfinding';
import { Info } from 'lucide-react';

interface PathfindingControlsProps {
  options: PathfindingOptions;
  onOptionsChange: (options: PathfindingOptions) => void;
  isCalculating: boolean;
}

export function PathfindingControls({ options, onOptionsChange, isCalculating }: PathfindingControlsProps) {
  const handleSliderChange = (key: keyof PathfindingOptions, value: number) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  const sliderClass = "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const valueClass = "text-sm text-gray-600 font-mono";
  const buttonClass = "px-3 py-1 text-xs font-medium rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const inactiveButtonClass = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";

  const handlePresetClick = (presetName: keyof typeof PATHFINDING_PRESETS) => {
    if (isCalculating) return;
    onOptionsChange(PATHFINDING_PRESETS[presetName]);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Pathfinding Controls</h3>
      
      {/* Preset Buttons */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-800">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePresetClick('FAVOR_TRAILS_HEAVILY')}
            disabled={isCalculating}
            className={`${buttonClass} ${inactiveButtonClass}`}
          >
            Favor Trails Heavily
          </button>
          <button
            onClick={() => handlePresetClick('FAVOR_TRAILS_MODERATELY')}
            disabled={isCalculating}
            className={`${buttonClass} ${inactiveButtonClass}`}
          >
            Favor Trails Moderately
          </button>
          <button
            onClick={() => handlePresetClick('FAVOR_TRAILS_LITTLE')}
            disabled={isCalculating}
            className={`${buttonClass} ${inactiveButtonClass}`}
          >
            Favor Trails Little
          </button>
          <button
            onClick={() => handlePresetClick('DIRECT_ROUTE')}
            disabled={isCalculating}
            className={`${buttonClass} ${inactiveButtonClass}`}
          >
            Direct Route
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 border-b pb-1">Performance</h4>
          
          <div>
            <label className={labelClass}>
              <div className="flex items-center gap-1">
                Max Iterations: <span className={valueClass}>{options.maxIterations}</span>
                <div className="relative group">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Maximum search iterations. Higher = more thorough pathfinding but slower.
                  </div>
                </div>
              </div>
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={options.maxIterations}
              onChange={(e) => handleSliderChange('maxIterations', parseInt(e.target.value))}
              disabled={isCalculating}
              className={sliderClass}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast (100)</span>
              <span>Thorough (2000)</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <div className="flex items-center gap-1">
                Max Waypoints: <span className={valueClass}>{options.maxWaypoints}</span>
                <div className="relative group">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Maximum number of waypoints in final route. More waypoints = more detailed path.
                  </div>
                </div>
              </div>
            </label>
            <input
              type="range"
              min="2"
              max="500"
              step="5"
              value={options.maxWaypoints}
              onChange={(e) => handleSliderChange('maxWaypoints', parseInt(e.target.value))}
              disabled={isCalculating}
              className={sliderClass}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Simple (2)</span>
              <span>Detailed (500)</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <div className="flex items-center gap-1">
                Waypoint Distance: <span className={valueClass}>{(options.waypointDistance * 1000).toFixed(0)}m</span>
                <div className="relative group">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Distance between route waypoints. Smaller = more detailed path, larger = smoother path.
                  </div>
                </div>
              </div>
            </label>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={options.waypointDistance}
              onChange={(e) => handleSliderChange('waypointDistance', parseFloat(e.target.value))}
              disabled={isCalculating}
              className={sliderClass}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Dense (1m)</span>
              <span>Dense (50m)</span>
            </div>
          </div>
        </div>

        {/* Trail Preference Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 border-b pb-1">Trail Preference</h4>
          
          <div>
            <label className={labelClass}>
              <div className="flex items-center gap-1">
                Off-Trail Penalty: <span className={valueClass}>{options.offTrailPenalty}x</span>
                <div className="relative group">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Cost multiplier for going off established trails. Higher = strongly avoid off-trail.
                  </div>
                </div>
              </div>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={options.offTrailPenalty}
              onChange={(e) => handleSliderChange('offTrailPenalty', parseFloat(e.target.value))}
              disabled={isCalculating}
              className={sliderClass}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lenient (1x)</span>
              <span>Strict (5x)</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <div className="flex items-center gap-1">
                Trail Bonus: <span className={valueClass}>{Math.round((1 - options.trailBonus) * 100)}% cost reduction</span>
                <div className="relative group">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Cost reduction for using established trails. Higher = strongly prefer trails.
                  </div>
                </div>
              </div>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={0.9 - (options.trailBonus - 0.1)} // Invert the slider
              onChange={(e) => handleSliderChange('trailBonus', 1.0 - parseFloat(e.target.value))}
              disabled={isCalculating}
              className={sliderClass}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Small (10%)</span>
              <span>Huge (90%)</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <div className="flex items-center gap-1">
                Road Bonus: <span className={valueClass}>{Math.round((1 - options.roadBonus) * 100)}% cost reduction</span>
                <div className="relative group">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Cost reduction for using roads. Higher = prefer roads for faster travel.
                  </div>
                </div>
              </div>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={0.9 - (options.roadBonus - 0.1)} // Invert the slider
              onChange={(e) => handleSliderChange('roadBonus', 1.0 - parseFloat(e.target.value))}
              disabled={isCalculating}
              className={sliderClass}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Small (10%)</span>
              <span>Huge (90%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Tip:</strong> For detailed trail following, use 300+ waypoints with 1-10m spacing. 
          Higher penalties and bonuses force routes onto established paths.
        </div>
      </div>
    </div>
  );
}