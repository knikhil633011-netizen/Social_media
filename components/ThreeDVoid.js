"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeDVoid({ vibe = 'default' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Setup Scene, Camera, and WebGL Renderer
    const scene = new THREE.Scene();
    
    // Set a subtle fog to blend brutalist elements into the background
    scene.fog = new THREE.FogExp2(0xf5f5f4, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Allow HTML page body background to show through
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent black

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // 2. Map Vibe to Colors and Geometries for dynamic customization
    const vibeConfigs = {
      default: {
        color: 0x000000, // Black
        gridColor: 0xcccccc,
        geometry: new THREE.TorusKnotGeometry(3, 0.8, 100, 16),
      },
      chill: {
        color: 0x8b5cf6, // Violet
        gridColor: 0xddd6fe,
        geometry: new THREE.IcosahedronGeometry(4, 1),
      },
      chaotic: {
        color: 0x22c55e, // Green
        gridColor: 0xbbf7d0,
        geometry: new THREE.OctahedronGeometry(4, 0),
      },
      wholesome: {
        color: 0xec4899, // Pink
        gridColor: 0xfbcfe8,
        geometry: new THREE.SphereGeometry(3.5, 12, 12),
      },
      rant: {
        color: 0xef4444, // Red
        gridColor: 0xfecaca,
        geometry: new THREE.BoxGeometry(4, 4, 4),
      }
    };

    const config = vibeConfigs[vibe] || vibeConfigs.default;

    // 3. Add Grid floor (Retro brutalist grid)
    const gridHelper = new THREE.GridHelper(120, 40, 0x000000, config.gridColor);
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    // 4. Setup Lighting (Ambient and dynamic Point Spotlight tracking the mouse)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(config.color, 4.5, 80);
    pointLight.position.set(0, 5, 10);
    scene.add(pointLight);

    // 5. Add Holographic Primary Mesh Group (combining wireframe lines and soft translucent faces)
    const mainGroup = new THREE.Group();
    
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: config.color,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });

    const faceMat = new THREE.MeshPhongMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.04,
      shininess: 90,
      side: THREE.DoubleSide
    });

    const meshWire = new THREE.Mesh(config.geometry, wireframeMat);
    const meshFace = new THREE.Mesh(config.geometry, faceMat);
    
    mainGroup.add(meshWire);
    mainGroup.add(meshFace);
    mainGroup.position.set(0, 2, -5);
    scene.add(mainGroup);

    // 6. Add Orbiting Satellite Geometries (Torus ring and Cube) to build scene depth
    const satMaterial = new THREE.MeshBasicMaterial({
      color: config.color,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    const satTorus = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.2, 8, 24), satMaterial);
    const satCube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), satMaterial);
    scene.add(satTorus);
    scene.add(satCube);

    // 7. Add Particle System (Floating dust)
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 90;     // X
      positions[i + 1] = (Math.random() - 0.5) * 60; // Y
      positions[i + 2] = (Math.random() - 0.5) * 90; // Z
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.16,
      color: config.color,
      transparent: true,
      opacity: 0.5,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 8. Interactive Parallax mouse-tracking setup
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      // Normalize mouse coordinates to [-1, 1] range
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Handle Resize events
    const handleResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle rotation of the central wireframe shape
      mainGroup.rotation.x = elapsedTime * 0.12;
      mainGroup.rotation.y = elapsedTime * 0.18;
      
      // Floating vertical translation
      mainGroup.position.y = 2 + Math.sin(elapsedTime * 0.8) * 1.1;

      // Orbit satellites around the main holographic shape
      satTorus.position.x = mainGroup.position.x + Math.cos(elapsedTime * 0.7) * 8.5;
      satTorus.position.z = mainGroup.position.z + Math.sin(elapsedTime * 0.7) * 8.5;
      satTorus.position.y = mainGroup.position.y + Math.sin(elapsedTime * 1.1) * 2.5;
      satTorus.rotation.x += 0.015;
      satTorus.rotation.y += 0.025;

      satCube.position.x = mainGroup.position.x - Math.cos(elapsedTime * 0.4) * 9.5;
      satCube.position.z = mainGroup.position.z - Math.sin(elapsedTime * 0.4) * 9.5;
      satCube.position.y = mainGroup.position.y + Math.cos(elapsedTime * 0.65) * 2;
      satCube.rotation.x += 0.02;
      satCube.rotation.y += 0.01;

      // Slow rotation of particles space
      particles.rotation.y = elapsedTime * 0.025;
      particles.rotation.x = elapsedTime * 0.008;

      // Smooth parallax camera tracking interpolation
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      camera.position.x = targetX * 10;
      camera.position.y = 5 - targetY * 8;
      camera.lookAt(0, 2, -5);

      // Move point spotlight dynamically to follow the cursor, illuminating lines and grids
      pointLight.position.x = targetX * 25;
      pointLight.position.y = 5 - targetY * 18;
      pointLight.position.z = 8;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup hooks on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (renderer) {
        renderer.dispose();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [vibe]);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }} 
    />
  );
}
