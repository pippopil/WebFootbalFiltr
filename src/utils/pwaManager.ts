import { UserProfile } from '../types';
import { isUserPaid } from './filterDefaults';

let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

/**
 * Checks if the application is currently running as an installed PWA
 * (standalone display-mode, fullscreen display-mode, iOS home-screen, or ?source=pwa).
 */
export const isPwaStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreenMedia = window.matchMedia('(display-mode: fullscreen)').matches;
  const isIosStandalone = (window.navigator as any).standalone === true;
  
  const urlParams = new URLSearchParams(window.location.search);
  const isPwaQuery = urlParams.get('source') === 'pwa' || urlParams.get('mode') === 'pwa';

  return isStandaloneMedia || isFullscreenMedia || isIosStandalone || isPwaQuery;
};

/**
 * Checks if a user has active paid subscription access to use the PWA application
 */
export const canUserAccessPwa = (user?: UserProfile | null): boolean => {
  return isUserPaid(user);
};

/**
 * Prompt the user to install PWA if the deferred prompt is available
 */
export const promptPwaInstallation = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferredInstallPrompt) {
    return 'unavailable';
  }
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'unavailable';
  }
};
