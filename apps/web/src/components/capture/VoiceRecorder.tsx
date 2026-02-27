/**
 * Voice recording component with Web Speech API integration
 * Handles voice input and transcription
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { speechToText } from '@/lib/transcription/speech-to-text';
import type { TranscriptionResult } from '@/lib/transcription/speech-to-text';

export interface VoiceRecorderProps {
  onTranscription: (text: string, audioBlob?: Blob, duration?: number) => void;
  onError?: (error: Error) => void;
  isRecording?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export function VoiceRecorder({
  onTranscription,
  onError,
  isRecording: externalIsRecording,
  onRecordingChange,
}: VoiceRecorderProps) {
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const isRecording = externalIsRecording ?? internalIsRecording;

  useEffect(() => {
    setIsSupported(speechToText.isAvailable());
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      onError?.(new Error('Speech recognition not supported'));
      return;
    }

    try {
      // Start speech recognition
      await speechToText.startRecognition(
        {
          continuous: false,
          interimResults: true,
          language: 'en-US',
        },
        (result: TranscriptionResult) => {
          if (result.isFinal) {
            setTranscript((prev) => prev + result.text + ' ');
            setInterimTranscript('');
          } else {
            setInterimTranscript(result.text);
          }
        },
        (error: Error) => {
          console.error('Speech recognition error:', error);
          onError?.(error);
        }
      );

      // Start audio recording for backup
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        startTimeRef.current = Date.now();
      } catch (error) {
        console.error('Failed to start audio recording:', error);
        // Continue without audio recording
      }

      setInternalIsRecording(true);
      onRecordingChange?.(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.(error as Error);
    }
  }, [isSupported, onError, onRecordingChange]);

  const stopRecording = useCallback(() => {
    // Stop speech recognition
    speechToText.stopRecognition();

    // Stop audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = () => {
        const duration = Date.now() - startTimeRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Get final transcript
        const finalTranscript = transcript + interimTranscript;
        
        // Call callback with transcription and audio
        if (finalTranscript.trim() || audioBlob.size > 0) {
          onTranscription(finalTranscript.trim(), audioBlob, duration);
        }

        // Clean up
        setTranscript('');
        setInterimTranscript('');
        audioChunksRef.current = [];

        // Stop all tracks
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      };
    } else {
      // No audio recording, just use transcript
      const finalTranscript = transcript + interimTranscript;
      if (finalTranscript.trim()) {
        onTranscription(finalTranscript.trim());
      }
      setTranscript('');
      setInterimTranscript('');
    }

    setInternalIsRecording(false);
    onRecordingChange?.(false);
  }, [transcript, interimTranscript, onTranscription, onRecordingChange]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        speechToText.abort();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }
    };
  }, [isRecording]);

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={toggleRecording}
        className={`p-3 rounded-full transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-accent text-accent-foreground hover:opacity-90'
        }`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isRecording ? (
            <rect x="6" y="6" width="12" height="12" />
          ) : (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          )}
        </svg>
      </button>

      {(transcript || interimTranscript) && (
        <div className="text-sm p-2 bg-muted rounded">
          <span className="text-foreground">{transcript}</span>
          <span className="text-muted-foreground italic">{interimTranscript}</span>
        </div>
      )}
    </div>
  );
}
