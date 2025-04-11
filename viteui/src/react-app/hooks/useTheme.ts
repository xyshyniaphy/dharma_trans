import { atom, useRecoilState } from 'recoil';
import { useLocalStorage } from '../utils/useLocalStorage';

type Theme = 'light' | 'dark' | 'auto';

const themeState = atom<Theme>({
  key: 'themeState',
  default: 'dark',
});

export function useTheme() {
  const [localTheme, setLocalTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [theme, setTheme] = useRecoilState(themeState);
  
  // Sync Recoil state with localStorage
  if (localTheme !== theme) {
    setTheme(localTheme);
  }
  
  const setThemeAndPersist = (newTheme: Theme) => {
    setLocalTheme(newTheme);
    setTheme(newTheme);
  };
  
  return {
    theme,
    setTheme: setThemeAndPersist,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    activeBgClass: theme === 'dark' ? 'bg-light' : 'bg-dark',
    activeTextClass: theme === 'dark' ? 'text-dark' : 'text-light'
  };
}
