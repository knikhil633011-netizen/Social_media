"use client";

import React, { useEffect, useState, useRef } from 'react';

export default function CursorTrail({ vibe = 'default' }) {
  const [particles, setParticles] = useState([]);
  const lastSpawnTime = useRef(0);
  const requestRef = useRef(null);
  const particlesRef = useRef([]);

  // Sync ref with state list so the animation frame loop reads current positions instantly
  particlesRef.current = particles;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return; // disable on touchscreen mobile devices

    const emojis = {
      default: ['✨', '💬', '👍', '💫'],
      chill: ['🌌', '😢', '💤', '💜', '🪐'],
      chaotic: ['⚡', '🌀', '😂', '🔥', '☄️'],
      wholesome: ['❤️', '🌱', '🌸', '✨', '🎈'],
      rant: ['🔥', '🤬', '💥', '💀', '👿']
    };

    const activeEmojis = emojis[vibe] || emojis.default;

    const handleMouseMove = (e) => {
      const now = Date.now();
      // Throttle: spawn a cursor particle at most every 45 milliseconds
      if (now - lastSpawnTime.current < 45) return;
      lastSpawnTime.current = now;

      const randomEmoji = activeEmojis[Math.floor(Math.random() * activeEmojis.length)];
      const id = Math.random().toString(36).substr(2, 9);
      
      const newParticle = {
        id,
        x: e.clientX,
        y: e.clientY + window.scrollY, // align exactly with scrolling document
        emoji: randomEmoji,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.2 - Math.random() * 1.5, // float upwards
        scale: 0.8 + Math.random() * 0.5,
        opacity: 1.0
      };

      setParticles((prev) => [...prev, newParticle]);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // High performance particle physics update loop
    const updatePhysics = () => {
      if (particlesRef.current.length > 0) {
        setParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              opacity: p.opacity - 0.038 // fade out smoothly
            }))
            .filter((p) => p.opacity > 0)
        );
      }
      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, [vibe]);

  if (particles.length === 0) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 99999
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            transform: `translate(-50%, -50%) scale(${p.scale})`,
            opacity: p.opacity,
            fontSize: '1.2rem',
            userSelect: 'none',
            pointerEvents: 'none',
            filter: 'drop-shadow(1px 1px 0px #000000)',
            transition: 'opacity 0.03s linear'
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
