import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';

export interface DT_CONFIG {
  explain: boolean;
  apiKey: string;
  selectedModel: string;
}

const configAtom = atom<DT_CONFIG>({
  key: 'configState',
  default: {
    explain: false,
    apiKey: '',
    selectedModel: 'deepseek/deepseek-chat-v3-0324:free'
  }
});

export const useDTConfig = () => {
  const [config, setConfig] = useRecoilState(configAtom);

  const setStoredConfig = (value: string) => window.localStorage.setItem('DT_CONFIG', value);

  // Migrate from old localStorage keys to new config object
  const migrateConfig = () => {
    const explain = localStorage.getItem('EXPLAIN');
    const apiKey = localStorage.getItem('OPENROUTER_API_KEY');
    const selectedModel = localStorage.getItem('SELECTED_MODEL');

    if (apiKey) {
      console.log("MIGRAGE OLD CONFIG");
      const newConfig: DT_CONFIG = {
        explain: explain ? JSON.parse(explain) : false,
        apiKey: apiKey,
        selectedModel: selectedModel || 'deepseek/deepseek-chat-v3-0324:free'
      };
      
      setStoredConfig(JSON.stringify(newConfig));
      
      // Clean up old keys
      localStorage.removeItem('EXPLAIN');
      localStorage.removeItem('OPENROUTER_API_KEY');
      localStorage.removeItem('SELECTED_MODEL');
    }
  };

  useEffect(() => {
    // already loaded
    console.log('Config loaded:', config);
    if(config && config.apiKey)return;
    const storedConfig = window.localStorage.getItem('DT_CONFIG') || '';
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig) as DT_CONFIG);
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
