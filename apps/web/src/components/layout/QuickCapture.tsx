/**
 * Quick Capture Input Component
 * 
 * Prominent, always-accessible input for capturing thoughts.
 * Fixed at bottom on mobile, sticky at top on desktop.
 * Integrates with thought store for <100ms saves.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useLayoutStore, useIsMobile } from '@/hooks/useLayout';
import { useQuickCapture } from '@/hooks/useQuickCapture';
import { VoiceRecorder } from '@/components/capture/VoiceRecorder';

export function QuickCapture() {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  
  const quickCaptureExpanded = useLayoutStore((state) => state.quickCaptureExpanded);
  const setQuickCaptureExpanded = useLayoutStore((state) => state.setQuickCaptureExpanded);

  const { captureText, captureVoice, isCapturing, capturePerformance } = useQuickCapture();

  // Auto-expand on focus
  useEffect(() => {
    if (isFocused) {
      setQuickCaptureExpanded(true);
    }
  }, [isFocused, setQuickCaptureExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (value.trim()) {
      await captureText(value);
      setValue('');
      setQuickCaptureExpanded(false);
      textareaRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter (always)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }
    
    // Submit on plain Enter if text has no newlines (single-line quick capture)
    if (e.key === 'Enter' && !e.shiftKey && !value.includes('\n')) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }
    
    // Escape to collapse
    if (e.key === 'Escape') {
      setQuickCaptureExpanded(false);
      textareaRef.current?.blur();
    }
  };

  const handleVoiceTranscription = async (
    text: string,
    audioBlob?: Blob,
    duration?: number
  ) => {
    await captureVoice(text, audioBlob, duration);
    setIsVoiceMode(false);
    setQuickCaptureExpanded(false);
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      setQuickCaptureExpanded(true);
    }
  };

  return (
    <div className={`quick-capture ${isMobile ? 'mobile-fixed' : ''}`}>
      <form onSubmit={handleSubmit} className="quick-capture-content">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Capture a thought... (Enter to save)"
          className={`quick-capture-input ${quickCaptureExpanded ? 'expanded' : ''}`}
          aria-label="Quick capture input"
          onKeyDown={handleKeyDown}
          disabled={isVoiceMode}
        />
        
        {isVoiceMode && (
          <div className="px-4 py-3 bg-muted/50 rounded-lg mt-2">
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              onError={(error) => {
                console.error('Voice recording error:', error);
                setIsVoiceMode(false);
              }}
            />
          </div>
        )}
        
        {(quickCaptureExpanded || value.trim() || isVoiceMode) && (
          <div className="quick-capture-actions">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`p-2 rounded transition-colors ${
                  isVoiceMode 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={isVoiceMode ? 'Switch to text' : 'Voice input'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
              
              {capturePerformance && (
                <span className="text-xs text-muted-foreground">
                  {capturePerformance.toFixed(0)}ms
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue('');
                  setIsVoiceMode(false);
                  setQuickCaptureExpanded(false);
                  textareaRef.current?.blur();
                }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!value.trim() || isCapturing}
                className="px-4 py-1.5 text-sm bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCapturing ? 'Saving...' : 'Capture'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
