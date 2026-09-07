import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, MoveHorizontal } from 'lucide-react';

export interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical' | 'both';
  scrollClassName?: string;
  showHintBadge?: boolean;
  hintText?: string;
}

export const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(({
  children,
  className = '',
  scrollClassName = '',
  orientation = 'horizontal',
  showHintBadge = false,
  hintText = 'Свайп для просмотра всех колонок',
  ...rest
}, forwardedRef) => {
  const innerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  const updateScroll = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;

    if (orientation === 'horizontal' || orientation === 'both') {
      const maxScrollX = el.scrollWidth - el.clientWidth;
      const hasOverflowX = maxScrollX > 4;
      setHasHorizontalOverflow(hasOverflowX);
      setCanScrollLeft(hasOverflowX && el.scrollLeft > 6);
      setCanScrollRight(hasOverflowX && el.scrollLeft < maxScrollX - 6);
    }

    if (orientation === 'vertical' || orientation === 'both') {
      const maxScrollY = el.scrollHeight - el.clientHeight;
      const hasOverflowY = maxScrollY > 4;
      setCanScrollTop(hasOverflowY && el.scrollTop > 6);
      setCanScrollBottom(hasOverflowY && el.scrollTop < maxScrollY - 6);
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
      {/* Optional Mobile Hint Badge */}
      {showHintBadge && hasHorizontalOverflow && (
        <div className="sm:hidden flex items-center justify-between pb-2 px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-0.5 rounded-full shadow-sm">
            <MoveHorizontal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{hintText}</span>
          </div>
          {canScrollRight && (
            <span className="text-[10px] font-medium text-emerald-400/90 font-mono animate-pulse flex items-center gap-0.5">
              Ещё →
            </span>
          )}
        </div>
      )}

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

      {/* Left Fade Mask with Chevron */}
      {(orientation === 'horizontal' || orientation === 'both') && canScrollLeft && (
        <div 
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent z-10 flex items-center justify-start pl-1 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="w-5 h-5 rounded-full bg-slate-900/90 border border-slate-700/70 flex items-center justify-center text-slate-300 shadow-md">
            <ChevronLeft className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Right Fade Mask with Chevron */}
      {(orientation === 'horizontal' || orientation === 'both') && canScrollRight && (
        <div 
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-10 bg-gradient-to-l from-slate-950/95 via-slate-950/70 to-transparent z-10 flex items-center justify-end pr-1 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="w-5 h-5 rounded-full bg-slate-900/90 border border-slate-700/70 flex items-center justify-center text-emerald-400 shadow-md animate-pulse">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Top Fade Mask */}
      {(orientation === 'vertical' || orientation === 'both') && canScrollTop && (
        <div 
          className="pointer-events-none absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent z-10 flex items-start justify-center pt-1 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="w-5 h-5 rounded-full bg-slate-900/90 border border-slate-700/70 flex items-center justify-center text-slate-300 shadow-md">
            <ChevronUp className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Bottom Fade Mask */}
      {(orientation === 'vertical' || orientation === 'both') && canScrollBottom && (
        <div 
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent z-10 flex items-end justify-center pb-1 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="w-5 h-5 rounded-full bg-slate-900/90 border border-slate-700/70 flex items-center justify-center text-emerald-400 shadow-md animate-pulse">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  );
});

ScrollContainer.displayName = 'ScrollContainer';
