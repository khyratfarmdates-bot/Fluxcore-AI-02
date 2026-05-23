class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    this.init();
    // Re-init on first user interaction to satisfy browser policies
    if (typeof window !== 'undefined') {
      const enableAudio = () => {
        this.init();
        window.removeEventListener('click', enableAudio);
        window.removeEventListener('keydown', enableAudio);
      };
      window.addEventListener('click', enableAudio);
      window.addEventListener('keydown', enableAudio);
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggle(enable: boolean) {
    this.enabled = enable;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playSuccess() {
    this.playTone(600, 'sine', 0.2, 0.1);
    setTimeout(() => this.playTone(800, 'sine', 0.3, 0.1), 100);
  }

  public playError() {
    this.playTone(300, 'sawtooth', 0.2, 0.1);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.4, 0.2), 150);
  }

  public playWarning() {
    this.playTone(400, 'square', 0.2, 0.05);
    setTimeout(() => this.playTone(400, 'square', 0.3, 0.05), 200);
  }

  public playPop() {
    this.playTone(800, 'sine', 0.1, 0.05);
  }

  public playRobotThinking() {
    if (!this.enabled || !this.ctx) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Tech-ish thinking sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 1);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1);
  }

  public playNotification() {
    this.playTone(500, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(750, 'sine', 0.2, 0.05), 100);
  }
}

export const audioSystem = new AudioSystem();
