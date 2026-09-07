import { useEffect } from 'react';

/**
 * Checks whether an element or any of its scrollable parents (up to document.body)
 * can scroll in the requested vertical/horizontal direction.
 */
function isInsideScrollableContainer(target: EventTarget | null, deltaY: number, deltaX: number): boolean {
  if (!(target instanceof HTMLElement)) return false;

  let current: HTMLElement | null = target;

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
    const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && current.scrollWidth > current.clientWidth;

    if (isScrollableY && Math.abs(deltaY) > Math.abs(deltaX)) {
      const canScrollDown = deltaY > 0 && current.scrollTop + current.clientHeight < current.scrollHeight - 1;
      const canScrollUp = deltaY < 0 && current.scrollTop > 1;
      if (canScrollDown || canScrollUp) {
        return true;
      }
    }

    if (isScrollableX && Math.abs(deltaX) > 0) {
      const canScrollRight = deltaX > 0 && current.scrollLeft + current.clientWidth < current.scrollWidth - 1;
      const canScrollLeft = deltaX < 0 && current.scrollLeft > 1;
      if (canScrollRight || canScrollLeft) {
        return true;
      }
    }

    current = current.parentElement;
  }

  return false;
}

/**
 * useSmoothScroll
 * 
 * Provides an ultra-smooth, kinetic scrolling experience for `document.body` / window:
 * - On PC (Windows, macOS, Linux): Smoothly interpolates discrete mouse wheel notches (step jumps)
 *   into a fluid, hardware-accelerated 60/120Hz glide using requestAnimationFrame.
 * - On Mobile (iOS Safari, Android Chrome, Samsung Internet): Hands off 100% to native GPU compositor
 *   momentum physics to avoid touch latency, gesture conflicts or rubber-band breakages.
 * - Respects prefers-reduced-motion for accessibility.
 * - Automatically syncs when dragging the scrollbar thumb or on programmatic route navigation.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    // 1. Accessibility check: disable if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 2. Touch screen detection: do NOT hijack wheel on touch-first devices (iOS, Android, tablets)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouchDevice) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let isAnimating = false;
    let rafId: number | null = null;

    const getMaxScroll = (): number => {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const step = () => {
      const diff = targetY - currentY;

      // When close enough, snap to target and finish
      if (Math.abs(diff) < 0.5) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        isAnimating = false;
        rafId = null;
        return;
      }

      // Smooth damping factor: 0.14 provides responsive yet silky smooth glide
      currentY += diff * 0.14;
      window.scrollTo(0, currentY);

      rafId = requestAnimationFrame(step);
    };

    const handleWheel = (e: WheelEvent) => {
      // Allow browser zoom (Ctrl + wheel / pinch)
      if (e.ctrlKey) return;

      // Allow native horizontal tilt wheels without intervention
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // If event happened inside an inner scrollable widget (e.g. table, modal, dropdown), leave it alone
      if (isInsideScrollableContainer(e.target, e.deltaY, e.deltaX)) {
        return;
      }

      // Convert wheel delta to pixels based on deltaMode
      let delta = e.deltaY;
      if (e.deltaMode === 1) {
        // Delta mode: lines (typical on Firefox/Windows mouse wheels)
        delta *= 38;
      } else if (e.deltaMode === 2) {
        // Delta mode: pages
        delta *= window.innerHeight * 0.85;
      }

      // If wheel delta is tiny (e.g. macOS precision trackpad with built-in kinetic physics),
      // allow native trackpad handling to avoid double-smoothing
      if (!Number.isInteger(e.deltaY) && Math.abs(e.deltaY) < 15) {
        targetY = window.scrollY;
        currentY = window.scrollY;
        return;
      }

      // Prevent abrupt stepped jump
      e.preventDefault();

      const maxScroll = getMaxScroll();
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));

      if (!isAnimating) {
        isAnimating = true;
        currentY = window.scrollY;
        rafId = requestAnimationFrame(step);
      }
    };

    // Keep state in sync if user manually drags scrollbar or presses PageDown/Space
    const handleScroll = () => {
      if (!isAnimating) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    // Cancel animation on direct pointer/touch interactions
    const handlePointerDown = () => {
      if (isAnimating && rafId !== null) {
        cancelAnimationFrame(rafId);
        isAnimating = false;
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);
}
