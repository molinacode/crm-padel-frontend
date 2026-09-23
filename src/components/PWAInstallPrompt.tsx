import { useEffect, useState } from 'react';

const STORAGE_KEY = 'crm-padel-install-dismissed-at';
const DISMISS_MS = 14 * 86_400_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isMiBrowser(): boolean {
  return /MiuiBrowser|XiaoMi|MiBrowser|Mint Browser/i.test(window.navigator.userAgent);
}

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [miBrowser, setMiBrowser] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    setIos(isIos());
    setMiBrowser(isMiBrowser());
    setVisible(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const hide = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', hide);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', hide);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* el aviso vuelve en 14 días si el almacenamiento no está disponible */
    }
    setVisible(false);
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') dismiss();
    setPromptEvent(null);
  }

  if (!visible) return null;

  const hint = miBrowser
    ? 'Ábrela en Chrome y pulsa Añadir. En este navegador solo queda un acceso directo que Xiaomi borra al limpiar.'
    : ios
      ? 'En Safari: toca Compartir y luego Añadir a pantalla de inicio.'
      : promptEvent
        ? 'Queda en el inicio. Cerrar Chrome no la quita.'
        : 'Menú del navegador → Instalar app.';

  return (
    <div className='fixed inset-x-0 bottom-16 z-30 border-t border-[#2a332c] bg-[#1c241e] p-4 text-[#f5f1e8] md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-lg md:border'>
      <p className='text-sm font-semibold'>Añade CRM Pádel al inicio</p>
      <p className='mt-1 text-sm text-[#d8d2c4]'>{hint}</p>
      <div className='mt-3 flex items-center gap-3'>
        {promptEvent ? (
          <button
            type='button'
            onClick={() => void install()}
            className='rounded-md bg-[#c9a658] px-4 py-2 text-sm font-semibold text-[#0e1410]'
          >
            Añadir
          </button>
        ) : null}
        <button type='button' onClick={dismiss} className='text-sm text-[#c9a658]'>
          Ahora no
        </button>
      </div>
    </div>
  );
}
