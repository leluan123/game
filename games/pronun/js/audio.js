/**
 * Audio Module
 * 
 * Generates sound effects using Web Audio API (no external files needed)
 * Handles: correct/wrong sounds, button clicks, level complete
 */

const Audio = {
  /** Audio context */
  ctx: null,
  
  /** Whether audio is enabled */
  enabled: true,

  /**
   * Initialize audio context (must be called from user gesture)
   */
  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[Audio] Initialized');
    } catch (e) {
      console.warn('[Audio] Not supported');
      this.enabled = false;
    }
  },

  /**
   * Resume audio context if suspended (required by Chrome)
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  /**
   * Play a tone
   * @param {number} freq - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
   * @param {number} volume - Volume 0-1
   */
  _playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  },

  /**
   * Play correct answer sound (pleasant ascending chime)
   */
  playCorrect() {
    this._playTone(523, 0.15, 'sine', 0.3);  // C5
    setTimeout(() => this._playTone(659, 0.15, 'sine', 0.3), 100); // E5
    setTimeout(() => this._playTone(784, 0.3, 'sine', 0.3), 200);  // G5
  },

  /**
   * Play wrong answer sound (descending buzz)
   */
  playWrong() {
    this._playTone(330, 0.2, 'square', 0.15); // E4
    setTimeout(() => this._playTone(262, 0.3, 'square', 0.15), 150); // C4
  },

  /**
   * Play button click sound
   */
  playClick() {
    this._playTone(800, 0.05, 'sine', 0.1);
  },

  /**
   * Play microphone start sound
   */
  playMicStart() {
    this._playTone(600, 0.08, 'sine', 0.15);
    setTimeout(() => this._playTone(800, 0.08, 'sine', 0.15), 60);
  },

  /**
   * Play microphone stop sound
   */
  playMicStop() {
    this._playTone(800, 0.08, 'sine', 0.15);
    setTimeout(() => this._playTone(600, 0.08, 'sine', 0.15), 60);
  },

  /**
   * Play level complete fanfare
   */
  playLevelComplete() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.4, 'sine', 0.25), i * 150);
    });
  },

  /**
   * Play combo/success sound
   */
  playSuccess() {
    this._playTone(784, 0.1, 'sine', 0.3);
    setTimeout(() => this._playTone(988, 0.1, 'sine', 0.3), 80);
    setTimeout(() => this._playTone(1175, 0.2, 'sine', 0.3), 160);
  },

  /**
   * Play XP earn sound
   */
  playXpEarn() {
    this._playTone(600, 0.1, 'sine', 0.2);
    setTimeout(() => this._playTone(800, 0.15, 'sine', 0.2), 80);
  }
};

window.Audio = Audio;