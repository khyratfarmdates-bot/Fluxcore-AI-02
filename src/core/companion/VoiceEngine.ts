export type VoiceProvider = 'elevenlabs' | 'openai' | 'azure';

export interface VoiceOptions {
  emotion?: 'neutral' | 'happy' | 'excited' | 'serious' | 'sad' | 'whisper';
  speed?: number;
  pitch?: number;
}

export class VoiceEngine {
  private static instance: VoiceEngine;
  private currentProvider: VoiceProvider = 'elevenlabs';
  private audioContext: AudioContext | null = null;
  private isSpeaking: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {}

  public static getInstance(): VoiceEngine {
    if (!VoiceEngine.instance) {
      VoiceEngine.instance = new VoiceEngine();
    }
    return VoiceEngine.instance;
  }

  public async speak(text: string, options?: VoiceOptions): Promise<void> {
    if (this.isSpeaking) {
      this.stop();
    }
    
    this.isSpeaking = true;
    console.log(`[VoiceEngine] Speaking via ${this.currentProvider} with emotion ${options?.emotion || 'neutral'}: "${text}"`);
    
    try {
      const savedConfig = localStorage.getItem('fluxcore_ai_config');
      const parsedConfig = savedConfig ? JSON.parse(savedConfig) : null;
      const apiProvider = parsedConfig?.provider || 'openai';
      
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: options?.emotion === 'excited' ? 'nova' : 'alloy',
          provider: apiProvider,
          apiKey: parsedConfig?.apiKey || ""
        })
      });

      if (!res.ok) {
        throw new Error(`TTS API error: ${res.status}`);
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      return new Promise<void>((resolve) => {
        audio.onended = () => {
          this.isSpeaking = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          this.isSpeaking = false;
          URL.revokeObjectURL(audioUrl);
          resolve(); // Resolve to avoid breaking flows
        };
        audio.play().catch((err) => {
          console.warn("[VoiceEngine] Playback failed:", err);
          this.isSpeaking = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        });
      });
    } catch (err) {
      console.warn("[VoiceEngine] Failed to generate/play real voice, falling back to simulation:", err);
      // Stub: Simulate network delay and speech duration
      return new Promise((resolve) => {
        const durationMs = Math.max(1000, text.length * 50); // Rough estimate
        setTimeout(() => {
          this.isSpeaking = false;
          resolve();
        }, durationMs);
      });
    }
  }

  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // Ignore audio stop errors
      }
      this.currentAudio = null;
    }
    if (this.isSpeaking) {
      console.log('[VoiceEngine] Stopped speaking.');
      this.isSpeaking = false;
    }
  }

  // Interactive subtle UI sounds
  public playSound(type: 'hover' | 'click' | 'success' | 'appear' | 'disappear' | 'type'): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      
      if (type === 'hover') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } else if (type === 'click') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
      } else if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(554.37, now + 0.1); // C#
        oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
      } else if (type === 'appear') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.03, now + 0.15);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
      } else if (type === 'type') {
         oscillator.type = 'square';
         oscillator.frequency.setValueAtTime(800 + Math.random() * 200, now);
         gainNode.gain.setValueAtTime(0.01, now);
         gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
         oscillator.start(now);
         oscillator.stop(now + 0.02);
      }
    } catch (e) {
      // Ignore audio context errors if user hasn't interacted yet
    }
  }
}

export const voiceEngine = VoiceEngine.getInstance();
