/**
 * Application Shell Component
 * 
 * Main container that assembles all layout components:
 * - Header with search and user controls
 * - Quick capture input
 * - Main content area (constellation view)
 * - Tab navigation
 */

'use client';

import { useEffect } from 'react';
import { Header } from './Header';
import { QuickCapture } from './QuickCapture';
import { ConstellationView } from './ConstellationView';
import { TabNavigation } from './TabNavigation';
import { useScrollDirection, useIsMobile } from '@/hooks/useLayout';

export function AppShell({ children }: { children?: React.ReactNode }) {
  // Initialize responsive state
  useIsMobile();
  
  // Handle scroll direction for header visibility
  useScrollDirection();

  // Prevent layout shift during initial render
  useEffect(() => {
    document.documentElement.style.setProperty('--initial-render', 'complete');
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <QuickCapture />
      
      <main className="app-main">
        {children || <ConstellationView />}
      </main>
      
      <TabNavigation />
    </div>
  );
}
