import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Coordinate } from '@/types/route';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateDistance(point1: Coordinate, point2: Coordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateElevationGain(points: Array<{ elevation: number }>): number {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].elevation - points[i - 1].elevation;
    if (diff > 0) gain += diff;
  }
  return gain;
}

export function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)} m`;
  }
  return `${kilometers.toFixed(1)} km`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)}m`;
}

export function formatElevationGain(meters: number): string {
  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}.${Math.round(minutes / 6)} hrs`;
  }
  
  return `${minutes} min`;
}