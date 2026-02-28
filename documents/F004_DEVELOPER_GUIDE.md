# Agent Memory System - Developer Guide

## Quick Start

### 1. Using Memory Insights in a Component

```typescript
'use client';

import { useMemoryInsights } from '@/hooks/useMemoryInsights';
import { MemoryInsight } from '@/components/MemoryInsight';

export function MyComponent() {
  const {
    insights,
    isLoading,
    dismiss
  } = useMemoryInsights({
    currentThought: "your current thought text",
    enabled: true
  });

  if (isLoading) return <div>Loading insights...</div>;

  return (
    <div>
      {insights.map(insight => (
        <MemoryInsight
          key={insight.id}
          insight={insight}
          onDismiss={dismiss}
          onMarkShown={() => {}}
        />
      ))}
    </div>
  );
}
```

### 2. Adding Memories from Thoughts

```typescript
import { useSyncMemories } from '@/stores/memory-store';

function ThoughtCapture() {
  const { syncThought } = useSyncMemories();

  const handleThoughtCreated = async (thought: Thought) => {
    // Automatically sync to memory system
    await syncThought(thought);
  };

  // ...
}
```

### 3. Displaying the Full Agent Memory UI

```typescript
import { AgentMemory } from '@/components/AgentMemory';

function Sidebar() {
  return (
    <AgentMemory
      currentThought={currentThought}
      recentThoughts={last10Thoughts.map(t => t.content)}
      activeTags={["curiosity", "learning"]}
      compact={false} // Set to true for minimal view
    />
  );
}
```

### 4. Searching Memories

```typescript
import { useMemorySearch } from '@/hooks/useMemoryInsights';

function SearchInterface() {
  const { search, results, isSearching } = useMemorySearch();

  const handleSearch = (query: string) => {
    search(query, {
      limit: 10,
      minConfidence: 0.5,
      tags: ["science"]
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isSearching && <div>Searching...</div>}
      {results.map(result => (
        <div key={result.memory.id}>
          {result.memory.content} ({result.similarity.toFixed(2)})
        </div>
      ))}
    </div>
  );
}
```

### 5. Getting Memory Statistics

```typescript
import { useMemoryStats } from '@/hooks/useMemoryInsights';

function StatsDisplay() {
  const stats = useMemoryStats();

  return (
    <div>
      <p>Total Memories: {stats.totalMemories}</p>
      <p>Patterns Detected: {stats.totalPatterns}</p>
      <p>Insights: {stats.totalInsights}</p>
      <p>Average Confidence: {(stats.averageConfidence * 100).toFixed(0)}%</p>
    </div>
  );
}
```

## API Reference

### Memory Types

```typescript
interface Memory {
  id: string;
  content: string;
  thoughtId: string;
  embedding?: number[];
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  confidence: number;
  relatedMemories: string[];
  tags: string[];
  metadata: {
    timestamp: number;
    wonderScore?: number;
    userTags?: string[];
    themes?: string[];
  };
}

interface MemoryInsight {
  id: string;
  type: 'connection' | 'pattern' | 'reminder' | 'suggestion';
  message: string;
  confidence: number;
  relatedMemories: string[];
  relatedPatterns?: string[];
  generatedAt: number;
  shown: boolean;
  dismissed: boolean;
  triggerContext?: string;
}

interface MemoryPattern {
  id: string;
  description: string;
  memoryIds: string[];
  confidence: number;
  type: 'temporal' | 'semantic' | 'thematic' | 'recurring';
  detectedAt: number;
  updatedAt: number;
  occurrences: number;
  themes: string[];
}
```

### Zustand Store Actions

```typescript
const {
  // State
  memories,      // Map<string, Memory>
  patterns,      // Map<string, MemoryPattern>
  insights,      // MemoryInsight[]
  isProcessing,  // boolean
  
  // Actions
  addMemory,           // (memory) => Promise<Memory>
  getMemory,           // (id) => Memory | undefined
  searchMemories,      // (query) => Promise<MemorySearchResult[]>
  getRelatedMemories,  // (id, limit?) => Promise<Memory[]>
  updateMemory,        // (id, updates) => void
  deleteMemory,        // (id) => void
  getPatterns,         // () => MemoryPattern[]
  getInsights,         // (context) => Promise<MemoryInsight[]>
  dismissInsight,      // (id) => void
  markInsightShown,    // (id) => void
  getStats,            // () => MemoryStats
  clearAll,            // () => void
  exportMemories,      // () => Promise<string>
  importMemories,      // (data) => Promise<void>
} = useMemoryStore();
```

### Hook Options

```typescript
// useMemoryInsights options
{
  enabled?: boolean;              // Default: true
  timeWindow?: number;            // Default: 30 days in ms
  refreshInterval?: number;       // Default: 60000 (1 minute)
  currentThought?: string;
  recentThoughts?: string[];
  activeTags?: string[];
}

// useMemorySearch search options
{
  limit?: number;                 // Default: 10
  minConfidence?: number;         // Default: 0.3
  tags?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
}
```

## REST API Endpoints

