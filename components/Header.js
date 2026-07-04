"use client";

import React, { useState, useEffect } from 'react';
import Soundscape from '@/lib/audio';
import styles from './Header.module.css';

export default function Header({ currentUser, currentView, onViewChange, onLogout, vibe = 'default' }) {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!isMuted) {
      Soundscape.start(vibe);
    }
  }, [vibe, isMuted]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    Soundscape.setMute(nextMuted);
  };

  return (
    <header className={`brutal-card ${styles.header}`}>
      {/* Branding Logo: echo room */}
      <div className={styles.branding} onClick={() => onViewChange(currentUser ? 'feed' : 'landing')} style={{ cursor: 'pointer' }}>
        <span className={styles.logoEcho}>echo</span>
        <span className={styles.logoRoom}>room</span>
      </div>

      {/* Navigation Controls */}
      <div className={styles.navControls}>
        <button
          type="button"
          className={`${styles.navBtn} ${isMuted ? styles.btnMuted : styles.btnSound}`}
          onClick={toggleMute}
          title="Toggle ambient generative soundscape"
        >
          {isMuted ? '🔇 sound: off' : `🔊 sound: ${vibe}`}
        </button>
        {currentUser ? (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnYellow} ${currentView === 'feed' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('feed')}
            >
              feed
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnBlue} ${(currentView === 'groups' || currentView === 'group-detail') ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('groups')}
            >
              groups
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnGreen} ${currentView === 'study-void' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('study-void')}
            >
              private space
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnPink} ${currentView === 'portal' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('portal')}
            >
              portal
            </button>
            <div className={`${styles.userBadge} ${styles.btnWhite}`} style={{ display: 'flex', alignItems: 'center', gap: '6.5px', padding: '6px 14px' }}>
              {typeof window !== 'undefined' && (() => {
                const saved = localStorage.getItem('local_user_avatar');
                if (saved) {
                  try {
                    const parsed = JSON.parse(saved);
                    return <span style={{ fontSize: '1.05rem', lineHeight: '1' }} title={parsed.badge}>{parsed.sticker}</span>;
                  } catch(e){}
                }
                return null;
              })()}
              <span>@{currentUser.username}</span>
            </div>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnWhite}`}
              onClick={onLogout}
            >
              logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnWhite} ${currentView === 'login' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('login')}
            >
              login
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnPink} ${currentView === 'register' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('register')}
            >
              sign up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
