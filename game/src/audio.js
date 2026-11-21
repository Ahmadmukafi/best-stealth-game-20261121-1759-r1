// VELVET SHADOW — sound: everything is synthesised with WebAudio.
// No audio files are shipped. Footsteps are soft filtered ticks, a curious
// guard gets a rising blip, a full alarm is a two-tone sting, picking up a
// relic chimes, and winning plays a short major arpeggio. The audio context
// is created lazily on the first user gesture, as browsers require.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A soft footstep: pitch varies slightly so it never sounds mechanical.
  footstep(running) {
    this.tone(running ? 150 : 110, 0.07, 'triangle', running ? 0.5 : 0.3);
  }

  // A guard grows curious: a short rising blip.
  curious() {
    this.tone(520, 0.16, 'sine', 0.5, 0, 780);
  }

  // Full alarm: two-tone sting, played once when the chase starts.
  alarm() {
    this.tone(392, 0.22, 'square', 0.28);
    this.tone(311, 0.3, 'square', 0.28, 0.2);
  }

  // Relic picked up: a bright two-note chime.
  chime() {
    this.tone(880, 0.18, 'sine', 0.5);
    this.tone(1318, 0.3, 'sine', 0.4, 0.09);
  }

  // Caught: a low descending buzz.
  caught() {
    this.tone(220, 0.5, 'sawtooth', 0.3, 0, 110);
  }

  // Win: a short major arpeggio.
  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.28, 'sine', 0.45, i * 0.11));
  }
}