### GET /api/memory

Get statistics or search memories.

**Query Parameters:**
- `query` (optional): Search query text
- `limit` (optional): Max results (default: 10)
- `minConfidence` (optional): Minimum confidence (default: 0)
- `tags` (optional): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": { ... },
    "patterns": [ ... ]
  }
}
```

### POST /api/memory

Create memories or get insights.

**Body:**
```json
{
  "action": "create" | "insights" | "batch",
  "thought": { ... },          // for create
  "thoughts": [ ... ],         // for batch
  "currentThought": "...",     // for insights
  "recentThoughts": [ ... ],   // for insights
  "activeTags": [ ... ],       // for insights
  "timeWindow": 2592000000     // for insights (optional)
}
```

### DELETE /api/memory

Clear all memories or dismiss insight.

**Query Parameters:**
- `insightId` (optional): ID of insight to dismiss

### PUT /api/memory

Export or import memories.

**Body:**
```json
{
  "action": "export" | "import",
  "memories": "..."  // for import (JSON string)
}
```

## Performance Tips

### 1. Debounce Memory Searches

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query) => search(query), 300),
  [search]
);
```

### 2. Limit Insight Refresh Rate

```typescript
useMemoryInsights({
  refreshInterval: 300000, // 5 minutes instead of 1
  enabled: isActiveTab     // Only when tab is active
});
```

### 3. Use Compact Mode When Appropriate

```typescript
<AgentMemory compact={true} /> // Lighter UI, fewer insights
```

### 4. Filter Insights Client-Side

```typescript
const highConfidenceInsights = insights.filter(i => i.confidence > 0.8);
```

## Common Patterns

### Pattern 1: Auto-sync Thoughts to Memory

```typescript
// In your thought creation handler
const handleThoughtCreated = async (thought: Thought) => {
  // Save to thought store
  await addThought(thought);
  
  // Sync to memory system
  await syncThought(thought);
};
```

### Pattern 2: Context-Aware Insights

```typescript
const { insights } = useMemoryInsights({
  currentThought: inputValue,
  recentThoughts: thoughts.slice(-5).map(t => t.content),
  activeTags: selectedTags,
  timeWindow: 7 * 24 * 60 * 60 * 1000 // Last week
});
```

### Pattern 3: Memory-Driven Suggestions

```typescript
const suggestions = useMemo(() => {
  return connectionInsights
    .filter(i => i.confidence > 0.7)
    .map(i => i.message);
}, [connectionInsights]);
```

### Pattern 4: Export/Import for Backup

```typescript
// Export
const handleExport = async () => {
  const data = await exportMemories();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'memories.json';
  a.click();
};

// Import
const handleImport = async (file: File) => {
  const text = await file.text();
  await importMemories(text);
};
```

## Debugging

### Enable Memory Logging

```typescript
// In browser console
localStorage.setItem('DEBUG_MEMORY', 'true');

// In code
if (localStorage.getItem('DEBUG_MEMORY')) {
  console.log('Memory stats:', getStats());
  console.log('Patterns:', getPatterns());
}
```

### Inspect Memory Store

```typescript
// In browser console
const store = useMemoryStore.getState();
console.log('All memories:', Array.from(store.memories.values()));
console.log('All patterns:', Array.from(store.patterns.values()));
console.log('All insights:', store.insights);
```

### Check Embedding Quality

```typescript
import { generateEmbedding, cosineSimilarity } from '@/lib/memory/embeddings';

const emb1 = await generateEmbedding("stars in the sky");
const emb2 = await generateEmbedding("celestial bodies");
console.log('Similarity:', cosineSimilarity(emb1, emb2)); // Should be high
```

## Troubleshooting

### Insights Not Appearing

1. Check if memories exist: `getStats().totalMemories`
2. Verify context is provided: `currentThought`, `recentThoughts`
3. Check time window: Default is 30 days
4. Verify confidence threshold: Insights need confidence > 0.5

### Poor Search Results

1. Check embedding quality for your queries
2. Lower `minConfidence` threshold
3. Verify memories have embeddings
4. Try more specific search terms

### Slow Performance

1. Check memory count: `getStats().totalMemories`
2. Increase refresh interval
3. Use compact mode
4. Clear old memories: `clearAll()`

### Memory Not Persisting

1. Check localStorage quota
2. Verify localStorage is enabled
3. Check browser console for errors
4. Try export/import as backup

## Best Practices

1. **Always provide context**: Better context = better insights
2. **Use appropriate time windows**: Not too short, not too long
3. **Tag consistently**: Helps with thematic patterns
4. **Monitor performance**: Keep an eye on memory count
5. **Export regularly**: Backup your data
6. **Dismiss irrelevant insights**: Improves future relevance
7. **Use compact mode in sidebars**: Better UX
8. **Test with real data**: Patterns emerge with usage

## Examples Repository

Check `/examples/memory-system/` for complete working examples:
- Basic integration
- Advanced search
- Custom insight types
- Memory visualization
- Export/import flows

---

*Last updated: February 28, 2026*
