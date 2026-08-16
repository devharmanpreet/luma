import { useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';
const THEME_KEY = 'luma:theme';

let theme: Theme = (localStorage.getItem(THEME_KEY) as Theme) || 'dark';
const listeners = new Set<() => void>();

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', t);
}

applyTheme(theme);

function emit() {
  listeners.forEach((l) => l());
}

export const themeStore = {
  get: () => theme,
  set(t: Theme) {
    theme = t;
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
    emit();
  },
  toggle() {
    this.set(theme === 'dark' ? 'light' : 'dark');
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useTheme(): Theme {
  return useSyncExternalStore(themeStore.subscribe, () => theme, () => theme);
}
