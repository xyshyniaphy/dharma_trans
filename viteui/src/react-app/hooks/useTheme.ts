// Removed useEffect import as it's no longer needed for syncing
// Removed atom, useRecoilState imports
// Removed useLocalStorage import
import { useDTConfig, Theme } from './configHook'; // Import useDTConfig and Theme type

// Removed themeState atom definition

export function useTheme() {
  // Use the config hook to get the current config and the update function
  const { config, updateConfig } = useDTConfig();
  const currentThemePreference = config.theme; // Get theme preference from global config

  // Function to update the theme preference in the global config
  const setThemePreference = (newTheme: Theme) => {
    try {
        updateConfig({ theme: newTheme }); // Update the theme in the global config
    } catch (error) {
        console.error("Failed to update theme preference:", error);
        // Handle error appropriately, maybe notify the user
        // throw error; // Rethrow if necessary
    }
  };

  // Determine the actual theme considering 'auto'
  const determineActiveTheme = () => {
    if (currentThemePreference === 'auto') {
      // Check system preference if theme is 'auto'
      // This requires browser API access, which might not be ideal in SSR or workers
      // For simplicity, let's default 'auto' to 'light' for now, or you can implement media query check
      // const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // return prefersDark ? 'dark' : 'light';
      try {
        // Safely check for window and matchMedia
        if (typeof window !== 'undefined' && window.matchMedia) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          return prefersDark ? 'dark' : 'light';
        }
      } catch (error) {
        console.error("Error checking system color scheme preference:", error);
        // Fallback if window or matchMedia is not available or throws error
      }
      return 'light'; // Default 'auto' to light if check fails or not possible
    }
    return currentThemePreference; // Return the user's explicit preference ('light' or 'dark')
  };

  const activeTheme = determineActiveTheme();
  const isDark = activeTheme === 'dark';
  const isLight = activeTheme === 'light';

  return {
    theme: currentThemePreference, // The user's selected preference ('light', 'dark', or 'auto') from config
    setTheme: setThemePreference, // Function to update the preference in config
    activeTheme, // The theme actually applied ('light' or 'dark')
    isDark,
    isLight,
    // Use activeTheme for class determination
    activeBgClass: isDark ? 'bg-dark' : 'bg-light', // Assuming bg-light for light theme
    activeTextClass: isDark ? 'text-light' : 'text-dark' // Assuming text-light/dark
  };
}
