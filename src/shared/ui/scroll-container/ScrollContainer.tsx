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
      const hasOverflowX = maxScrollX > 4;
      setHasHorizontalOverflow(hasOverflowX);
      setCanScrollLeft(hasOverflowX && el.scrollLeft > 4);
      setCanScrollRight(hasOverflowX && el.scrollLeft < maxScrollX - 4);

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
      const hasOverflowY = maxScrollY > 4;
      setHasVerticalOverflow(hasOverflowY);
      setCanScrollTop(hasOverflowY && el.scrollTop > 4);
      setCanScrollBottom(hasOverflowY && el.scrollTop < maxScrollY - 4);

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

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    updateScroll();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateScroll();
      });
      ro.observe(el);
      if (el.firstElementChild) {
        ro.observe(el.firstElementChild);
      }
    }

    const handleResize = () => updateScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScroll]);

  return (
    <div className={`relative group/scroll ${className}`} {...rest}>
      {/* The Scrollable Viewport */}
      <div
        ref={innerRef}
        onScroll={updateScroll}
        className={`custom-scrollbar ${
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
      {(orientation === 'horizontal' || orientation === 'both') && hasHorizontalOverflow && (
        <div className="flex items-center gap-1.5 pt-1.5 pb-0.5 px-1 w-full select-none" aria-hidden="true">
          <ChevronLeft 
            className={`w-3 h-3 shrink-0 transition-colors duration-200 ${
              canScrollLeft ? 'text-slate-400' : 'text-slate-700/30'
            }`} 
          />
          <div className="h-1 flex-1 bg-slate-800/60 rounded-full relative overflow-hidden">
            <div 
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-150 ${
                canScrollRight || canScrollLeft ? 'bg-slate-400/60' : 'bg-slate-600/40'
              }`}
              style={{
                left: `${scrollProgress.leftPercent}%`,
                width: `${scrollProgress.widthPercent}%`,
              }}
            />
          </div>
          <ChevronRight 
            className={`w-3 h-3 shrink-0 transition-colors duration-200 ${
              canScrollRight ? 'text-emerald-400/90' : 'text-slate-700/30'
            }`} 
          />
        </div>
      )}

      {/* Subtle Vertical Scrollbar Line with Light Indicator Arrows */}
      {(orientation === 'vertical' || orientation === 'both') && hasVerticalOverflow && (
        <div className="flex flex-col items-center gap-1 absolute right-0.5 top-2 bottom-2 w-2.5 pointer-events-none select-none z-10" aria-hidden="true">
          <ChevronUp 
            className={`w-2.5 h-2.5 shrink-0 transition-colors duration-200 ${
              canScrollTop ? 'text-slate-400' : 'text-slate-700/30'
            }`} 
          />
          <div className="w-0.5 flex-1 bg-slate-800/60 rounded-full relative overflow-hidden">
            <div 
              className={`absolute left-0 right-0 rounded-full transition-all duration-150 ${
                canScrollTop || canScrollBottom ? 'bg-slate-400/60' : 'bg-slate-600/40'
              }`}
              style={{
                top: `${scrollProgress.topPercent}%`,
                height: `${scrollProgress.heightPercent}%`,
              }}
            />
          </div>
          <ChevronDown 
            className={`w-2.5 h-2.5 shrink-0 transition-colors duration-200 ${
              canScrollBottom ? 'text-emerald-400/90' : 'text-slate-700/30'
            }`} 
          />
        </div>
      )}
    </div>
  );
});

ScrollContainer.displayName = 'ScrollContainer';
