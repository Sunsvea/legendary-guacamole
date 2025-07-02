/**
 * Geolocation utilities for getting user's current location
 */

import { Coordinate } from '@/types/route';

export interface GeolocationResult {
  success: boolean;
  data?: Coordinate;
  error?: {
    message: string;
    code: string;
  };
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Check if geolocation is supported by the browser
 */
export function isGeolocationSupported(): boolean {
  return !!(navigator && navigator.geolocation);
}

/**
 * Get the user's current location
 */
export function getCurrentLocation(options?: GeolocationOptions): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({
        success: false,
        error: {
          message: 'Geolocation is not supported by this browser.',
          code: 'NOT_SUPPORTED'
        }
      });
      return;
    }

    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 60000 // 1 minute
    };

    const finalOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        });
      },
      (error) => {
        let errorCode: string;
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorCode = 'PERMISSION_DENIED';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorCode = 'POSITION_UNAVAILABLE';
            break;
          case 3: // TIMEOUT
            errorCode = 'TIMEOUT';
            break;
          default:
            errorCode = 'UNKNOWN_ERROR';
            break;
        }

        resolve({
          success: false,
          error: {
            message: error.message,
            code: errorCode
          }
        });
      },
      finalOptions
    );
  });
}