/**
 * User menu component for authenticated users
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { STYLES } from '@/constants/styles';

/**
 * User menu props
 */
interface UserMenuProps {
  onOpenAuthModal: () => void;
}

/**
 * User menu component
 */
export function UserMenu({ onOpenAuthModal }: UserMenuProps) {
  const { user, signOut, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (email: string): string => {
    return email.charAt(0).toUpperCase();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    );
  }

  // Show sign in button for unauthenticated users
  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className={`${STYLES.BTN_PRIMARY} text-sm`}
      >
        Sign In
      </button>
    );
  }

  // Show user menu for authenticated users
  return (
    <div className="relative" ref={menuRef}>
      {/* User avatar button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getUserInitials(user.email)}
        </div>
        
        {/* Dropdown arrow */}
        <svg 
          className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">Signed in as</p>
            <p className="text-sm text-gray-800 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                // TODO: Navigate to dashboard
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                My Routes
              </div>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                // TODO: Navigate to settings
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </div>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                // TODO: Navigate to public routes
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                Explore Routes
              </div>
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-200 py-1">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}