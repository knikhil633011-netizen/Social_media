// Client-side Web Audio API Generative Synthesizer Engine

class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = true;
    this.activeVibe = 'default';
    
    // Track active nodes and intervals to dispose of them cleanly
    this.activeOscillators = [];
    this.activeGains = [];
    this.activeIntervals = [];
  }

  init() {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime); // keep volume subtle and ambient
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("Failed to initialize Web Audio context:", e);
    }
  }

  async start(vibe = 'default') {
    this.init();
    if (!this.ctx) return;

    this.activeVibe = vibe;

    // Browser security: resume AudioContext if suspended
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isMuted) return;

    this.stopCurrent();
    
    // Trigger synth voice depending on active vibe
    switch (vibe) {
      case 'chill':
        this.playChillSpace();
        break;
      case 'wholesome':
        this.playWholesomeOrgan();
        break;
      case 'chaotic':
        this.playChaoticArpeggios();
        break;
      case 'rant':
        this.playRantSubBass();
        break;
      default:
        this.playDefaultAura();
        break;
    }
  }

  stop() {
    this.stopCurrent();
  }

  setMute(muteState) {
    this.isMuted = muteState;
    if (muteState) {
      this.stop();
    } else {
      this.start(this.activeVibe);
    }
  }

  stopCurrent() {
    // Stop and clear all active intervals
    this.activeIntervals.forEach(clearInterval);
    this.activeIntervals = [];

    // Fade out active oscillators smoothly to prevent audio clicks/pops
    const fadeTime = 0.15;
    if (this.ctx && this.activeGains.length > 0) {
      const now = this.ctx.currentTime;
      this.activeGains.forEach(gainNode => {
        try {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
        } catch (e) {}
      });
    }

    // Disconnect oscillators after fade out completes
    const oscsToStop = [...this.activeOscillators];
    const gainsToDisconnect = [...this.activeGains];
    
    this.activeOscillators = [];
    this.activeGains = [];

    setTimeout(() => {
      oscsToStop.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      gainsToDisconnect.forEach(gain => {
        try { gain.disconnect(); } catch (e) {}
      });
    }, fadeTime * 1000 + 50);
  }

  // =========================================================================
  // SYNTH CONFIGURATIONS BY VIBE
  // =========================================================================

  // 1. CHILL VIBE: Detuned Triangle pad with delay feedback
  playChillSpace() {
    const frequencies = [220.00, 277.18, 329.63, 415.30]; // Amaj7 chord notes
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.4, this.ctx.currentTime);
    
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 2, this.ctx.currentTime); // detune

      const oscGain = this.ctx.createGain();
      // slow attack, fade in chord pad
      oscGain.gain.setValueAtTime(0, this.ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 3 + idx * 0.5);

      osc.connect(oscGain);
      oscGain.connect(filter);
      
      osc.start();
      this.activeOscillators.push(osc);
      this.activeGains.push(oscGain);
    });

    filter.connect(this.masterGain);
    
    // Wire up delay loop
    filter.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayFeedback.connect(this.masterGain);

    this.activeGains.push(delayFeedback);
  }

  // 2. WHOLESOME VIBE: Pure sine wave organ playing warm chord shifts
  playWholesomeOrgan() {
    const chordCycles = [
      [261.63, 329.63, 392.00], // C major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33]  // G major
    ];

    let chordIndex = 0;
    
    const playChord = (frequencies) => {
      const now = this.ctx.currentTime;
      const oscillators = [];
      const gains = [];

      frequencies.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0, now);
        // Breath fade-in
        oscGain.gain.linearRampToValueAtTime(0.05, now + 1.5);
        // Prepare fade-out for transitions
        oscGain.gain.setValueAtTime(0.05, now + 4.5);
        oscGain.gain.linearRampToValueAtTime(0, now + 6.0);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        osc.start();
        
        oscillators.push(osc);
        gains.push(oscGain);
        this.activeOscillators.push(osc);
        this.activeGains.push(oscGain);
      });

      // Cleanup oscs after chord cycle completes
      setTimeout(() => {
        oscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch (e) {}
          this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
        });
        gains.forEach(gNode => {
          try { gNode.disconnect(); } catch (e) {}
          this.activeGains = this.activeGains.filter(g => g !== gNode);
        });
      }, 6200);
    };

    // Cycle chord progressions every 6 seconds
    playChord(chordCycles[chordIndex]);
    
    const intervalId = setInterval(() => {
      chordIndex = (chordIndex + 1) % chordCycles.length;
      playChord(chordCycles[chordIndex]);
    }, 6000);

    this.activeIntervals.push(intervalId);
  }

  // 3. CHAOTIC VIBE: Playful high-pitch arpeggiator in pentatonic scale
  playChaoticArpeggios() {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // C Pentatonic Scale
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.25, this.ctx.currentTime);
    
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.55, this.ctx.currentTime);

    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayFeedback.connect(this.masterGain);
    
    this.activeGains.push(delayFeedback);

    const triggerPluck = () => {
      const now = this.ctx.currentTime;
      
      // Randomly select note from pentatonic scale
      const freq = scale[Math.floor(Math.random() * scale.length)];
      
      const osc = this.ctx.createOscillator();
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const pluckGain = this.ctx.createGain();
      pluckGain.gain.setValueAtTime(0, now);
      pluckGain.gain.linearRampToValueAtTime(0.06, now + 0.02); // fast attack
      pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35); // quick decay/release

      osc.connect(pluckGain);
      pluckGain.connect(this.masterGain);
      pluckGain.connect(delay);

      osc.start();
      
      this.activeOscillators.push(osc);
      this.activeGains.push(pluckGain);

      setTimeout(() => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
        try { pluckGain.disconnect(); } catch (e) {}
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
        this.activeGains = this.activeGains.filter(g => g !== pluckGain);
      }, 500);
    };

    // Pluck notes at semi-random rhythm speeds
    const tick = () => {
      triggerPluck();
      const nextTickTime = 200 + Math.random() * 450; // variable rhythm
      const timerId = setTimeout(tick, nextTickTime);
      this.activeIntervals.push(timerId);
    };

    tick();
  }

  // 4. RANT VIBE: Dark low-pitched square sub-bass pulse
  playRantSubBass() {
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55.00, this.ctx.currentTime); // Low A1 note

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55.40, this.ctx.currentTime); // slight detune to create beating width

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    const pulseGain = this.ctx.createGain();
    pulseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(pulseGain);
    pulseGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    this.activeOscillators.push(osc1, osc2);
    this.activeGains.push(pulseGain);

    // Filter cut LFO modulation: pulse the sub-bass filter to sound heavy
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.35, this.ctx.currentTime); // slow pulse rate

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, this.ctx.currentTime); // filter sweep depth

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    lfo.start();
    this.activeOscillators.push(lfo);
  }

  // 5. DEFAULT AURA: Soft drifting dual sines (breathing wind chord)
  playDefaultAura() {
    const frequencies = [220.00, 329.63]; // A3 and E4 (Perfect fifth interval)
    
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.activeOscillators.push(osc);
      this.activeGains.push(gain);

      // Low-frequency breathing gain sweep
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, this.ctx.currentTime);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      this.activeOscillators.push(lfo);
    });
  }
}

// Export single singleton instance
const Soundscape = new SoundscapeEngine();
export default Soundscape;
