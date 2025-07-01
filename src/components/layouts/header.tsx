'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mountain } from 'lucide-react';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';
import { UserMenu } from '@/components/auth/user-menu';
import { AuthModal } from '@/components/auth/auth-modal';

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <>
      <header className="border-b bg-white shadow-sm">
        <div className={`${STYLES.CONTAINER} py-4`}>
          <div className={STYLES.FLEX_BETWEEN}>
            <div className={STYLES.FLEX_ITEMS_CENTER}>
              <Mountain className={`${STYLES.ICON_LG} ${COLORS.TEXT.BLUE}`} />
              <h1 className={`text-2xl font-bold ${COLORS.TEXT.PRIMARY} ml-2`}>
                {UI_TEXT.APP_TITLE}
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <nav className={STYLES.HIDDEN_MD_FLEX}>
                <Link href="/" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
                  Route Planner
                </Link>
                <Link href="/dashboard" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
                  Dashboard
                </Link>
                <a href="#weather" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
                  {UI_TEXT.NAV_WEATHER}
                </a>
                <a href="#about" className={`${COLORS.TEXT.SECONDARY} hover:${COLORS.TEXT.BLUE} transition-colors`}>
                  {UI_TEXT.NAV_ABOUT}
                </a>
              </nav>
              
              <UserMenu onOpenAuthModal={openAuthModal} />
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal}
        defaultMode="login"
      />
    </>
  );
}