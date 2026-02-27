/**
 * Layout State Management Hook
 * 
 * Manages the application shell state including:
 * - Active view mode (constellation, timeline, graph)
 * - Header visibility and collapse state
 * - Quick capture focus state
 * - Mobile/desktop responsive state
 */

'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';

export type ViewMode = 'constellation' | 'timeline' | 'graph';

interface LayoutState {
  // View management
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Header state
  headerVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
  
  // Quick capture state
  quickCaptureExpanded: boolean;
  setQuickCaptureExpanded: (expanded: boolean) => void;
  
  // Responsive state
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  viewMode: 'constellation',
  setViewMode: (viewMode) => set({ viewMode }),
  
  headerVisible: true,
  setHeaderVisible: (headerVisible) => set({ headerVisible }),
  
  quickCaptureExpanded: false,
  setQuickCaptureExpanded: (quickCaptureExpanded) => set({ quickCaptureExpanded }),
  
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
}));

/**
 * Hook to detect mobile viewport
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const setLayoutMobile = useLayoutStore((state) => state.setIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const mobile = window.innerWidth < breakpoint;
      setIsMobile(mobile);
      setLayoutMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint, setLayoutMobile]);

  return isMobile;
}

/**
 * Hook to handle header hide/show on scroll
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const setHeaderVisible = useLayoutStore((state) => state.setHeaderVisible);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up';
      setScrollDirection(direction);
      setHeaderVisible(direction === 'up' || scrollY < 50);
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [setHeaderVisible]);

  return scrollDirection;
}
