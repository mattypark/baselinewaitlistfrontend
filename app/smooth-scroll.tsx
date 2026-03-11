'use client';

import { useEffect } from 'react';

export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('ontouchstart' in window) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;
    let isAnimating = false;

    const ease = 0.08;

    function animate() {
      currentY += (targetY - currentY) * ease;

      if (Math.abs(targetY - currentY) < 0.5) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        isAnimating = false;
        rafId = null;
        return;
      }

      window.scrollTo(0, currentY);
      rafId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!isAnimating) {
        isAnimating = true;
        currentY = window.scrollY;
        rafId = requestAnimationFrame(animate);
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();

      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = currentY;
      }

      targetY += e.deltaY;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetY = Math.max(0, Math.min(targetY, maxScroll));

      startAnimation();
    }

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
