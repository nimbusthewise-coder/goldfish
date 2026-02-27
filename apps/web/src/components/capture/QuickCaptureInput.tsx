/**
 * Main quick capture component with text and voice input
 * Provides ultra-fast thought capture with <100ms save performance
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useQuickCapture } from '@/hooks/useQuickCapture';
import { VoiceRecorder } from './VoiceRecorder';

export interface QuickCaptureInputProps {
  placeholder?: string;
  autoFocus?: boolean;
  showVoiceInput?: boolean;
  showPerformanceMetrics?: boolean;
}

export function QuickCaptureInput({
  placeholder = 'Capture a thought...',
  autoFocus = true,
  showVoiceInput = true,
  showPerformanceMetrics = false,
}: QuickCaptureInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    captureText,
    captureVoice,
    isCapturing,
    lastCaptureTime,
    capturePerformance,
  } = useQuickCapture();

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    await captureText(inputValue);
    setInputValue('');
    
    // Refocus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscription = async (
    text: string,
    audioBlob?: Blob,
    duration?: number
  ) => {
    await captureVoice(text, audioBlob, duration);
    setIsVoiceMode(false);
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Input Area */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none resize-none"
            rows={3}
            disabled={isVoiceMode}
          />
          
          {/* Character count and status */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {isCapturing && (
              <span className="text-xs text-accent animate-pulse">Saving...</span>
            )}
            {inputValue.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {inputValue.length}
              </span>
            )}
          </div>
        </div>

        {/* Voice Mode */}
        {isVoiceMode && (
          <div className="px-4 py-3 bg-muted border-t border-border">
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              onError={(error) => {
                console.error('Voice recording error:', error);
                setIsVoiceMode(false);
              }}
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showVoiceInput && (
              <button
                onClick={toggleVoiceMode}
                className={`p-2 rounded hover:bg-muted transition-colors ${
                  isVoiceMode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`}
                title={isVoiceMode ? 'Switch to text' : 'Switch to voice'}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
            )}

            {showPerformanceMetrics && capturePerformance && (
              <div className="text-xs text-muted-foreground">
                Last save: {capturePerformance.toFixed(0)}ms
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Press Enter to capture
            </span>
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isCapturing}
              className="px-4 py-2 bg-accent text-accent-foreground rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              Capture
            </button>
          </div>
        </div>
      </div>

      {/* Success Feedback */}
      {lastCaptureTime && Date.now() - lastCaptureTime < 2000 && (
        <div className="mt-2 text-center">
          <span className="text-sm text-accent">
            ✓ Thought captured
          </span>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <span>Enter to capture • Shift+Enter for new line</span>
        {showVoiceInput && <span> • Click mic for voice input</span>}
      </div>
    </div>
  );
}
