import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global capturing scroll tracker: illuminates custom-scrollbar dynamically on mobile touch & desktop scrolling
if (typeof window !== 'undefined') {
  const triggerScrollingState = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return;
    const el = target.classList?.contains('custom-scrollbar')
      ? target
      : (target.closest?.('.custom-scrollbar') as HTMLElement | null);

    if (el) {
      el.setAttribute('data-scrolling', 'true');
      const timer = (el as any).__scrollTimer;
      if (timer) clearTimeout(timer);
      (el as any).__scrollTimer = setTimeout(() => {
        el.removeAttribute('data-scrolling');
      }, 1000);
    }
  };

  ['scroll', 'touchmove', 'touchstart', 'wheel'].forEach((eventName) => {
    window.addEventListener(
      eventName,
      (e) => triggerScrollingState(e.target),
      { capture: true, passive: true }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
