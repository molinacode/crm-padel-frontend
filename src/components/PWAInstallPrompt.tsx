import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const checkIfInstalled = () => {
    const navigatorWithStandalone = window.navigator as NavigatorStandalone;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigatorWithStandalone.standalone === true;

    if (!isStandalone && localStorage.getItem('pwa-installed') === 'true') {
      localStorage.removeItem('pwa-installed');
      localStorage.removeItem('pwa-install-dismissed');
      console.log('🔄 PWA desinstalada detectada, limpiando estado');
    }

    return isStandalone;
  };

  const clearInstallationState = () => {
    localStorage.removeItem('pwa-installed');
    localStorage.removeItem('pwa-install-dismissed');
    sessionStorage.removeItem('pwa-install-dismissed');
    console.log('🧹 Estado de instalación limpiado');
  };

  useEffect(() => {
    const initiallyInstalled = checkIfInstalled();
    setTimeout(() => {
      setIsInstalled(initiallyInstalled);
      if (initiallyInstalled) {
        localStorage.setItem('pwa-installed', 'true');
      }
    }, 0);

    if (initiallyInstalled) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      console.log('✅ PWA instalada correctamente');
    };

    const installationCheckInterval = setInterval(() => {
      const currentlyInstalled = checkIfInstalled();
      if (currentlyInstalled !== isInstalled) {
        setIsInstalled(currentlyInstalled);
        if (currentlyInstalled) {
          localStorage.setItem('pwa-installed', 'true');
        } else {
          clearInstallationState();
        }
      }
    }, 30000);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      const standalone = e.matches;
      setIsInstalled(standalone);

      if (standalone) {
        localStorage.setItem('pwa-installed', 'true');
      } else {
        clearInstallationState();
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleBeforeUnload = () => {
      setTimeout(() => {
        if (!checkIfInstalled()) {
          clearInstallationState();
        }
      }, 100);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(installationCheckInterval);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó instalar la PWA');
    } else {
      console.log('❌ Usuario rechazó instalar la PWA');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    const timestamp = Date.now().toString();
    sessionStorage.setItem('pwa-install-dismissed', timestamp);
    localStorage.setItem('pwa-install-dismissed', timestamp);
    console.log('❌ Usuario descartó la instalación de PWA');
  };

  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isInstalled || !showInstallPrompt) {
      setTimeout(() => setShouldShow(false), 0);
      return;
    }

    const dismissedSession = sessionStorage.getItem('pwa-install-dismissed');
    const dismissedLocal = localStorage.getItem('pwa-install-dismissed');
    const dismissed = dismissedSession || dismissedLocal;

    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      if (now - dismissedTime < sevenDays) {
        setTimeout(() => setShouldShow(false), 0);
        return;
      }
    }

    setTimeout(() => setShouldShow(true), 0);
  }, [isInstalled, showInstallPrompt]);

  if (!shouldShow) {
    return null;
  }

  const handleResetState = () => {
    clearInstallationState();
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    setIsInstalled(false);
    console.log('🔄 Estado de PWA reseteado manualmente');
  };

  return (
    <div className='fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm'>
      <div className='bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg p-4'>
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-blue-600 dark:text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                />
              </svg>
            </div>
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-dark-text'>
              Instalar CRM Pádel
            </h3>
            <p className='text-sm text-gray-600 dark:text-dark-text2 mt-1'>
              Instala la app en tu dispositivo para acceso rápido y mejor experiencia.
            </p>
            <div className='flex space-x-2 mt-3'>
              <button
                type='button'
                onClick={handleInstallClick}
                className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors'
              >
                Instalar
              </button>
              <button
                type='button'
                onClick={handleDismiss}
                className='text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text text-sm font-medium px-3 py-2 rounded-md transition-colors'
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            type='button'
            onClick={handleDismiss}
            className='flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {import.meta.env.DEV && (
          <div className='mt-3 pt-3 border-t border-gray-200 dark:border-dark-border'>
            <button
              type='button'
              onClick={handleResetState}
              className='text-xs text-gray-500 hover:text-gray-700 dark:text-dark-text2 dark:hover:text-dark-text transition-colors'
            >
              🔄 Reset PWA State (Dev)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
