# F005: Curiosity Transmission - Quick Start Guide

## Getting Started

The sharing system is fully integrated and ready to use. Here's how to add sharing to your components.

## 1. Quick Share Button (Simplest)

Add a one-click share button that copies the link to clipboard:

```tsx
import { QuickShareButton } from '@/components/ShareTrigger';

function MyThoughtCard({ thought }) {
  return (
    <div>
      <p>{thought.content}</p>
      <QuickShareButton thought={thought} />
    </div>
  );
}
```

## 2. Contextual Share Trigger

Add a share button that appears on hover:

```tsx
import { ShareTrigger } from '@/components/ShareTrigger';
import { ShareComposer } from '@/components/ShareComposer';
import { useState } from 'react';

function MyThoughtCard({ thought, connectedThoughts }) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareContext, setShareContext] = useState(null);

  return (
    <div className="group">
      <ShareTrigger
        thought={thought}
        connectedThoughts={connectedThoughts}
        variant="hover"
        onShare={(context) => {
          setShareContext(context);
          setIsShareOpen(true);
        }}
      />
      
      {shareContext && (
        <ShareComposer
          context={shareContext}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
```

## 3. Using the Hook (Advanced)

For custom implementations:

```tsx
import { useShare } from '@/hooks/useShare';

function MyCustomShare({ thought }) {
  const {
    initiateShare,
    generate,
    copy,
    complete,
    link,
    timeToComplete,
    isWithinGoal
  } = useShare({
    onComplete: () => console.log('Share completed!'),
    onError: (error) => console.error('Share failed:', error)
  });

  const handleShare = async () => {
    // Start the share
    const { shareId } = await initiateShare({
      thought,
      discoveredAt: Date.now()
    });
    
    // Copy to clipboard
    await copy();
    
    // Mark as complete
    complete();
  };

  return (
    <button onClick={handleShare}>
      Share {link && `(${(timeToComplete / 1000).toFixed(1)}s)`}
    </button>
  );
}
```

## 4. Share Trigger Variants

### Icon (minimal, hover-triggered)
```tsx
<ShareTrigger thought={thought} variant="icon" size="sm" />
```

### Button (always visible)
```tsx
<ShareTrigger thought={thought} variant="button" size="md" />
```

### Hover (absolute positioned, appears on parent hover)
```tsx
<div className="group">
  <ShareTrigger thought={thought} variant="hover" />
</div>
```

## 5. API Usage

### Create a Share
```typescript
const response = await fetch('/api/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: {
      thought,
      connectedThoughts,
      note: 'Check out this interesting thought!',
      discoveredAt: Date.now()
    },
    platforms: ['link', 'twitter'],
    expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days
  })
});

const { shareId, link } = await response.json();
```

### Track an Event
```typescript
await fetch('/api/share/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shareId,
    type: 'clicked',
    metadata: { platform: 'twitter' }
  })
});
```

### Get Analytics
```typescript
const response = await fetch(`/api/share/track?shareId=${shareId}`);
const analytics = await response.json();
console.log('Views:', analytics.views);
console.log('Shares:', analytics.shares);
```

## 6. Recipient View

Shares are accessible at `/shared/[shareId]`. The page:
- Displays the thought with full context
- Shows connected thoughts
- Tracks views automatically
- Handles expiration
- Provides beautiful social previews

Example URL: `https://yourapp.com/shared/abc123-def456`

## 7. Customization

### Custom Preview
```tsx
import { SharePreview } from '@/components/SharePreview';

<SharePreview link={link} compact={false} />
```

### Custom Note
```tsx
const { initiateShare } = useShare();

await initiateShare({
  thought,
  note: 'This thought connects to my earlier idea about...',
  discoveredAt: Date.now()
});
```

### Custom Expiration
```tsx
await createShare({
  context,
  expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

## 8. Platform Sharing

### Twitter
```tsx
const { share } = useShare();
await share('twitter'); // Opens Twitter with pre-filled text
```

### Email
```tsx
await share('email'); // Opens email client
```

### Clipboard
```tsx
const { copy } = useShare();
const success = await copy();
if (success) {
  // Show success message
}
```

## Performance Tips

1. **Use QuickShare for instant sharing**
   - Bypasses modal for fastest experience
   - Copies directly to clipboard
   - Perfect for "share this quickly" scenarios

2. **Pre-generate links**
   - Start share generation early
   - Use `autoGenerate: true` option
   - Reduces perceived wait time

3. **Track the 30-second goal**
   ```tsx
   const { timeToComplete, isWithinGoal, goalPercentage } = useShare();
   ```

4. **Batch analytics**
   - Events are tracked asynchronously
   - No user-facing delays
   - Failed tracking doesn't block sharing

## Common Patterns

### Share on Connection Discovery
```tsx
function ConnectionAlert({ connection }) {
  const { quickShare } = useQuickShare();
  
  return (
    <div>
      <p>New connection discovered!</p>
      <button onClick={() => quickShare({
        thought: connection.source,
        connectedThoughts: [connection.target],
        connection,
        discoveredAt: Date.now()
      })}>
        Quick Share
      </button>
    </div>
  );
}
```

### Share from Constellation
```tsx
function ConstellationNode({ node }) {
  const [showShare, setShowShare] = useState(false);
  
  return (
    <g onMouseEnter={() => setShowShare(true)}>
      {showShare && (
        <ShareTrigger
          thought={node.thought}
          variant="icon"
        />
      )}
    </g>
  );
}
```

### Bulk Share History
```tsx
function ShareHistory() {
  const { shareHistory } = useShareStore();
  
  return (
    <div>
      {shareHistory.map(share => (
        <SharePreview key={share.shareId} link={share} compact />
      ))}
    </div>
  );
}
```

## Troubleshooting

### Share not generating
- Check that thought has required fields (id, content)
- Verify API routes are accessible
- Check browser console for errors

### Clipboard not working
- HTTPS required for clipboard API
- Check browser permissions
- Fallback: show link for manual copy

### Preview not showing
- Verify metadata is generated
- Check link structure
- Test with social media validators

## Next Steps

1. **Add to existing components** - Follow the integration examples
2. **Customize styling** - Modify component classes
3. **Add analytics dashboard** - Use share analytics API
4. **Implement database** - Replace in-memory storage
5. **Add more platforms** - Extend platform system

## Support

See `documents/F005_IMPLEMENTATION_SUMMARY.md` for complete technical details.
