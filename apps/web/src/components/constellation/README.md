# Constellation View Components

Interactive visualization system for displaying thoughts as connected nodes in a constellation.

## Quick Start

```tsx
import { ConstellationView } from '@/components/constellation';
import { useThoughtsStore } from '@/stores/thoughts-store';

function MyComponent() {
  const thoughts = useThoughtsStore((state) => state.thoughts);
  
  return (
    <ConstellationView
      thoughts={thoughts}
      onThoughtSelect={(thought) => console.log('Selected:', thought)}
    />
  );
}
```

## Components

### ConstellationView (Main Component)

The primary component that orchestrates the entire visualization.

**Props:**
- `thoughts: Thought[]` - Array of thought objects to visualize
- `onThoughtSelect?: (thought: Thought) => void` - Callback when a thought is clicked
- `className?: string` - Additional CSS classes

**Features:**
- Automatic canvas sizing
- Responsive design
- Integration with thought detail panel
- Simulation controls

### ConstellationCanvas

Canvas-based renderer for high-performance visualization.

**Props:**
- `nodes: ConstellationNode[]` - Node positions and properties
- `connections: Connection[]` - Connections between nodes
- `interactionState: InteractionState` - Current interaction state
- `width: number` - Canvas width
- `height: number` - Canvas height
- Mouse/touch event handlers

**Rendering:**
- 60fps animation loop
- Glow effects
- Particle system
- Pan/zoom transformations

### ConstellationControls

UI control panel for managing the visualization.

**Props:**
- `isRunning: boolean` - Simulation state
- `alpha: number` - Simulation temperature (0-1)
- `nodeCount: number` - Number of nodes
- `connectionCount: number` - Number of connections
- `zoomLevel: number` - Current zoom level
- Control callbacks (onStart, onStop, onRestart, onResetView)

**Features:**
- Play/pause simulation
- Restart simulation
- Reset view
- Real-time statistics

### ThoughtDetail

Modal panel for viewing thought details.

**Props:**
- `thought: Thought` - The thought to display
- `onClose: () => void` - Close callback
- `onZoom: () => void` - Zoom to thought callback

**Displays:**
- Thought content
- Creation timestamp
- Wonder score
- Keywords
- Metadata (confidence, category)
- Connections to other thoughts

## Hooks

### useConstellationLayout

Manages force-directed layout simulation.

```tsx
const {
  nodes,              // Current node positions
  connections,        // Detected connections
  isRunning,          // Simulation running state
  alpha,              // Simulation temperature
  start,              // Start simulation
  stop,               // Stop simulation
  restart,            // Restart with new alpha
  fixNode,            // Fix node position
  unfixNode           // Unfix node
} = useConstellationLayout({
  thoughts,           // Thought array
  config: {           // Optional layout config
    width: 800,
    height: 600,
    repulsionStrength: 500,
    attractionStrength: 0.01
  },
  autoStart: true     // Start simulation automatically
});
```

### useConstellationInteraction

Handles user interactions (mouse, touch, zoom, pan).

```tsx
const {
  interactionState,   // Current interaction state
  handlers: {         // Event handlers for canvas
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  },
  resetView,          // Reset pan/zoom
  zoomToNode          // Center on specific node
} = useConstellationInteraction({
  nodes,
  onNodeClick,        // Node click callback
  onNodeHover,        // Node hover callback
  minZoom: 0.5,       // Minimum zoom level
  maxZoom: 3,         // Maximum zoom level
  zoomSpeed: 0.001    // Zoom sensitivity
});
```

## Core Systems

### Layout Engine

Force-directed graph layout with physics simulation.

```tsx
import { LayoutEngine } from '@/lib/constellation/layout-engine';

const engine = new LayoutEngine({
  width: 800,
  height: 600,
  nodeRadius: 20,
  repulsionStrength: 500,    // Node repulsion
  attractionStrength: 0.01,   // Spring attraction
  centerStrength: 0.05,       // Centering force
  damping: 0.8,               // Velocity damping
  minDistance: 30,            // Min node spacing
  maxDistance: 300            // Max connection length
});

// Initialize nodes
const nodes = engine.initializeNodes(thoughts);

// Run simulation tick
const { nodes: updated, alpha } = engine.tick(nodes, connections);

// Check if stable
if (engine.isStable()) {
  console.log('Layout settled');
}
```

