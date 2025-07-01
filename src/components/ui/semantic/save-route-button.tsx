/**
 * Semantic component for saving routes to user's collection
 */

'use client';

import React, { useState } from 'react';
import { useAuth, useIsAuthenticated } from '@/contexts/auth-context';
import { saveRoute } from '@/lib/database/routes';
import { Route } from '@/types/route';
import { PathfindingOptions } from '@/types/pathfinding';
import { DatabaseRoute } from '@/types/database';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';

/**
 * Save route button props
 */
interface SaveRouteButtonProps {
  route: Route;
  pathfindingOptions: PathfindingOptions;
  onSaveSuccess?: (savedRoute: DatabaseRoute) => void;
  onAuthRequired?: () => void;
  onSaveError?: (error: string) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

/**
 * Save route dialog state
 */
interface SaveDialogState {
  isOpen: boolean;
  routeName: string;
  isPublic: boolean;
  tags: string;
  isSaving: boolean;
  error: string | null;
}

/**
 * Save route button component with integrated dialog
 */
export function SaveRouteButton({
  route,
  pathfindingOptions,
  onSaveSuccess,
  onAuthRequired,
  onSaveError,
  variant = 'primary',
  className
}: SaveRouteButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  
  const [dialogState, setDialogState] = useState<SaveDialogState>({
    isOpen: false,
    routeName: route.name,
    isPublic: false,
    tags: '',
    isSaving: false,
    error: null
  });

  /**
   * Handle save button click
   */
  const handleSaveClick = () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }
    
    setDialogState(prev => ({
      ...prev,
      isOpen: true,
      routeName: route.name,
      error: null
    }));
  };

  /**
   * Handle dialog close
   */
  const handleCloseDialog = () => {
    if (dialogState.isSaving) return;
    
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
      error: null
    }));
  };

  /**
   * Handle save route submission
   */
  const handleSaveRoute = async () => {
    if (!user) return;

    setDialogState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // Parse tags from comma-separated string
      const parsedTags = dialogState.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Save route to database
      const result = await saveRoute(
        { ...route, name: dialogState.routeName },
        user.id,
        pathfindingOptions,
        dialogState.isPublic,
        parsedTags
      );

      if (result.success && result.data) {
        onSaveSuccess?.(result.data);
        handleCloseDialog();
      } else {
        throw new Error(result.error?.message || UI_TEXT.SAVE_ERROR);
      }
    } catch (error) {
      console.error('Error saving route:', error);
      const errorMessage = error instanceof Error ? error.message : UI_TEXT.SAVE_ERROR;
      setDialogState(prev => ({
        ...prev,
        error: errorMessage
      }));
      onSaveError?.(errorMessage);
    } finally {
      setDialogState(prev => ({ ...prev, isSaving: false }));
    }
  };

  /**
   * Update dialog field
   */
  const updateDialogField = (field: keyof SaveDialogState, value: string | boolean) => {
    setDialogState(prev => ({ ...prev, [field]: value, error: null }));
  };

  const buttonStyles = variant === 'primary' ? STYLES.BTN_PRIMARY : STYLES.BUTTON_SECONDARY;

  return (
    <>
      {/* Save Route Button */}
      <button
        onClick={handleSaveClick}
        className={`${buttonStyles} ${STYLES.FLEX_ITEMS_CENTER} ${className || ''}`}
        title={isAuthenticated ? UI_TEXT.SAVE_ROUTE : UI_TEXT.SIGN_IN_TO_SAVE}
      >
        <svg className={`${STYLES.ICON_SM} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {isAuthenticated ? UI_TEXT.SAVE_ROUTE : UI_TEXT.SIGN_IN_TO_SAVE}
      </button>

      {/* Save Route Dialog */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseDialog}
          />
          
          {/* Dialog */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {/* Dialog Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {UI_TEXT.SAVE_ROUTE}
              </h2>
              <p className="text-gray-900">
                Save this route to your personal collection
              </p>
            </div>

            {/* Form */}
            <div className={STYLES.SPACE_Y_4}>
              {/* Error Message */}
              {dialogState.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {dialogState.error}
                </div>
              )}

              {/* Route Name */}
              <div>
                <label htmlFor="routeName" className="block text-sm font-medium text-gray-900 mb-1">
                  {UI_TEXT.ROUTE_NAME_LABEL}
                </label>
                <input
                  type="text"
                  id="routeName"
                  value={dialogState.routeName}
                  onChange={(e) => updateDialogField('routeName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter a name for this route"
                  disabled={dialogState.isSaving}
                  required
                />
              </div>

              {/* Public/Private Toggle */}
              <div>
                <label className={STYLES.FLEX_ITEMS_CENTER}>
                  <input
                    type="checkbox"
                    checked={dialogState.isPublic}
                    onChange={(e) => updateDialogField('isPublic', e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={dialogState.isSaving}
                  />
                  <span className="text-sm font-medium text-gray-900">{UI_TEXT.MAKE_PUBLIC}</span>
                </label>
                <p className="mt-1 text-xs text-gray-700">{UI_TEXT.ROUTE_PRIVACY_HELP}</p>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-1">
                  {UI_TEXT.ROUTE_TAGS}
                </label>
                <input
                  type="text"
                  id="tags"
                  value={dialogState.tags}
                  onChange={(e) => updateDialogField('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="summit, glacier, technical"
                  disabled={dialogState.isSaving}
                />
                <p className="mt-1 text-xs text-gray-700">{UI_TEXT.ROUTE_TAGS_HELP}</p>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className={`mt-6 ${STYLES.FLEX_BETWEEN}`}>
              <button
                onClick={handleCloseDialog}
                disabled={dialogState.isSaving}
                className={`${STYLES.BUTTON_SECONDARY} ${dialogState.isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {UI_TEXT.CANCEL}
              </button>
              
              <button
                onClick={handleSaveRoute}
                disabled={dialogState.isSaving || !dialogState.routeName.trim()}
                className={`${STYLES.BTN_PRIMARY} ${
                  (dialogState.isSaving || !dialogState.routeName.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {dialogState.isSaving ? (
                  <span className={STYLES.FLEX_ITEMS_CENTER}>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {UI_TEXT.SAVING_ROUTE}
                  </span>
                ) : (
                  UI_TEXT.SAVE
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}