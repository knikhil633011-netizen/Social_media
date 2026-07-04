"use client";

import React, { useState, useEffect } from 'react';
import styles from './StudyAnalytics.module.css';

export default function StudyAnalytics({ onThemeUnlock }) {
  const [stats, setStats] = useState({
    totalMins: 0,
    totalSessions: 0,
    dailyMap: {}
  });

  const ACHIEVEMENTS = [
    { id: 'first_step', name: '🌱 First Steps', desc: 'Focus for at least 5 minutes', target: 5 },
    { id: 'deep_focus', name: '⚡ Deep Focus Maker', desc: 'Focus for 50 minutes (Unlocks Cyberpunk Matrix Theme)', target: 50 },
    { id: 'scholar', name: '🎓 Super Scholar', desc: 'Focus for 150 minutes (Unlocks Sunset Glow Theme)', target: 150 },
    { id: 'flow_master', name: '🌀 Flow Master', desc: 'Focus for 300 minutes total', target: 300 }
  ];

  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('local_focus_sessions') || '[]');
      
      let totalMins = 0;
      let totalSessions = logs.length;
      const dailyMap = {};

      logs.forEach(session => {
        const mins = Number(session.durationMins) || 0;
        totalMins += mins;
        
        const dateStr = session.date || new Date(session.created_at).toISOString().split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + mins;
      });

      setStats({
        totalMins,
        totalSessions,
        dailyMap
      });

      // Fire unlock triggers to parent page
      ACHIEVEMENTS.forEach(ach => {
        if (totalMins >= ach.target) {
          if (onThemeUnlock) {
            onThemeUnlock(ach.id);
          }
        }
      });
    } catch (e) {
      console.error("Failed to load study analytics:", e);
    }
  }, [onThemeUnlock]);

  // Generate date grid for the last 28 days (4 weeks)
  const getHeatmapGrid = () => {
    const grid = [];
    const now = Date.now();
    for (let i = 27; i >= 0; i--) {
      const date = new Date(now - i * 24 * 3600 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const mins = stats.dailyMap[dateStr] || 0;
      
      let intensity = 'empty';
      if (mins > 0 && mins < 25) intensity = 'low';
      else if (mins >= 25 && mins < 50) intensity = 'medium';
      else if (mins >= 50) intensity = 'high';

      grid.push({
        dateStr,
        mins,
        intensity,
        dayLabel: date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }
    return grid;
  };

  const heatmap = getHeatmapGrid();

  return (
    <div className={`brutal-card ${styles.analyticsCard}`}>
      <h3 className={styles.title}>📊 Study Analytics & Rewards</h3>
      
      {/* Overview numbers */}
      <div className={styles.statsOverview}>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{stats.totalMins}</span>
          <span className={styles.statLbl}>minutes focused</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{stats.totalSessions}</span>
          <span className={styles.statLbl}>sessions completed</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className={styles.heatmapSection}>
        <h4 className={styles.sectionTitle}>📅 28-Day Study Activity</h4>
        <div className={styles.gridContainer}>
          {heatmap.map((day, idx) => (
            <div 
              key={idx}
              className={`${styles.gridCell} ${styles['cell_' + day.intensity]}`}
              title={`${day.dayLabel}: ${day.mins} minutes focused`}
            />
          ))}
        </div>
        <div className={styles.legend}>
          <span>Less</span>
          <div className={`${styles.legendCell} ${styles.cell_empty}`}></div>
          <div className={`${styles.legendCell} ${styles.cell_low}`}></div>
          <div className={`${styles.legendCell} ${styles.cell_medium}`}></div>
          <div className={`${styles.legendCell} ${styles.cell_high}`}></div>
          <span>More</span>
        </div>
      </div>

      {/* Gamified Achievements list */}
      <div className={styles.achievementsSection}>
        <h4 className={styles.sectionTitle}>🏆 Workspace Unlocks</h4>
        <div className={styles.achList}>
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = stats.totalMins >= ach.target;
            const progressPct = Math.min(100, Math.round((stats.totalMins / ach.target) * 100));

            return (
              <div 
                key={ach.id} 
                className={`${styles.achRow} ${isUnlocked ? styles.achUnlocked : ''}`}
              >
                <div className={styles.achMeta}>
                  <div className={styles.achNameRow}>
                    <span className={styles.achName}>{ach.name}</span>
                    {isUnlocked ? (
                      <span className={styles.unlockedBadge}>✅ Unlocked</span>
                    ) : (
                      <span className={styles.lockedBadge}>{progressPct}%</span>
                    )}
                  </div>
                  <p className={styles.achDesc}>{ach.desc}</p>
                </div>
                <div className={styles.progressBarWrapper}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
