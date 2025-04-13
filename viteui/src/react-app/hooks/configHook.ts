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
    const apiKey = localStorage.getItem('OPENROUTER_API_KEY')??'';
  
    const newConfig: DT_CONFIG = {
      loaded: true,
      explain: explain ? JSON.parse(explain) : false,
      apiKey: apiKey,
      selectedModels: [], // Initialize selectedModels
      topicId: ''
    };
    
    setStoredConfig(JSON.stringify(newConfig));
    setConfig(newConfig);

  };

  const initConfig = () => {
    const storedConfig = window.localStorage.getItem('DT_CONFIG') || '';
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig) as DT_CONFIG;
      parsedConfig.loaded = true;
      setConfig(parsedConfig);
    } else {
      migrateConfig();
    }
  };

  const updateConfig = (newConfig: Partial<DT_CONFIG>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    setStoredConfig(JSON.stringify(updated) as string);
  };

  return {
    config,
    updateConfig,
    initConfig
  };
};
