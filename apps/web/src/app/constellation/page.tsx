/**
 * Constellation View Demo Page
 */

'use client';

import { ConstellationView } from '@/components/constellation';
import type { Thought } from '@/types/thought';
import '@/styles/constellation.css';

// Sample thoughts for demonstration
const sampleThoughts: Thought[] = [
  {
    id: '1',
    type: 'text',
    content: 'What if we could visualize thoughts as stars in a constellation?',
    keywords: ['visualization', 'thoughts', 'constellation', 'stars'],
    wonderScore: 0.9,
    timestamp: new Date('2024-02-20T10:00:00'),
    metadata: {
      timestamp: new Date('2024-02-20T10:00:00').getTime(),
      deviceId: 'demo',
      confidence: 0.85,
      category: 'inspiration',
      connections: ['2', '3']
    },
    syncStatus: 'synced',
    createdAt: new Date('2024-02-20T10:00:00').getTime(),
    updatedAt: new Date('2024-02-20T10:00:00').getTime(),
    retryCount: 0
  },
  {
    id: '2',
    type: 'text',
    content: 'The beauty of connections between ideas is like watching galaxies form',
    keywords: ['connections', 'ideas', 'galaxies', 'beauty'],
    wonderScore: 0.8,
    timestamp: new Date('2024-02-20T10:15:00'),
    metadata: {
      timestamp: new Date('2024-02-20T10:15:00').getTime(),
      deviceId: 'demo',
      confidence: 0.75,
      category: 'reflection',
      connections: ['1', '4']
    },
    syncStatus: 'synced',
    createdAt: new Date('2024-02-20T10:15:00').getTime(),
    updatedAt: new Date('2024-02-20T10:15:00').getTime(),
    retryCount: 0
  },
  {
    id: '3',
    type: 'text',
    content: 'Force-directed graphs reveal hidden patterns in complex systems',
    keywords: ['force-directed', 'graphs', 'patterns', 'systems'],
    wonderScore: 0.7,
    timestamp: new Date('2024-02-20T11:00:00'),
    metadata: {
      timestamp: new Date('2024-02-20T11:00:00').getTime(),
      deviceId: 'demo',
      confidence: 0.65,
      category: 'technical',
      connections: ['1', '5']
    },
    syncStatus: 'synced',
    createdAt: new Date('2024-02-20T11:00:00').getTime(),
    updatedAt: new Date('2024-02-20T11:00:00').getTime(),
    retryCount: 0
  }
];

export default function ConstellationPage() {
  const handleThoughtSelect = (thought: Thought) => {
    console.log('Selected thought:', thought);
  };

  return (
    <main className="constellation-page">
      <ConstellationView
        thoughts={sampleThoughts}
        onThoughtSelect={handleThoughtSelect}
      />
    </main>
  );
}
