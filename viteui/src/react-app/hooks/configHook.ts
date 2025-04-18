import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { TransData } from '../interface/trans_data';
import { fetchTransData } from '../utils/translate_tool';

// Define Theme type here or import from a shared types file if available
export type Theme = 'light' | 'dark' | 'auto';

export interface DT_CONFIG {
  explain: boolean;
  apiKey: string;
  // selectedModel: string; // Removed
  selectedModels: string[];
  topicId: string;// current seleccted topic id
  theme: Theme; // Added theme property
  showLeftPanel: boolean; // Added showLeftPanel property
}

const configAtom = atom<DT_CONFIG>({
  key: 'configState',
  default: {
    explain: false,
    apiKey: '',
    // selectedModel: 'deepseek/deepseek-chat-v3-0324:free', // Removed default
    selectedModels: [], // Keep selectedModels
    topicId: '',
    theme: 'dark', // Default theme added
    showLeftPanel: true // Default showLeftPanel added
  }
});

let configLoaded = false;
export const useDTConfig = () => {
  const [config, setConfig] = useRecoilState(configAtom);

  const setStoredConfig = (value: string) => {
    try {
      console.log('Setting config in localStorage:', value);
      window.localStorage.setItem('DT_CONFIG', value);
    } catch (error) {
      console.error("Failed to set config in localStorage:", error);
      // Optionally rethrow or handle the error appropriately
      // throw error; // Rethrow if the calling context needs to know
    }
  };

  useEffect(() => {
    //console.log('Config changed:', config);
  }, [config]);

  // Migrate from old localStorage keys to new config object
  const migrateConfig = () => {
    console.log('Migrating config...');

    let explainValue = false;
    let apiKeyValue = '';
    try {
      const explain = localStorage.getItem('EXPLAIN');
      if (explain) {
        explainValue = JSON.parse(explain);
      }
      apiKeyValue = localStorage.getItem('OPENROUTER_API_KEY') ?? '';
    } catch (error) {
        console.error("Error reading old config keys during migration:", error);
        // Decide on fallback behavior, e.g., use defaults
    }


    const newConfig: DT_CONFIG = {
      explain: explainValue,
      apiKey: apiKeyValue,
      selectedModels: [], // Initialize selectedModels
      topicId: '',
      theme: 'dark', // Initialize theme during migration
      showLeftPanel: true // Initialize showLeftPanel during migration
    };

    setStoredConfig(JSON.stringify(newConfig));
    setConfig(newConfig);

  };

  const initConfig = () => {
    //use global cache to prevent multiple init
    //global cache, do not change this logic
    if(configLoaded) return;

    try {
      const storedConfig = window.localStorage.getItem('DT_CONFIG');
      if (storedConfig) {
        console.log('Config String found in localStorage:', storedConfig);

        const parsedConfig = JSON.parse(storedConfig) as Partial<DT_CONFIG>; // Parse as partial first
        // Ensure all properties exist, providing defaults if necessary
        const fullConfig: DT_CONFIG = {
          explain: parsedConfig.explain ?? false,
          apiKey: parsedConfig.apiKey ?? '',
          selectedModels: parsedConfig.selectedModels ?? [],
          topicId: parsedConfig.topicId ?? '',
          theme: parsedConfig.theme ?? 'dark', // Default theme if missing
          showLeftPanel: parsedConfig.showLeftPanel ?? true // Default showLeftPanel if missing
        };
        // Check integrity of selectedModels against TransData.model_list
        fetchTransData().then((transData: TransData) => {
          const validModels = fullConfig.selectedModels.filter(model => transData.model_list.includes(model));
          if (validModels.length !== fullConfig.selectedModels.length) {
            console.log('Removed invalid models from selectedModels:', fullConfig.selectedModels.filter(model => !transData.model_list.includes(model)));
            fullConfig.selectedModels = validModels;
            setStoredConfig(JSON.stringify(fullConfig));
          }
          console.log('Config loaded from localStorage:', fullConfig);
          setConfig(fullConfig);
        }).catch((error: unknown) => {
          console.error('Failed to fetch TransData for model list check:', error);
          console.log('Config loaded from localStorage without model check:', fullConfig);
          setConfig(fullConfig);
        });
      } else {
        migrateConfig();
      }
    } catch (error) {
      console.error("Failed to initialize config from localStorage:", error);
      // Fallback to migration or default state in case of parsing error
      migrateConfig(); // Or set a default config directly
      // throw error; // Rethrow if critical
    }
    finally{
      //global cache, do not change this logic
      configLoaded = true;
    }
  };

  // Updated function to use the callback form of setConfig
  const updateConfig = (newConfig: Partial<DT_CONFIG>) => {
    console.log('Updating config with:', newConfig);
    setConfig((currentConfig) => { // Use callback form to get the latest state
      const updated = { ...currentConfig, ...newConfig };
      console.log('New config state:', updated);
      // Store the updated config to localStorage
      setStoredConfig(JSON.stringify(updated));
      // Return the new state for Recoil
      return updated;
    });
  };


  return {
    loaded:configLoaded,
    config,
    updateConfig,
    initConfig
  };
};
