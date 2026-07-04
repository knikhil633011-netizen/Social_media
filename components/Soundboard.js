"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './Soundboard.module.css';

export default function Soundboard() {
  const [isPlayingRain, setIsPlayingRain] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.5);
  
  const [isPlayingBinaural, setIsPlayingBinaural] = useState(false);
  const [binauralVolume, setBinauralVolume] = useState(0.3);

  const [isPlayingChords, setIsPlayingChords] = useState(false);
  const [chordsVolume, setChordsVolume] = useState(0.4);

  const audioCtxRef = useRef(null);
  
  // Rain references
  const rainSourceRef = useRef(null);
  const rainGainRef = useRef(null);

  // Binaural references
  const binOscLRef = useRef(null);
  const binOscRRef = useRef(null);
  const binGainRef = useRef(null);

  // Chords references
  const chordsGainRef = useRef(null);
  const chordsTimerRef = useRef(null);

  // Initialize Audio Context on first play action
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. Synthesize Rain (White Noise + Lowpass Filter)
  const startRain = () => {
    const ctx = getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Fill buffer with random white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it sound like deep rain rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(rainVolume, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start();

    rainSourceRef.current = whiteNoise;
    rainGainRef.current = gainNode;
  };

  const stopRain = () => {
    if (rainSourceRef.current) {
      try { rainSourceRef.current.stop(); } catch(e){}
      rainSourceRef.current = null;
    }
    rainGainRef.current = null;
  };

  useEffect(() => {
    if (rainGainRef.current && audioCtxRef.current) {
      rainGainRef.current.gain.setValueAtTime(rainVolume, audioCtxRef.current.currentTime);
    }
  }, [rainVolume]);

  // 2. Synthesize Binaural Focus Pulses (200Hz L / 210Hz R)
  const startBinaural = () => {
    const ctx = getAudioContext();

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    
    oscL.type = 'sine';
    oscL.frequency.value = 195; // Left ear carrier
    
    oscR.type = 'sine';
    oscR.frequency.value = 205; // Right ear (differential of 10Hz for alpha brainwave stimulation)

    // Pan nodes to route L/R separate channels
    const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (pannerL && pannerR) {
      pannerL.pan.value = -1;
      pannerR.pan.value = 1;
      oscL.connect(pannerL);
      oscR.connect(pannerR);
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(binauralVolume, ctx.currentTime);

    if (pannerL && pannerR) {
      pannerL.connect(gainNode);
      pannerR.connect(gainNode);
    } else {
      oscL.connect(gainNode);
      oscR.connect(gainNode);
    }

    gainNode.connect(ctx.destination);

    oscL.start();
    oscR.start();

    binOscLRef.current = oscL;
    binOscRRef.current = oscR;
    binGainRef.current = gainNode;
  };

  const stopBinaural = () => {
    if (binOscLRef.current) {
      try { binOscLRef.current.stop(); } catch(e){}
      binOscLRef.current = null;
    }
    if (binOscRRef.current) {
      try { binOscRRef.current.stop(); } catch(e){}
      binOscRRef.current = null;
    }
    binGainRef.current = null;
  };

  useEffect(() => {
    if (binGainRef.current && audioCtxRef.current) {
      binGainRef.current.gain.setValueAtTime(binauralVolume, audioCtxRef.current.currentTime);
    }
  }, [binauralVolume]);

  // 3. Synthesize Retro Ambient Chords Progression (Offline Synth)
  const playChordNotes = (frequencies) => {
    const ctx = getAudioContext();
    if (!ctx || chordsGainRef.current === null) return;

    const oscillators = frequencies.map(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Soft envelope to simulate retro keyboards
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(chordsVolume * 0.25, ctx.currentTime + 1.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5.8);

      // Lowpass filter to muffle highs
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(chordsGainRef.current);

      osc.start();
      osc.stop(ctx.currentTime + 6);
      return osc;
    });
  };

  const startChords = () => {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(chordsVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    chordsGainRef.current = masterGain;

    const chordsList = [
      [130.81, 196.00, 261.63, 329.63], // Cmaj7 (C3, G3, C4, E4)
      [110.00, 164.81, 220.00, 293.66], // Am7 (A2, E3, A3, D4)
      [146.83, 220.00, 293.66, 349.23], // Dm7 (D3, A3, D4, F4)
      [97.99, 146.83, 196.00, 246.94]   // G7 (G2, D3, G3, B3)
    ];

    let index = 0;
    const triggerNextChord = () => {
      playChordNotes(chordsList[index]);
      index = (index + 1) % chordsList.length;
    };

    triggerNextChord();
    chordsTimerRef.current = setInterval(triggerNextChord, 6000);
  };

  const stopChords = () => {
    if (chordsTimerRef.current) {
      clearInterval(chordsTimerRef.current);
      chordsTimerRef.current = null;
    }
    chordsGainRef.current = null;
  };

  useEffect(() => {
    if (chordsGainRef.current && audioCtxRef.current) {
      chordsGainRef.current.gain.setValueAtTime(chordsVolume, audioCtxRef.current.currentTime);
    }
  }, [chordsVolume]);

  // Clean up all oscillators on unmount
  useEffect(() => {
    return () => {
      stopRain();
      stopBinaural();
      stopChords();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`brutal-card ${styles.soundboardCard}`}>
      <h3 className={styles.title}>🎵 Focus Audio Sandbox</h3>
      <p className={styles.subtitle}>Mix offline ambient layers to curate your custom study void.</p>

      <div className={styles.mixerRow}>
        <div className={styles.channel}>
          <div className={styles.channelLabel}>
            <span>🌧️ Rain Storm</span>
            <button 
              type="button" 
              className={`brutal-btn ${styles.playBtn} ${isPlayingRain ? styles.btnStop : styles.btnPlay}`}
              onClick={() => {
                if (isPlayingRain) {
                  stopRain();
                } else {
                  startRain();
                }
                setIsPlayingRain(!isPlayingRain);
              }}
            >
              {isPlayingRain ? 'Stop' : 'Play'}
            </button>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={rainVolume}
            onChange={(e) => setRainVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>

        <div className={styles.channel}>
          <div className={styles.channelLabel}>
            <span>🧘 Binaural Pulse (Alpha)</span>
            <button 
              type="button" 
              className={`brutal-btn ${styles.playBtn} ${isPlayingBinaural ? styles.btnStop : styles.btnPlay}`}
              onClick={() => {
                if (isPlayingBinaural) {
                  stopBinaural();
                } else {
                  startBinaural();
                }
                setIsPlayingBinaural(!isPlayingBinaural);
              }}
            >
              {isPlayingBinaural ? 'Stop' : 'Play'}
            </button>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={binauralVolume}
            onChange={(e) => setBinauralVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>

        <div className={styles.channel}>
          <div className={styles.channelLabel}>
            <span>🎹 Retro Ambient Chords</span>
            <button 
              type="button" 
              className={`brutal-btn ${styles.playBtn} ${isPlayingChords ? styles.btnStop : styles.btnPlay}`}
              onClick={() => {
                if (isPlayingChords) {
                  stopChords();
                } else {
                  startChords();
                }
                setIsPlayingChords(!isPlayingChords);
              }}
            >
              {isPlayingChords ? 'Stop' : 'Play'}
            </button>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={chordsVolume}
            onChange={(e) => setChordsVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>
      </div>
      <div className={styles.headphonesHint}>🎧 Headphones recommended for Binaural audio</div>
    </div>
  );
}
