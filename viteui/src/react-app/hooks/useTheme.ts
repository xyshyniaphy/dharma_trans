import { useEffect } from 'react'; // Import useEffect
import { atom, useRecoilState } from 'recoil';
import { useLocalStorage } from './useLocalStorage';

type Theme = 'light' | 'dark' | 'auto';

const themeState = atom<Theme>({
  key: 'themeState',
  default: 'dark', // Default theme
});

export function useTheme() {
  const [localTheme, setLocalTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [theme, setTheme] = useRecoilState(themeState);

  // Sync Recoil state with localStorage using useEffect
  useEffect(() => {
    if (localTheme !== theme) {
      setTheme(localTheme);
    }
  }, [localTheme, theme, setTheme]); // Add dependencies

  const setThemeAndPersist = (newTheme: Theme) => {
    setLocalTheme(newTheme);
    // No need to call setTheme here, useEffect will handle it
  };

  // Determine the actual theme considering 'auto'
  const determineActiveTheme = () => {
    if (theme === 'auto') {
      // Check system preference if theme is 'auto'
      // This requires browser API access, which might not be ideal in SSR or workers
      // For simplicity, let's default 'auto' to 'light' for now, or you can implement media query check
      // const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // return prefersDark ? 'dark' : 'light';
      return 'light'; // Default 'auto' to light for now
    }
    return theme;
  };

  const activeTheme = determineActiveTheme();
  const isDark = activeTheme === 'dark';
  const isLight = activeTheme === 'light';

  return {
    theme, // The user's selected preference ('light', 'dark', or 'auto')
    setTheme: setThemeAndPersist,
    activeTheme, // The theme actually applied ('light' or 'dark')
    isDark,
    isLight,
    // Use activeTheme for class determination
    activeBgClass: isDark ? 'bg-dark' : 'bg-light', // Assuming bg-light for light theme
    activeTextClass: isDark ? 'text-light' : 'text-dark' // Assuming text-light/dark
  };
}
