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
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);

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

  const handleHorizontalTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = innerRef.current;
    const track = e.currentTarget;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetScroll = ratio * (el.scrollWidth - el.clientWidth);
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  const handleVerticalTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = innerRef.current;
    const track = e.currentTarget;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, clickY / rect.height));
    const targetScroll = ratio * (el.scrollHeight - el.clientHeight);
    el.scrollTo({ top: targetScroll, behavior: 'smooth' });
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

      {/* Subtle Horizontal Scrollbar Line with Light Indicator Arrows */}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <div 
          className={`flex items-center gap-1.5 px-0.5 w-full select-none transition-all duration-200 ease-out overflow-hidden ${
            hasHorizontalOverflow ? 'h-4 opacity-100 mt-1.5' : 'h-0 opacity-0 mt-0 pointer-events-none'
          }`} 
          aria-hidden="true"
        >
          <button
            type="button"
            onClick={() => scrollStep('left')}
            disabled={!canScrollLeft}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Прокрутить влево"
          >
            <ChevronLeft 
              className={`w-3 h-3 shrink-0 transition-colors duration-200 ${
                canScrollLeft ? 'text-slate-400' : 'text-slate-700/30'
              }`} 
            />
          </button>
          <div 
            onClick={handleHorizontalTrackClick}
            className="h-1 flex-1 bg-slate-800/60 hover:bg-slate-800/90 rounded-full relative overflow-hidden cursor-pointer"
          >
            <div 
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-150 ${
                canScrollRight || canScrollLeft ? 'bg-slate-400/60 hover:bg-slate-300' : 'bg-slate-600/40'
              }`}
              style={{
                left: `${scrollProgress.leftPercent}%`,
                width: `${scrollProgress.widthPercent}%`,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => scrollStep('right')}
            disabled={!canScrollRight}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Прокрутить вправо"
          >
            <ChevronRight 
              className={`w-3 h-3 shrink-0 transition-colors duration-200 ${
                canScrollRight ? 'text-slate-400' : 'text-slate-700/30'
              }`} 
            />
          </button>
        </div>
      )}

      {/* Subtle Vertical Scrollbar Line with Light Indicator Arrows */}
      {(orientation === 'vertical' || orientation === 'both') && hasVerticalOverflow && (
        <div className="flex flex-col items-center gap-1 absolute right-0.5 top-1.5 bottom-1.5 w-3 select-none z-10" aria-hidden="true">
          <button
            type="button"
            onClick={() => scrollStep('up')}
            disabled={!canScrollTop}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Прокрутить вверх"
          >
            <ChevronUp 
              className={`w-3 h-3 shrink-0 transition-colors duration-200 ${
                canScrollTop ? 'text-slate-400' : 'text-slate-700/30'
              }`} 
            />
          </button>
          <div 
            onClick={handleVerticalTrackClick}
            className="w-1 flex-1 bg-slate-800/60 hover:bg-slate-800/90 rounded-full relative overflow-hidden cursor-pointer"
          >
            <div 
              className={`absolute left-0 right-0 rounded-full transition-all duration-150 ${
                canScrollTop || canScrollBottom ? 'bg-slate-400/60 hover:bg-slate-300' : 'bg-slate-600/40'
              }`}
              style={{
                top: `${scrollProgress.topPercent}%`,
                height: `${scrollProgress.heightPercent}%`,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => scrollStep('down')}
            disabled={!canScrollBottom}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Прокрутить вниз"
          >
            <ChevronDown 
              className={`w-3 h-3 shrink-0 transition-colors duration-200 ${
                canScrollBottom ? 'text-slate-400' : 'text-slate-700/30'
              }`} 
            />
          </button>
        </div>
      )}
    </div>
  );
});

ScrollContainer.displayName = 'ScrollContainer';
