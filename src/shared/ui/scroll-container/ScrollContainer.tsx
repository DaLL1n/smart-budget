import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

export interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical' | 'both';
  scrollClassName?: string;
}

export const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(({
  children,
  className = '',
  scrollClassName = '',
  orientation = 'horizontal',
  ...rest
}, forwardedRef) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const verticalTrackRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);

  // Dragging state for mouse / pointer on PC
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const dragStartH = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const dragStartV = useRef<{ startY: number; startScrollTop: number } | null>(null);

  const [scrollProgress, setScrollProgress] = useState({
    leftPercent: 0,
    widthPercent: 100,
    topPercent: 0,
    heightPercent: 100,
  });

  const updateScroll = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;

    if (orientation === 'horizontal' || orientation === 'both') {
      const maxScrollX = el.scrollWidth - el.clientWidth;
      const hasOverflowX = maxScrollX > 1;
      setHasHorizontalOverflow(hasOverflowX);
      setCanScrollLeft(hasOverflowX && el.scrollLeft > 2);
      setCanScrollRight(hasOverflowX && el.scrollLeft < maxScrollX - 2);

      if (hasOverflowX) {
        const widthPct = Math.max(12, Math.min(100, (el.clientWidth / el.scrollWidth) * 100));
        const leftPct = maxScrollX > 0 ? (el.scrollLeft / maxScrollX) * (100 - widthPct) : 0;
        setScrollProgress((prev) => ({
          ...prev,
          leftPercent: leftPct,
          widthPercent: widthPct,
        }));
      }
    }

    if (orientation === 'vertical' || orientation === 'both') {
      const maxScrollY = el.scrollHeight - el.clientHeight;
      const hasOverflowY = maxScrollY > 1;
      setHasVerticalOverflow(hasOverflowY);
      setCanScrollTop(hasOverflowY && el.scrollTop > 2);
      setCanScrollBottom(hasOverflowY && el.scrollTop < maxScrollY - 2);

      if (hasOverflowY) {
        const heightPct = Math.max(12, Math.min(100, (el.clientHeight / el.scrollHeight) * 100));
        const topPct = maxScrollY > 0 ? (el.scrollTop / maxScrollY) * (100 - heightPct) : 0;
        setScrollProgress((prev) => ({
          ...prev,
          topPercent: topPct,
          heightPercent: heightPct,
        }));
      }
    }
  }, [orientation]);

  const scrollStep = (direction: 'left' | 'right' | 'up' | 'down') => {
    const el = innerRef.current;
    if (!el) return;
    const delta = orientation === 'vertical' ? el.clientHeight * 0.75 : el.clientWidth * 0.75;
    if (direction === 'left') {
      el.scrollBy({ left: -delta, behavior: 'smooth' });
    } else if (direction === 'right') {
      el.scrollBy({ left: delta, behavior: 'smooth' });
    } else if (direction === 'up') {
      el.scrollBy({ top: -delta, behavior: 'smooth' });
    } else if (direction === 'down') {
      el.scrollBy({ top: delta, behavior: 'smooth' });
    }
  };

  // --- Horizontal Drag & Click Handlers ---
  const handleThumbPointerDownH = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = innerRef.current;
    if (!el) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    setIsDraggingH(true);
    dragStartH.current = {
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
    };
  };

  const handleThumbPointerMoveH = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingH || !dragStartH.current) return;
    const el = innerRef.current;
    const track = horizontalTrackRef.current;
    if (!el || !track) return;

    const trackWidth = track.clientWidth;
    const thumbWidth = (scrollProgress.widthPercent / 100) * trackWidth;
    const maxTrackTravel = trackWidth - thumbWidth;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (maxTrackTravel <= 0 || maxScroll <= 0) return;

    const deltaX = e.clientX - dragStartH.current.startX;
    const scrollDelta = (deltaX / maxTrackTravel) * maxScroll;
    el.scrollLeft = Math.max(0, Math.min(maxScroll, dragStartH.current.startScrollLeft + scrollDelta));
  };

  const handleThumbPointerUpH = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingH) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDraggingH(false);
      dragStartH.current = null;
    }
  };

  const handleTrackPointerDownH = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = innerRef.current;
    const track = horizontalTrackRef.current;
    if (!el || !track) return;

    const rect = track.getBoundingClientRect();
    const trackWidth = rect.width;
    const thumbWidth = (scrollProgress.widthPercent / 100) * trackWidth;
    const maxTrackTravel = trackWidth - thumbWidth;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (maxTrackTravel <= 0 || maxScroll <= 0) return;

    const clickX = e.clientX - rect.left;
    const targetThumbLeft = Math.max(0, Math.min(maxTrackTravel, clickX - thumbWidth / 2));
    const targetScroll = (targetThumbLeft / maxTrackTravel) * maxScroll;
    el.scrollLeft = targetScroll;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDraggingH(true);
    dragStartH.current = {
      startX: e.clientX,
      startScrollLeft: targetScroll,
    };
  };

  // --- Vertical Drag & Click Handlers ---
  const handleThumbPointerDownV = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = innerRef.current;
    if (!el) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    setIsDraggingV(true);
    dragStartV.current = {
      startY: e.clientY,
      startScrollTop: el.scrollTop,
    };
  };

  const handleThumbPointerMoveV = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingV || !dragStartV.current) return;
    const el = innerRef.current;
    const track = verticalTrackRef.current;
    if (!el || !track) return;

    const trackHeight = track.clientHeight;
    const thumbHeight = (scrollProgress.heightPercent / 100) * trackHeight;
    const maxTrackTravel = trackHeight - thumbHeight;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxTrackTravel <= 0 || maxScroll <= 0) return;

    const deltaY = e.clientY - dragStartV.current.startY;
    const scrollDelta = (deltaY / maxTrackTravel) * maxScroll;
    el.scrollTop = Math.max(0, Math.min(maxScroll, dragStartV.current.startScrollTop + scrollDelta));
  };

  const handleThumbPointerUpV = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingV) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDraggingV(false);
      dragStartV.current = null;
    }
  };

  const handleTrackPointerDownV = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = innerRef.current;
    const track = verticalTrackRef.current;
    if (!el || !track) return;

    const rect = track.getBoundingClientRect();
    const trackHeight = rect.height;
    const thumbHeight = (scrollProgress.heightPercent / 100) * trackHeight;
    const maxTrackTravel = trackHeight - thumbHeight;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxTrackTravel <= 0 || maxScroll <= 0) return;

    const clickY = e.clientY - rect.top;
    const targetThumbTop = Math.max(0, Math.min(maxTrackTravel, clickY - thumbHeight / 2));
    const targetScroll = (targetThumbTop / maxTrackTravel) * maxScroll;
    el.scrollTop = targetScroll;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDraggingV(true);
    dragStartV.current = {
      startY: e.clientY,
      startScrollTop: targetScroll,
    };
  };

  // Re-check whenever children change (e.g. pagination or items change)
  useEffect(() => {
    updateScroll();
    const rafId = requestAnimationFrame(updateScroll);
    const timer = setTimeout(updateScroll, 60);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [children, updateScroll]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    updateScroll();

    let ro: ResizeObserver | null = null;
    const observeAllChildren = () => {
      if (!ro || !el) return;
      Array.from(el.children).forEach((child) => ro?.observe(child));
    };

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateScroll();
      });
      ro.observe(el);
      observeAllChildren();
    }

    let mo: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        updateScroll();
        observeAllChildren();
      });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
    }

    const handleResize = () => updateScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScroll]);

  return (
    <div className={`relative group/scroll min-w-0 max-w-full w-full ${className}`} {...rest}>
      {/* The Scrollable Viewport: native built-in scrollbars are strictly hidden on all devices */}
      <div
        ref={innerRef}
        onScroll={updateScroll}
        className={`no-native-scrollbar custom-scrollbar-viewport ${
          orientation === 'horizontal' 
            ? 'overflow-x-auto overflow-y-hidden' 
            : orientation === 'vertical'
            ? 'overflow-y-auto overflow-x-hidden'
            : 'overflow-auto'
        } ${scrollClassName}`}
      >
        {children}
      </div>

      {/* Horizontal Custom Scrollbar Line with Draggable Thumb & Arrows */}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <div 
          className={`flex items-center gap-1.5 px-0.5 w-full select-none transition-all duration-200 ease-out overflow-hidden ${
            hasHorizontalOverflow ? 'h-5 opacity-100 mt-1.5' : 'h-0 opacity-0 mt-0 pointer-events-none'
          }`} 
          aria-hidden="true"
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => scrollStep('left')}
            disabled={!canScrollLeft}
            className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-850 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
            title="Прокрутить влево"
          >
            <ChevronLeft 
              className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                canScrollLeft ? 'text-slate-300' : 'text-slate-700/40'
              }`} 
            />
          </button>

          {/* Track Hit Container with Draggable Thumb */}
          <div 
            ref={horizontalTrackRef}
            onPointerDown={handleTrackPointerDownH}
            onPointerMove={handleThumbPointerMoveH}
            onPointerUp={handleThumbPointerUpH}
            onPointerCancel={handleThumbPointerUpH}
            className="h-5 flex items-center flex-1 cursor-pointer select-none relative group/track"
            title="Зажмите и перетащите для прокрутки"
          >
            {/* Visual Track Bar (2x thinner: 3px normal, 4px on hover) */}
            <div className="w-full h-[3px] group-hover/track:h-1 bg-slate-800/80 group-hover/track:bg-slate-800 rounded-full relative transition-all duration-150 overflow-visible">
              {/* Draggable Pill Thumb */}
              <div 
                onPointerDown={handleThumbPointerDownH}
                onPointerMove={handleThumbPointerMoveH}
                onPointerUp={handleThumbPointerUpH}
                onPointerCancel={handleThumbPointerUpH}
                className={`absolute -top-[0.5px] -bottom-[0.5px] rounded-full touch-none select-none ${
                  isDraggingH 
                    ? 'bg-emerald-400/90 shadow-[0_0_3px_rgba(16,185,129,0.25)] cursor-grabbing transition-none' 
                    : 'bg-slate-400/80 hover:bg-slate-300 hover:shadow-none cursor-grab transition-all duration-150'
                }`}
                style={{
                  left: `${scrollProgress.leftPercent}%`,
                  width: `${scrollProgress.widthPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => scrollStep('right')}
            disabled={!canScrollRight}
            className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-850 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
            title="Прокрутить вправо"
          >
            <ChevronRight 
              className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                canScrollRight ? 'text-slate-300' : 'text-slate-700/40'
              }`} 
            />
          </button>
        </div>
      )}

      {/* Vertical Custom Scrollbar Line with Draggable Thumb & Arrows */}
      {(orientation === 'vertical' || orientation === 'both') && hasVerticalOverflow && (
        <div className="flex flex-col items-center gap-1 absolute right-0.5 top-1.5 bottom-1.5 w-4 select-none z-10" aria-hidden="true">
          {/* Up Arrow Button */}
          <button
            type="button"
            onClick={() => scrollStep('up')}
            disabled={!canScrollTop}
            className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-850 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
            title="Прокрутить вверх"
          >
            <ChevronUp 
              className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                canScrollTop ? 'text-slate-300' : 'text-slate-700/40'
              }`} 
            />
          </button>

          {/* Track Hit Container with Draggable Thumb */}
          <div 
            ref={verticalTrackRef}
            onPointerDown={handleTrackPointerDownV}
            onPointerMove={handleThumbPointerMoveV}
            onPointerUp={handleThumbPointerUpV}
            onPointerCancel={handleThumbPointerUpV}
            className="w-4 flex justify-center flex-1 cursor-pointer select-none relative group/vtrack"
            title="Зажмите и перетащите для прокрутки"
          >
            {/* Visual Track Bar (2x thinner: 3px normal, 4px on hover) */}
            <div className="h-full w-[3px] group-hover/vtrack:w-1 bg-slate-800/80 group-hover/vtrack:bg-slate-800 rounded-full relative transition-all duration-150 overflow-visible">
              {/* Draggable Pill Thumb */}
              <div 
                onPointerDown={handleThumbPointerDownV}
                onPointerMove={handleThumbPointerMoveV}
                onPointerUp={handleThumbPointerUpV}
                onPointerCancel={handleThumbPointerUpV}
                className={`absolute -left-[0.5px] -right-[0.5px] rounded-full touch-none select-none ${
                  isDraggingV 
                    ? 'bg-emerald-400/90 shadow-[0_0_3px_rgba(16,185,129,0.25)] cursor-grabbing transition-none' 
                    : 'bg-slate-400/80 hover:bg-slate-300 hover:shadow-none cursor-grab transition-all duration-150'
                }`}
                style={{
                  top: `${scrollProgress.topPercent}%`,
                  height: `${scrollProgress.heightPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Down Arrow Button */}
          <button
            type="button"
            onClick={() => scrollStep('down')}
            disabled={!canScrollBottom}
            className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-850 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
            title="Прокрутить вниз"
          >
            <ChevronDown 
              className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                canScrollBottom ? 'text-slate-300' : 'text-slate-700/40'
              }`} 
            />
          </button>
        </div>
      )}
    </div>
  );
});

ScrollContainer.displayName = 'ScrollContainer';
