'use client';

import { Mountain } from 'lucide-react';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className={`${STYLES.CONTAINER} py-4`}>
        <div className={STYLES.FLEX_BETWEEN}>
          <div className={STYLES.FLEX_ITEMS_CENTER}>
            <Mountain className={`${STYLES.ICON_LG} ${COLORS.TEXT.BLUE}`} />
            <h1 className={`text-2xl font-bold ${COLORS.TEXT.PRIMARY} ml-2`}>
              {UI_TEXT.APP_TITLE}
            </h1>
          </div>
          <nav className={STYLES.HIDDEN_MD_FLEX}>
            <a href="#routes" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
              {UI_TEXT.NAV_ROUTES}
            </a>
            <a href="#weather" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
              {UI_TEXT.NAV_WEATHER}
            </a>
            <a href="#about" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
              {UI_TEXT.NAV_ABOUT}
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}