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
          {isMuted ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
              🔇<span className={styles.btnText}>sound: off</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
              🔊<span className={styles.btnText}>sound: {vibe}</span>
            </span>
          )}
        </button>
        {currentUser ? (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnYellow} ${currentView === 'feed' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('feed')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                📰<span className={styles.btnText}>feed</span>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnBlue} ${(currentView === 'groups' || currentView === 'group-detail') ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('groups')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                👥<span className={styles.btnText}>groups</span>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnGreen} ${currentView === 'study-void' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('study-void')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                🔒<span className={styles.btnText}>private space</span>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnPink} ${currentView === 'portal' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('portal')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                🌀<span className={styles.btnText}>portal</span>
              </span>
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                🚪<span className={styles.btnText}>logout</span>
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnWhite} ${currentView === 'login' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('login')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                🔑<span className={styles.btnText}>login</span>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.btnPink} ${currentView === 'register' ? styles.activeBtn : ''}`}
              onClick={() => onViewChange('register')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                📝<span className={styles.btnText}>sign up</span>
              </span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
