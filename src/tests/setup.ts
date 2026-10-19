import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import toast from 'react-hot-toast';
import { afterEach, beforeEach } from 'vitest';

import i18n from '../i18n/i18n';

// This setup also runs in the server suites' Node environment.
if (typeof window !== 'undefined') {
  // JSDOM has no media-query implementation; keep real toast rendering and timers.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // ToastBar stays transparent until measured. JSDOM does not perform layout;
  // supply dimensions only inside the real library Toaster, not for application UI.
  const getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return this.closest('[data-rht-toaster]')
      ? new DOMRect(0, 0, 300, 48)
      : getBoundingClientRect.call(this);
  };
}

beforeEach(async () => {
  toast.remove();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  toast.remove();
});
