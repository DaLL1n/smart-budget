import React, { useEffect, useState, useRef } from 'react';

/**
 * MobileScrollIndicator
 * 
 * Elegant, native-like mobile scrollbar pill:
 * - Hugs the right screen edge (1.5px from edge) with safe-area insets.
 * - Completely invisible when idle.
 * - Instantly fades in when scrolling begins and smoothly tracks page scroll position.
 * - Naturally fades out ~850ms after scrolling stops, just like the native iOS / Android indicator.
 * - Only renders on mobile/touch screens (pointer: coarse or <= 768px).
 */
export const MobileScrollIndicator: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [thumbHeight, setThumbHeight] = useState<number>(36);
  const [thumbTop, setThumbTop] = useState<number>(0);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchScreenRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if device is touch / mobile
    const checkTouch = () => {
      isTouchScreenRef.current =
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 768;
    };
    checkTouch();
    window.addEventListener('resize', checkTouch, { passive: true });

    const updateScrollMetrics = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll <= 15) {
        setHasOverflow(false);
        setIsVisible(false);
        return;
      }

      setHasOverflow(true);

      // Available height minus small top & bottom padding
      const topPadding = 6;
      const bottomPadding = 6;
      const availableTrackHeight = clientHeight - topPadding - bottomPadding;

      // Thumb height proportional to viewport ratio (min 32px, max 70% of screen)
      const calculatedHeight = Math.max(
        32,
        Math.min(
          availableTrackHeight * 0.7,
          (clientHeight / scrollHeight) * availableTrackHeight
        )
      );

      const maxTravel = availableTrackHeight - calculatedHeight;
      const currentScroll = window.scrollY;
      const progress = Math.min(1, Math.max(0, currentScroll / maxScroll));
      const calculatedTop = progress * maxTravel;

      setThumbHeight(calculatedHeight);
      setThumbTop(calculatedTop);
    };

    const handleScroll = () => {
      if (!isTouchScreenRef.current) return;

      updateScrollMetrics();
      setIsVisible(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Hide ~850ms after user stops scrolling, mirroring native iOS/Android behavior
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 850);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollMetrics, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollMetrics);
      window.removeEventListener('resize', checkTouch);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!hasOverflow) return null;

  return (
    <div
      aria-hidden="true"
      className="md:hidden fixed right-[1.5px] top-[max(6px,env(safe-area-inset-top,6px))] bottom-[max(6px,env(safe-area-inset-bottom,6px))] w-[2.5px] z-50 pointer-events-none select-none transition-opacity duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        className="w-full bg-slate-400/65 rounded-full shadow-[0_0_1px_rgba(0,0,0,0.5)] transition-transform duration-75 ease-out"
        style={{
          height: `${thumbHeight}px`,
          transform: `translate3d(0, ${thumbTop}px, 0)`,
          willChange: 'transform, opacity',
        }}
      />
    </div>
  );
};
