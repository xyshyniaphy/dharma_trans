import React, { useEffect, useCallback } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useTheme } from './hooks/useTheme'; // Updated import

// Define the possible theme values
type Theme = 'light' | 'dark' | 'auto';

const ThemeSwitcher: React.FC = () => {
  // Use the new useTheme hook
  const { theme, setTheme } = useTheme();

  // Memoized function to apply the theme attribute to the <html> element
  const applyTheme = useCallback((selectedTheme: Theme) => {
    if (selectedTheme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-bs-theme', selectedTheme);
    }
  }, []);

  // Effect to apply the theme whenever the theme state changes
  useEffect(() => {
    applyTheme(theme);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };
    
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, applyTheme]);

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