// Speech Synthesis Utility with Volume and Speed Control
export interface SpeechOptions {
  text: string;
  voice?: string;
  lang?: string;
  volume?: number;  // 0-1 scale
  rate?: number;    // 0.1-10 scale
  pitch?: number;   // 0-2 scale
}

export class SpeechSynthesisService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  // Get settings from localStorage
  private getStoredSettings() {
    return {
      volume: parseInt(localStorage.getItem('speechVolume') || '80') / 100, // Convert percentage to 0-1 scale
      rate: parseFloat(localStorage.getItem('speechSpeed') || '1.0'),
    };
  }

  // Speak text with options
  speak(options: SpeechOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      const storedSettings = this.getStoredSettings();
      
      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Apply settings with priority: options > localStorage > defaults
      utterance.volume = options.volume ?? storedSettings.volume;
      utterance.rate = options.rate ?? storedSettings.rate;
      utterance.pitch = options.pitch ?? 1;
      utterance.lang = options.lang ?? 'en-US';

      // Find and set voice if specified
      if (options.voice) {
        const voices = this.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name === options.voice || voice.lang.includes(options.voice || '')
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  // Stop current speech
  stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  // Pause current speech
  pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  // Resume paused speech
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  // Check if paused
  isPaused(): boolean {
    return this.synth.paused;
  }

  // Quick speak with default settings
  quickSpeak(text: string): Promise<void> {
    return this.speak({ text });
  }
}

// Export singleton instance
export const speechService = new SpeechSynthesisService();

// Convenience functions
export const speak = (text: string, options?: Partial<SpeechOptions>) => {
  return speechService.speak({ text, ...options });
};

export const stopSpeaking = () => speechService.stop();
export const pauseSpeaking = () => speechService.pause();
export const resumeSpeaking = () => speechService.resume();