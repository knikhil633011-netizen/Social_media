"use client";

import React, { useState, useEffect } from 'react';
import styles from './AvatarEditor.module.css';

export default function AvatarEditor({ onAvatarSaved }) {
  const [bg, setBg] = useState('yellow');
  const [sticker, setSticker] = useState('🚀');
  const [badge, setBadge] = useState('Scholar');
  const [customBadge, setCustomBadge] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const BACKGROUNDS = ['yellow', 'pink', 'green', 'blue', 'orange', 'cream'];
  
  const STICKERS = [
    '🚀', '💻', '📈', '🎨', '🎒', '📚', 
    '🔥', '💡', '💼', '🎮', '🧸', '🐱',
    '🎓', '🏆', '⭐', '🍕', '🍩', '🛸'
  ];

  const BADGES = ['Scholar', 'Coder', 'Maker', 'Gamer', 'Boss', 'Dreamer', 'Creative'];

  useEffect(() => {
    const saved = localStorage.getItem('local_user_avatar');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBg(parsed.bg || 'yellow');
        setSticker(parsed.sticker || '🚀');
        setBadge(parsed.badge || 'Scholar');
        if (!BADGES.includes(parsed.badge)) {
          setCustomBadge(parsed.badge);
          setBadge('Custom');
        }
      } catch (e) {
        console.error("Failed to parse avatar:", e);
      }
    }
  }, []);

  const handleSave = () => {
    const activeBadge = badge === 'Custom' ? (customBadge.trim() || 'User') : badge;
    const avatarObj = { bg, sticker, badge: activeBadge };
    
    localStorage.setItem('local_user_avatar', JSON.stringify(avatarObj));
    setIsSaved(true);
    
    if (onAvatarSaved) {
      onAvatarSaved(avatarObj);
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const getBgColorClass = (color) => {
    if (color === 'pink') return '#ff6b8b';
    if (color === 'yellow') return '#ffde4d';
    if (color === 'green') return '#a3e635';
    if (color === 'blue') return '#60a5fa';
    if (color === 'orange') return '#ff5b37';
    return '#faf7f2';
  };

  const getActiveBadgeName = () => {
    return badge === 'Custom' ? (customBadge || 'Type yours...') : badge;
  };

  return (
    <div className={`brutal-card ${styles.editorCard}`}>
      <h3 className={styles.title}>🎭 Design Your Alias Avatar</h3>
      <p className={styles.subtitle}>Customize your anonymous profile card. It displays next to your posts and header.</p>

      <div className={styles.editorLayout}>
        {/* Visual Preview */}
        <div className={styles.previewSection}>
          <div 
            className={styles.avatarPreview}
            style={{ backgroundColor: getBgColorClass(bg) }}
          >
            <span className={styles.previewSticker}>{sticker}</span>
            <div className={styles.previewBadge}>{getActiveBadgeName()}</div>
          </div>
        </div>

        {/* Configuration inputs */}
        <div className={styles.controlsSection}>
          {/* 1. Backgrounds */}
          <div className={styles.controlGroup}>
            <span className={styles.label}>1. Background Color</span>
            <div className={styles.bgGrid}>
              {BACKGROUNDS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBg(c)}
                  className={`${styles.bgDot} ${styles['dot_' + c]} ${bg === c ? styles.activeBgDot : ''}`}
                />
              ))}
            </div>
          </div>

          {/* 2. Stickers */}
          <div className={styles.controlGroup}>
            <span className={styles.label}>2. Profile Sticker</span>
            <div className={styles.stickerGrid}>
              {STICKERS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSticker(s)}
                  className={`${styles.stickerBtn} ${sticker === s ? styles.activeSticker : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Badges */}
          <div className={styles.controlGroup}>
            <span className={styles.label}>3. Vibe Badge Role</span>
            <div className={styles.badgeRow}>
              {BADGES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`brutal-btn ${styles.badgeSelectBtn} ${badge === b ? styles.activeBadgeSelect : ''}`}
                >
                  {b}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBadge('Custom')}
                className={`brutal-btn ${styles.badgeSelectBtn} ${badge === 'Custom' ? styles.activeBadgeSelect : ''}`}
              >
                ✏️ Custom
              </button>
            </div>

            {badge === 'Custom' && (
              <input
                type="text"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value.substring(0, 12))}
                placeholder="Write custom role (max 12 chars)..."
                className={`brutal-input ${styles.customBadgeInput}`}
              />
            )}
          </div>

          {/* Action Trigger */}
          <div className={styles.actionRow}>
            {isSaved && <span className={styles.saveStatus}>Profile saved!</span>}
            <button 
              type="button" 
              onClick={handleSave} 
              className={`brutal-btn ${styles.saveBtn}`}
            >
              💾 Save Profile Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
