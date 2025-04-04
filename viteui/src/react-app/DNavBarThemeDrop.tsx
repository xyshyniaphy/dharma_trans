import React, { useEffect, useCallback } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useLocalStorage } from './hooks/useLocalStorage'; // Assuming hook is here

// Define the possible theme values
type Theme = 'light' | 'dark' | 'auto';

// No longer need getInitialTheme if we default directly in the hook call

const ThemeSwitcher: React.FC = () => {
  // Use the custom hook - Set 'dark' as the default value if nothing is in localStorage
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');

  // Memoized function to apply the theme attribute to the <html> element
  const applyTheme = useCallback((selectedTheme: Theme) => {
     // Check if window is defined (SSR safety)
    if (typeof document === 'undefined') return;

    let themeToApply: 'light' | 'dark' = 'light'; // Base theme to apply is light/dark
    if (selectedTheme === 'auto') {
      themeToApply = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      themeToApply = selectedTheme; // 'light' or 'dark'
    }
    document.documentElement.setAttribute('data-bs-theme', themeToApply);
  }, []);

  // Effect to apply the theme whenever the theme state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Effect for handling OS theme changes (only when 'auto' is selected)
  useEffect(() => {
     // Check if window is defined (SSR safety)
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMediaChange = () => {
      // Only re-apply if the user's selected theme ('auto') matches the current state
      // We read the latest theme state here directly, not relying on the initial state
      const currentStoredTheme = localStorage.getItem('theme') || 'dark'; // Or read from state if preferred
      if (currentStoredTheme === 'auto') {
        // Re-apply theme based on new OS preference when in 'auto' mode
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [applyTheme]); // Dependency on applyTheme ensures it uses the latest version


  // Function to handle theme selection from the dropdown
  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme); // Update state via the hook's setter
  };

  return (
    // Removed outer className="color-modes" if it was custom styling
    <Dropdown navbar className="g-3">
      {/* Removed variant and className props for default styling */}
      <Dropdown.Toggle
        id="bd-theme" // Keep id for accessibility/linking
        aria-label={`切换主题 (${theme})`}
      >
        <span className="ms-2" id="bd-theme-text">  
        主题
        </span>
      </Dropdown.Toggle>

       {/* Removed inline style prop */}
      <Dropdown.Menu align="end" className="g-3">
        {(['light', 'dark', 'auto'] as Theme[]).map((itemTheme) => (
          <Dropdown.Item
            key={itemTheme}
            href="#"
            onClick={(e: React.MouseEvent<HTMLElement>) => { // Type the event
              e.preventDefault();
              handleThemeChange(itemTheme);
            }}
            className="d-flex align-items-center" // Keep flex for icon alignment if needed
            active={theme === itemTheme}
          >
            {itemTheme === 'light' ? '浅色' : itemTheme === 'dark' ? '深色' : '自动'}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ThemeSwitcher;