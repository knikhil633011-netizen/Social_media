"use client";

import React, { useState, useEffect, useRef } from 'react';
import Soundscape from '@/lib/audio';
import styles from './FocusTimer.module.css';

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes standard
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  
  // Calculate mock online study buddies based on time cycles
  const [buddiesCount, setBuddiesCount] = useState(6);
  useEffect(() => {
    setBuddiesCount(5 + (new Date().getMinutes() % 10));
  }, [timeLeft]);

  useEffect(() => {
    if (isRunning) {
      // Connect to the generative synthesizer engine automatically
      Soundscape.start('chill');
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            Soundscape.stop();
            // Trigger browser native audio ring chime
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high A5 chime
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.8);
            } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      Soundscape.stop();
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    Soundscape.stop();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`brutal-card ${styles.timerCard} ${isRunning ? styles.timerActive : ''}`}>
      <div className={styles.timerHeader}>
        <span className={styles.timerTitle}>⏱️ Collaborative Pomodoro Void</span>
        {isRunning && <span className={styles.pulseDot}>🔴 LIVE FOCUSING</span>}
      </div>
      
      <div className={styles.timerClock}>{formatTime(timeLeft)}</div>
      
      <div className={styles.timerControls}>
        <button 
          type="button" 
          onClick={handleStartPause} 
          className={`brutal-btn ${styles.timerBtn} ${isRunning ? styles.pauseBtn : styles.startBtn}`}
        >
          {isRunning ? '⏸️ Pause focus' : '▶️ Enter Focus Session'}
        </button>
        <button 
          type="button" 
          onClick={handleReset} 
          className={`brutal-btn ${styles.timerBtn} ${styles.resetBtn}`}
        >
          🔄 Reset
        </button>
      </div>

      <div className={styles.timerStats}>
        👥 <strong>{buddiesCount} study whispers</strong> focusing with you in the background
      </div>
    </div>
  );
}
