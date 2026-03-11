'use client';

import { useEffect } from 'react';

/**
 * Spring-based smooth scroll — replicates "SexyScroll" from Framer.
 * Intercepts wheel/keyboard scroll and applies critically-damped spring physics.
 */
export function useSmoothScroll({ smoothTime = 0.12, maxSpeed = 600 } = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Skip on touch devices — native momentum is already smooth
    if ('ontouchstart' in window) return;

    let currentY = window.scrollY;
    let targetY = currentY;
    let rafId: number | null = null;
    let velocity = 0;

    const damping = 1 - Math.exp(-20 * smoothTime);

    function clampTarget() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetY = Math.max(0, Math.min(targetY, maxScroll));
    }

    function animate() {
      const diff = targetY - currentY;

      // Spring interpolation (critically damped)
      velocity += diff * damping;
      velocity *= 0.85; // friction
      currentY += velocity;

      // Snap when close enough
      if (Math.abs(diff) < 0.5 && Math.abs(velocity) < 0.5) {
        currentY = targetY;
        velocity = 0;
        window.scrollTo(0, currentY);
        rafId = null;
        return;
      }

      window.scrollTo(0, currentY);
      rafId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (rafId === null) {
        rafId = requestAnimationFrame(animate);
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();

      // Clamp delta to maxSpeed
      const delta = Math.max(-maxSpeed, Math.min(maxSpeed, e.deltaY));
      targetY += delta;
      clampTarget();

      // Sync currentY if user scrolled externally
      currentY = window.scrollY;
      startAnimation();
    }

    function onKeyDown(e: KeyboardEvent) {
      const scrollKeys: Record<string, number> = {
        ArrowDown: 80,
        ArrowUp: -80,
        PageDown: window.innerHeight * 0.8,
        PageUp: -window.innerHeight * 0.8,
        Space: window.innerHeight * 0.8,
        Home: -document.documentElement.scrollHeight,
        End: document.documentElement.scrollHeight,
      };

      const key = e.code === 'Space' ? 'Space' : e.key;
      const delta = scrollKeys[key];
      if (delta === undefined) return;

      // Don't hijack if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      e.preventDefault();
      targetY += delta;
      clampTarget();
      currentY = window.scrollY;
      startAnimation();
    }

    // Sync on external scroll (e.g. anchor links, browser back/forward)
    function onScroll() {
      if (rafId === null) {
        currentY = window.scrollY;
        targetY = currentY;
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [smoothTime, maxSpeed]);
}

export default function SmoothScroll() {
  useSmoothScroll({ smoothTime: 0.1, maxSpeed: 500 });
  return null;
}