### Connection Detector

Detects relationships between thoughts using multiple criteria.

```tsx
import { ConnectionDetector } from '@/lib/constellation/connection-detector';

const detector = new ConnectionDetector({
  keywordThreshold: 0.3,      // Min similarity (0-1)
  temporalWindow: 86400000,   // 24 hours in ms
  wonderThreshold: 0.5,       // Min wonder score
  maxConnections: 5           // Max per node
});

const connections = detector.detectConnections(thoughts);
```

**Connection Types:**
- `KEYWORD`: Shared keywords (Jaccard similarity)
- `TEMPORAL`: Close in time (exponential decay)
- `WONDER`: High wonder scores
- `SEMANTIC`: Content similarity (future)

### Animation Engine

Smooth transitions and visual effects.

```tsx
import {
  animationEngine,
  glowAnimator,
  particleSystem,
  easings
} from '@/lib/constellation/animation-engine';

// Animate a value
animationEngine.animate(
  'myAnimation',
  1000,                       // Duration in ms
  (progress) => {             // Update callback
    console.log(progress);    // 0 to 1
  },
  () => {                     // Complete callback
    console.log('Done!');
  },
  easings.easeInOut          // Easing function
);

// Glow effects
glowAnimator.update(deltaTime);
const glow = glowAnimator.getNodeGlow(baseIntensity, frequency);

// Particles
particleSystem.emit(x, y, count, color);
particleSystem.update(deltaTime);
const particles = particleSystem.getParticles();
```

## Customization

### Styling

Override constellation styles in your CSS:

```css
.constellation-view {
  /* Main container */
}

.constellation-controls {
  /* Control panel positioning and style */
  top: 20px;
  right: 20px;
}

.thought-detail-panel {
  /* Detail panel style */
}
```

### Colors

Node colors are based on wonder scores:
- Gold (#FFD700): Wonder > 0.8
- Sky Blue (#87CEEB): Wonder > 0.5
- Pale Green (#98FB98): Wonder > 0.3
- Light Gray (#D3D3D3): No wonder

Override in `layout-engine.ts`:

```typescript
private calculateNodeColor(thought: Thought): string {
  // Your custom logic
}
```

### Forces

Adjust physics simulation:

```typescript
const config = {
  repulsionStrength: 500,     // Higher = more spread
  attractionStrength: 0.01,   // Higher = tighter connections
  centerStrength: 0.05,       // Higher = more centered
  damping: 0.8                // Lower = more movement
};
```

## Performance Tips

### For Many Thoughts (100+)

1. **Reduce max connections:**
```typescript
const detector = new ConnectionDetector({
  maxConnections: 3  // Instead of 5
});
```

2. **Increase damping:**
```typescript
const engine = new LayoutEngine({
  damping: 0.9  // Faster settling
});
```

3. **Stop simulation when stable:**
```typescript
useEffect(() => {
  if (alpha < 0.01) {
    stop();
  }
}, [alpha, stop]);
```

### For Mobile

1. **Reduce particle effects**
2. **Lower animation frame rate**
3. **Simplify glow effects**
4. **Increase touch target sizes**

## Integration with Wonder Detection

The constellation is ready to integrate with wonder detection:

```typescript
// After analysis
thought.wonderScore = analysis.confidence;
thought.keywords = analysis.matchedKeywords;
thought.metadata.category = analysis.category;

// Constellation will automatically:
// - Size nodes based on wonder score
// - Color nodes appropriately
// - Create wonder-based connections
// - Apply glow effects
```

## Troubleshooting

### Nodes not moving
- Check that simulation is started (`isRunning: true`)
- Verify `alpha > 0.001`
- Check for fixed nodes (`fx/fy` properties)

### Poor performance
- Reduce number of nodes
- Lower max connections
- Increase damping
- Check for memory leaks in animation loops

### Canvas not visible
- Ensure parent has dimensions
- Check z-index layering
- Verify canvas size > 0

### Interactions not working
- Ensure event handlers are attached
- Check for `pointer-events: none` in CSS
- Verify touch-action settings

## Browser Requirements

- Canvas 2D Context
- RequestAnimationFrame
- Touch Events (for mobile)
- ES2020+ JavaScript

## Examples

See `src/app/constellation/page.tsx` for a complete working example with sample data.
