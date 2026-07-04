"use client";

import React, { useState, useEffect } from 'react';
import styles from './SpotlightCarousel.module.css';

export default function SpotlightCarousel({ spotlights = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (spotlights.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % spotlights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [spotlights]);

  if (!spotlights || spotlights.length === 0) return null;

  const activeSpot = spotlights[activeIndex];

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + spotlights.length) % spotlights.length);
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % spotlights.length);
  };

  const getCategoryEmoji = (cat) => {
    if (cat === 'business') return '💼';
    if (cat === 'community') return '👥';
    return '🚀';
  };

  return (
    <div className={`brutal-card ${styles.carouselCard}`}>
      <div className={styles.carouselHeader}>
        <span className={styles.carouselTitle}>🌟 Community Spotlight</span>
        <div className={styles.navControls}>
          <button type="button" onClick={handlePrev} className={styles.navBtn}>◀</button>
          <span className={styles.slideCounter}>{activeIndex + 1} / {spotlights.length}</span>
          <button type="button" onClick={handleNext} className={styles.navBtn}>▶</button>
        </div>
      </div>

      <div className={styles.slideContent}>
        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${
            activeSpot.category === 'business' ? styles.badgeYellow :
            activeSpot.category === 'community' ? styles.badgeGreen : styles.badgePink
          }`}>
            {getCategoryEmoji(activeSpot.category)} {activeSpot.category}
          </span>
          <span className={styles.dateLabel}>{new Date(activeSpot.created_at).toLocaleDateString()}</span>
        </div>

        <h3 className={styles.spotTitle}>{activeSpot.title}</h3>
        <p className={styles.spotDesc}>{activeSpot.description}</p>

        {activeSpot.link && (
          <a 
            href={activeSpot.link.startsWith('http') ? activeSpot.link : `https://${activeSpot.link}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`brutal-btn ${styles.visitBtn}`}
          >
            🔗 Visit Spotlight Website
          </a>
        )}
      </div>
    </div>
  );
}
