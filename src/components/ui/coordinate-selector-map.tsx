/**
 * Interactive map for selecting coordinates by clicking
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Coordinate } from '@/types/route';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox-config';
import { MapPin, Navigation } from 'lucide-react';

interface CoordinateSelectorMapProps {
  onCoordinateSelect: (coordinate: Coordinate, type: 'start' | 'end') => void;
  startCoordinate?: Coordinate;
  endCoordinate?: Coordinate;
  selectionMode?: 'start' | 'end' | null;
  center?: Coordinate;
  height?: string;
  className?: string;
  loading?: boolean;
}

export function CoordinateSelectorMap({
  onCoordinateSelect,
  startCoordinate,
  endCoordinate,
  selectionMode = null,
  center = { lat: 46.8182, lng: 8.2275 }, // Switzerland center
  height = 'h-64',
  className = '',
  loading = false
}: CoordinateSelectorMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const startMarker = useRef<mapboxgl.Marker | null>(null);
  const endMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [center.lng, center.lat],
      zoom: 8,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Handle click events for coordinate selection
    map.current.on('click', (e) => {
      if (loading || !selectionMode) return;

      const coordinate: Coordinate = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      };

      onCoordinateSelect(coordinate, selectionMode);
    });

    // Change cursor on hover when in selection mode
    map.current.on('mouseenter', () => {
      if (selectionMode && !loading) {
        map.current!.getContainer().style.cursor = 'crosshair';
      }
    });

    map.current.on('mouseleave', () => {
      map.current!.getContainer().style.cursor = '';
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center.lat, center.lng, loading, onCoordinateSelect, selectionMode]);

  // Update cursor based on selection mode
  useEffect(() => {
    if (!map.current) return;

    if (selectionMode && !loading) {
      map.current.getContainer().style.cursor = 'crosshair';
    } else {
      map.current.getContainer().style.cursor = '';
    }
  }, [selectionMode, loading]);

  // Update start marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (startMarker.current) {
      startMarker.current.remove();
      startMarker.current = null;
    }

    if (startCoordinate) {
      // Create custom marker element for start point
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-green-500';
      el.innerHTML = `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
      </svg>`;

      startMarker.current = new mapboxgl.Marker(el)
        .setLngLat([startCoordinate.lng, startCoordinate.lat])
        .addTo(map.current);
    }
  }, [startCoordinate, mapLoaded]);

  // Update end marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (endMarker.current) {
      endMarker.current.remove();
      endMarker.current = null;
    }

    if (endCoordinate) {
      // Create custom marker element for end point
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-red-500';
      el.innerHTML = `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
      </svg>`;

      endMarker.current = new mapboxgl.Marker(el)
        .setLngLat([endCoordinate.lng, endCoordinate.lat])
        .addTo(map.current);
    }
  }, [endCoordinate, mapLoaded]);

  // Fit map to show both markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (startCoordinate && endCoordinate) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([startCoordinate.lng, startCoordinate.lat]);
      bounds.extend([endCoordinate.lng, endCoordinate.lat]);
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    } else if (startCoordinate || endCoordinate) {
      const coord = startCoordinate || endCoordinate!;
      map.current.flyTo({
        center: [coord.lng, coord.lat],
        zoom: 10
      });
    }
  }, [startCoordinate, endCoordinate, mapLoaded]);

  const hasMarkers = startCoordinate || endCoordinate;
  const isDisabled = loading;

  return (
    <div className={`relative ${height} w-full rounded-lg overflow-hidden border border-gray-200 ${className} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        data-testid="coordinate-selector-map"
      />
      
      {/* Instructions overlay */}
      {!hasMarkers && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-gray-600" />
            <p className="text-sm text-gray-600">
              Click on the map to select a coordinate
            </p>
          </div>
        </div>
      )}

      {/* Selection mode indicator */}
      {selectionMode && !loading && (
        <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full shadow-lg text-sm flex items-center">
          {selectionMode === 'start' ? (
            <>
              <MapPin className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-gray-700">Selecting start point</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-gray-700">Selecting end point</span>
            </>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}