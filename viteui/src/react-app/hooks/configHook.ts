import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';

export interface DT_CONFIG {
  loaded: boolean;
  explain: boolean;
  apiKey: string;
  // selectedModel: string; // Removed
  selectedModels: string[];
  topicId: string;// current seleccted topic id
}

const configAtom = atom<DT_CONFIG>({
  key: 'configState',
  default: {
    loaded: false,
    explain: false,
    apiKey: '',
    // selectedModel: 'deepseek/deepseek-chat-v3-0324:free', // Removed default
    selectedModels: [], // Keep selectedModels
    topicId: ''
  }
});

export const useDTConfig = () => {
  const [config, setConfig] = useRecoilState(configAtom);

  const setStoredConfig = (value: string) => window.localStorage.setItem('DT_CONFIG', value);

  // Migrate from old localStorage keys to new config object
  const migrateConfig = () => {
    const explain = localStorage.getItem('EXPLAIN');
    const apiKey = localStorage.getItem('OPENROUTER_API_KEY');
    // const selectedModel = localStorage.getItem('SELECTED_MODEL'); // No longer needed

    if (apiKey) {
      console.log("MIGRATING OLD CONFIG (removing selectedModel)");
      const newConfig: DT_CONFIG = {
        loaded: true,
        explain: explain ? JSON.parse(explain) : false,
        apiKey: apiKey,
        // selectedModel: selectedModel || 'deepseek/deepseek-chat-v3-0324:free', // Removed
        selectedModels: [], // Initialize selectedModels
        topicId: ''
      };
      
      setStoredConfig(JSON.stringify(newConfig));
      
      // Clean up old keys
      localStorage.removeItem('EXPLAIN');
      localStorage.removeItem('OPENROUTER_API_KEY');
      localStorage.removeItem('SELECTED_MODEL');
    }else {
      // indicated loaded, so that show config ui
      updateConfig({loaded: true});
    }

  };

  useEffect(() => {
    // already loaded
    // console.log('Config :', config);
    if(config && config.loaded)return;
    const storedConfig = window.localStorage.getItem('DT_CONFIG') || '';
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig) as DT_CONFIG;
      parsedConfig.loaded = true;
      setConfig(parsedConfig);
    } else {
      migrateConfig();
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<DT_CONFIG>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    setStoredConfig(JSON.stringify(updated) as string);
  };

  return {
    config,
    updateConfig
  };
};
