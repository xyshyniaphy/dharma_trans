import React, { useEffect, useCallback } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useLocalStorage } from './hooks/useLocalStorage'; // Updated import path

// Define the possible theme values
type Theme = 'light' | 'dark' | 'auto';

// Helper function to get the initial theme, considering storage and OS preference
const getInitialTheme = (): Theme => {
  // Check if window is defined (SSR safety)
  if (typeof window === 'undefined') {
    return 'light'; // Default for SSR
  }
  const storedTheme = localStorage.getItem('theme');
   // Directly check stored theme string validity
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'auto') {
     // Need to explicitly return type Theme here because storedTheme is string | null
    return storedTheme as Theme;
  }

  // Check OS preference if no valid theme stored
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};


const ThemeSwitcher: React.FC = () => {
  // Use the custom hook to manage theme state persistence
  const [theme, setTheme] = useLocalStorage<Theme>('theme', getInitialTheme());

  // Memoized function to apply the theme attribute to the <html> element
  const applyTheme = useCallback((selectedTheme: Theme) => {
     // Check if window is defined (SSR safety)
    if (typeof document === 'undefined') return;

    let themeToApply: 'light' | 'dark' = 'light'; // Explicitly define as light or dark only
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
      if (theme === 'auto') {
        // Re-apply theme based on new OS preference when in 'auto' mode
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, applyTheme]); // Dependency array ensures listener logic adapts if theme or applyTheme changes

  // Function to handle theme selection from the dropdown
  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme); // Update state via the hook's setter
  };

  return (
    <Dropdown className="color-modes" autoClose="outside">
      <Dropdown.Toggle
        as="button"
        variant="link"
        id="bd-theme"
        className="px-0 text-decoration-none d-flex align-items-center"
        aria-label={`Toggle theme (${theme})`}
      >
         {/* Removed dynamic icon logic - Placeholder/Static icon needed here */}
        <svg className="bi my-1 me-2 theme-icon-active" width="1em" height="1em">
          <use href="#placeholder-toggle-icon"></use> {/* Placeholder */}
        </svg>
        <span className="ms-2" id="bd-theme-text">
           {/* Capitalize first letter for display */}
          {(theme.charAt(0).toUpperCase() + theme.slice(1))} Theme
        </span>
      </Dropdown.Toggle>

       {/* Apply the style cast directly inline */}
      <Dropdown.Menu
        align="end"
        style={{ '--bs-dropdown-min-width': '8rem' } as React.CSSProperties}
      >
        {(['light', 'dark', 'auto'] as Theme[]).map((itemTheme) => (
          <Dropdown.Item
            key={itemTheme}
            href="#"
            onClick={(e: React.MouseEvent<HTMLElement>) => { // Type the event
              e.preventDefault();
              handleThemeChange(itemTheme);
            }}
            className="d-flex align-items-center"
            active={theme === itemTheme}
          >
             {/* Removed dynamic icon logic - Placeholder/Static icon needed here */}
            <svg className="bi me-2 opacity-50 theme-icon" width="1em" height="1em">
               <use href="#placeholder-item-icon"></use> {/* Placeholder */}
            </svg>
            {/* Capitalize first letter */}
            {itemTheme.charAt(0).toUpperCase() + itemTheme.slice(1)}
            {/* Conditionally render checkmark */}
            {theme === itemTheme && (
              <svg className="bi ms-auto" width="1em" height="1em">
                <use href="#check2"></use> {/* Assuming checkmark is still desired */}
              </svg>
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ThemeSwitcher;