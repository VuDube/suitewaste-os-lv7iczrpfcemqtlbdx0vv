import { useState, useEffect, useCallback } from 'react';
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
export const useRegisterSW = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);
};
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('`beforeinstallprompt` event was fired.');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);
  const promptInstall = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        if (outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
      });
    }
  }, [deferredPrompt]);
  return { deferredPrompt, promptInstall };
};