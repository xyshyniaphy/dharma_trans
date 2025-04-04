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
    <Dropdown autoClose="outside">
      {/* Removed variant and className props for default styling */}
      <Dropdown.Toggle
        id="bd-theme" // Keep id for accessibility/linking
        aria-label={`Toggle theme (${theme})`}
      >
         {/* Placeholder/Static icon needed here */}
        <svg className="bi my-1 me-2 theme-icon-active" width="1em" height="1em">
          <use href="#placeholder-toggle-icon"></use> {/* Placeholder */}
        </svg>
        <span className="ms-2" id="bd-theme-text">
           {/* Capitalize first letter for display */}
          {(theme.charAt(0).toUpperCase() + theme.slice(1))} Theme
        </span>
      </Dropdown.Toggle>

       {/* Removed inline style prop */}
      <Dropdown.Menu align="end">
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
             {/* Placeholder/Static icon needed here */}
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