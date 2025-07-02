/**
 * Button component for getting user's current location
 */

'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Coordinate } from '@/types/route';
import { getCurrentLocation, isGeolocationSupported } from '@/lib/utils/geolocation';
import { STYLES } from '@/constants/styles';

interface LocationButtonProps {
  onLocationSelect: (location: Coordinate) => void;
  onError: (error: { message: string; code: string }) => void;
  loading?: boolean;
  className?: string;
}

export function LocationButton({ 
  onLocationSelect, 
  onError, 
  loading = false,
  className = '' 
}: LocationButtonProps) {
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const isSupported = isGeolocationSupported();
  const isDisabled = loading || gettingLocation || !isSupported;

  const handleGetLocation = async () => {
    setGettingLocation(true);
    
    try {
      const result = await getCurrentLocation();
      
      if (result.success && result.data) {
        onLocationSelect(result.data);
      } else if (result.error) {
        onError(result.error);
      }
    } catch (error) {
      onError({
        message: 'An unexpected error occurred while getting location.',
        code: 'UNEXPECTED_ERROR'
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const getButtonText = () => {
    if (!isSupported) return 'Not Supported';
    if (gettingLocation) return 'Getting Location...';
    return 'Use Current Location';
  };

  const getIcon = () => {
    if (gettingLocation) {
      return <Loader2 className={`${STYLES.ICON_SM} animate-spin`} />;
    }
    return <MapPin className={STYLES.ICON_SM} />;
  };

  return (
    <button
      type="button"
      onClick={handleGetLocation}
      disabled={isDisabled}
      aria-label="Use current location"
      className={`${STYLES.BUTTON_SECONDARY} ${STYLES.FLEX_ITEMS_CENTER} text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </button>
  );
}