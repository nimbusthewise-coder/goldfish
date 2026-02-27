/**
 * Application Header Component
 * 
 * Contains search functionality and user controls.
 * Collapses on scroll down (mobile) and expands on scroll up.
 */

'use client';

import { useLayoutStore } from '@/hooks/useLayout';
import { ThemeSelector } from '@/components/ThemeSelector';

export function Header() {
  const headerVisible = useLayoutStore((state) => state.headerVisible);

  return (
    <header className={`app-header ${headerVisible ? '' : 'hidden'}`}>
      <div className="app-header-content">
        {/* Search Section */}
        <div className="app-header-search">
          <input
            type="search"
            placeholder="Search thoughts..."
            aria-label="Search thoughts"
          />
        </div>

        {/* User Section */}
        <div className="app-header-user">
          <ThemeSelector />
          
          {/* User avatar placeholder */}
          <button
            aria-label="User menu"
            className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity"
          >
            U
          </button>
        </div>
      </div>
    </header>
  );
}
