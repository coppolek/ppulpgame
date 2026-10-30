/**
 * Authentic 8-bit / Chiptune Sound Synthesizer using Web Audio API
 * Generates square, triangle, and noise sound effects and background music
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private musicPlaying: boolean = false;
  private musicInterval: any = null;
  private currentVolume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGainNode = this.ctx.createGain();
        this.musicGainNode = this.ctx.createGain();
        this.sfxGainNode = this.ctx.createGain();

        this.musicGainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.sfxGainNode.gain.setValueAtTime(0.4, this.ctx.currentTime);

        this.musicGainNode.connect(this.masterGainNode);
        this.sfxGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.ctx && !this.isMuted) {
      this.masterGainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Jump Sound Effect (NES Square Wave pitch slide)
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // AudioContext policy catch
    }
  }

  // Coin Sound (Mario style two-tone square wave)
  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';

      // B5 (987.77 Hz) -> E6 (1318.51 Hz)
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.setValueAtTime(0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Laser / Shoot Sound
  public playLaser() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // Explosion / Hit Noise
  public playExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(50, now + 0.25);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGainNode);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.25);
    } catch {}
  }

  // Power Up Fanfare
  public playPowerUp() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [330, 392, 659, 523, 587, 784];
      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        const start = now + index * 0.06;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(start);
        osc.stop(start + 0.08);
      });
    } catch {}
  }

  // Menu Beep / Select
  public playSelect() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(659, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  // Camera Shutter Click for screenshots
  public playCameraShutter() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  // Start Game Chime
  public playStartChime() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.08 },
        { f: 783.99, t: 0.16 },
        { f: 1046.50, t: 0.24 },
      ];
      chords.forEach(({ f, t }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.25, now + t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(now + t);
        osc.stop(now + t + 0.18);
      });
    } catch {}
  }

  // Looping 8-Bit Chiptune Track for In-Game Ambience
  public startChiptuneMusic(theme: 'action' | 'arcade' | 'adventure' = 'action') {
    this.initContext();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;

    // 8-bit melody sequence notes (Hz)
    const melody = theme === 'arcade' 
      ? [261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 196.00]
      : theme === 'adventure'
      ? [329.63, 392.00, 440.00, 523.25, 493.88, 392.00, 440.00, 329.63]
      : [329.63, 329.63, 0, 329.63, 0, 261.63, 329.63, 392.00, 0, 196.00, 0, 0];

    const bass = [130.81, 164.81, 196.00, 130.81];
    let step = 0;

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.musicPlaying || this.isMuted) return;

      const now = this.ctx.currentTime;
      const noteFreq = melody[step % melody.length];
      const bassFreq = bass[Math.floor(step / 2) % bass.length];

      if (noteFreq > 0) {
        const lead = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        lead.type = 'square';
        lead.frequency.setValueAtTime(noteFreq, now);

        leadGain.gain.setValueAtTime(0.12, now);
        leadGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        lead.connect(leadGain);
        leadGain.connect(this.musicGainNode!);
        lead.start(now);
        lead.stop(now + 0.12);
      }

      // Bass note on triangle channel
      if (step % 2 === 0) {
        const triangle = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        triangle.type = 'triangle';
        triangle.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        triangle.connect(bassGain);
        bassGain.connect(this.musicGainNode!);
        triangle.start(now);
        triangle.stop(now + 0.22);
      }

      step++;
    }, 140);
  }

  public stopChiptuneMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const retroAudio = new RetroAudioEngine();
