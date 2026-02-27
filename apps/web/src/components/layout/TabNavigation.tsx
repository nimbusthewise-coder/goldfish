/**
 * Tab Navigation Component
 * 
 * View mode switcher (constellation, timeline, graph).
 * Bottom-positioned on mobile, top/side on desktop.
 */

'use client';

import { useLayoutStore, type ViewMode } from '@/hooks/useLayout';

interface Tab {
  id: ViewMode;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'constellation',
    label: 'Constellation',
    icon: (
      <svg className="tab-navigation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" strokeWidth={2} />
        <circle cx="6" cy="6" r="2" strokeWidth={2} />
        <circle cx="18" cy="6" r="2" strokeWidth={2} />
        <circle cx="6" cy="18" r="2" strokeWidth={2} />
        <circle cx="18" cy="18" r="2" strokeWidth={2} />
        <path d="M12 9L6 6M12 9L18 6M12 15L6 18M12 15L18 18" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (
      <svg className="tab-navigation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: (
      <svg className="tab-navigation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export function TabNavigation() {
  const viewMode = useLayoutStore((state) => state.viewMode);
  const setViewMode = useLayoutStore((state) => state.setViewMode);

  return (
    <nav className="tab-navigation" aria-label="View navigation">
      <div className="tab-navigation-content">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`tab-navigation-item ${viewMode === tab.id ? 'active' : ''}`}
            aria-current={viewMode === tab.id ? 'page' : undefined}
            aria-label={`Switch to ${tab.label} view`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
