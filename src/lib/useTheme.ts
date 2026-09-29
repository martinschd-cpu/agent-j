import { useEffect } from 'react';
import type { ThemePref } from './store';

export const resolveDark = (pref: ThemePref) =>
  pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

/** Mirrors the chosen theme onto <html data-theme>, following the OS while set to "system". */
export function useApplyTheme(pref: ThemePref) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = resolveDark(pref);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1424' : '#2F7BF5');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
}
