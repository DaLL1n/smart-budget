import { useState, useEffect, useCallback } from 'react';

export type MobilePlatform = 'ios' | 'samsung' | 'android' | 'desktop';

const DISMISSED_KEY = 'smart_budget_pwa_install_dismissed_at';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface UsePwaInstallResult {
  isMobile: boolean;
  isStandalone: boolean;
  canNativeInstall: boolean;
  platform: MobilePlatform;
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  dismissForNow: () => void;
  triggerInstall: () => Promise<boolean>;
}

export function usePwaInstall(): UsePwaInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canNativeInstall, setCanNativeInstall] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [platform, setPlatform] = useState<MobilePlatform>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if already installed and running as standalone app
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standalone);

    // Detect mobile device
    const ua = navigator.userAgent || '';
    const mobileCheck = 
      /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      window.innerWidth <= 768;

    setIsMobile(mobileCheck);

    // Detect platform
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setPlatform('ios');
    } else if (/SamsungBrowser/i.test(ua)) {
      setPlatform('samsung');
    } else if (/Android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Capture beforeinstallprompt (Chrome / Android / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanNativeInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    const now = Date.now();
    const isDismissedRecently = dismissedAt && now - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;

    // Show modal automatically for mobile users not in standalone mode
    if (mobileCheck && !standalone && !isDismissedRecently) {
      // Small delay to allow the app to settle and not flash instantly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dismissForNow = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setIsOpen(false);
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setCanNativeInstall(false);
          setIsOpen(false);
          setIsStandalone(true);
          return true;
        }
      } catch (err) {
        console.warn('Native PWA install prompt failed:', err);
      }
    }
    return false;
  }, [deferredPrompt]);

  return {
    isMobile,
    isStandalone,
    canNativeInstall,
    platform,
    isOpen,
    openModal,
    closeModal,
    dismissForNow,
    triggerInstall,
  };
}
