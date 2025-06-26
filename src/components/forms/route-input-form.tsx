'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';
import { Coordinate } from '@/types/route';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';
import { FindOptimalRouteButton } from '@/components/ui/semantic/find-optimal-route-button';
import { UseExampleButton } from '@/components/ui/semantic/use-example-button';

interface RouteInputFormProps {
  onRouteSubmit: (start: Coordinate, end: Coordinate) => void;
  loading?: boolean;
}

export function RouteInputForm({ onRouteSubmit, loading = false }: RouteInputFormProps) {
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startLat || !startLng || !endLat || !endLng) {
      alert(UI_TEXT.FILL_ALL_COORDINATES);
      return;
    }

    const start: Coordinate = {
      lat: parseFloat(startLat),
      lng: parseFloat(startLng),
    };

    const end: Coordinate = {
      lat: parseFloat(endLat),
      lng: parseFloat(endLng),
    };

    if (isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) {
      alert(UI_TEXT.ENTER_VALID_COORDINATES);
      return;
    }

    onRouteSubmit(start, end);
  };

  const fillExampleRoute = () => {
    setStartLat('46.624307431594055');
    setStartLng('8.04745577358767');
    setEndLat('46.57908871604088');
    setEndLng('8.006096923318134');
  };

  return (
    <div className={STYLES.CARD}>
      <div className={`${STYLES.FLEX_ITEMS_CENTER} mb-4`}>
        <Navigation className={`${STYLES.ICON_MD} ${COLORS.TEXT.BLUE} mr-2`} />
        <h2 className={STYLES.HEADING_XL}>{UI_TEXT.PLAN_YOUR_ROUTE}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className={STYLES.FORM_SECTION}>
        <div className={STYLES.GRID_1_MD_2}>
          <div className={STYLES.INPUT_GROUP}>
            <label className={STYLES.INPUT_LABEL_WITH_ICON}>
              <MapPin className={`${STYLES.ICON_SM} ${COLORS.TEXT.GREEN}`} />
              <span>{UI_TEXT.START_POINT}</span>
            </label>
            <div className={STYLES.GRID_2_GAP_2}>
              <Input
                type="number"
                step="any"
                placeholder={UI_TEXT.LATITUDE_PLACEHOLDER}
                value={startLat}
                onChange={(e) => setStartLat(e.target.value)}
                disabled={loading}
              />
              <Input
                type="number"
                step="any"
                placeholder={UI_TEXT.LONGITUDE_PLACEHOLDER}
                value={startLng}
                onChange={(e) => setStartLng(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className={STYLES.INPUT_GROUP}>
            <label className={STYLES.INPUT_LABEL_WITH_ICON}>
              <MapPin className={`${STYLES.ICON_SM} ${COLORS.TEXT.RED}`} />
              <span>{UI_TEXT.END_POINT}</span>
            </label>
            <div className={STYLES.GRID_2_GAP_2}>
              <Input
                type="number"
                step="any"
                placeholder={UI_TEXT.LATITUDE_PLACEHOLDER}
                value={endLat}
                onChange={(e) => setEndLat(e.target.value)}
                disabled={loading}
              />
              <Input
                type="number"
                step="any"
                placeholder={UI_TEXT.LONGITUDE_PLACEHOLDER}
                value={endLng}
                onChange={(e) => setEndLng(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className={STYLES.BUTTON_FLEX_COL_SM_ROW}>
          <FindOptimalRouteButton loading={loading} />
          <UseExampleButton 
            loading={loading}
            onClick={fillExampleRoute}
          />
        </div>
      </form>

      <div className={STYLES.TIP_BOX}>
        <p className={STYLES.TIP_TEXT}>
          <strong>{UI_TEXT.TIP_LABEL}</strong> {UI_TEXT.COORDINATE_TIP}
        </p>
      </div>
    </div>
  );
}