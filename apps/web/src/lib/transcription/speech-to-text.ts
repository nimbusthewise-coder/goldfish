/**
 * Voice transcription service using Web Speech API with fallbacks
 */

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean;

  constructor() {
    // Check for Web Speech API support (not available during SSR)
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }
    
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    this.isSupported = !!SpeechRecognition;
    
    if (this.isSupported) {
      this.recognition = new SpeechRecognition();
    }
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  async startRecognition(
    options: TranscriptionOptions = {},
    onResult: (result: TranscriptionResult) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    // Configure recognition
    this.recognition.lang = options.language || 'en-US';
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

    // Set up event handlers
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      onResult({
        text: transcript,
        confidence,
        isFinal,
      });
    };

    this.recognition.onerror = (event: any) => {
      if (onError) {
        onError(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if continuous
      if (options.continuous) {
        try {
          this.recognition?.start();
        } catch (e) {
          // Ignore errors on restart
        }
      }
    };

    // Start recognition
    try {
      this.recognition.start();
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  }

  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  // Fallback: transcribe from audio blob (placeholder - would need external service)
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    // In a real implementation, this would send the audio to a transcription service
    // For now, return a placeholder
    console.warn('Audio transcription not implemented - would use external service');
    return '[Audio transcription pending]';
  }
}

export const speechToText = new SpeechToTextService();

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
