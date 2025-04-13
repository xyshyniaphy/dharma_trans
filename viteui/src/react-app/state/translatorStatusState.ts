import { atom } from 'recoil';
import { TranslatorStatus } from '../hooks/useTranslatorStatus';

export const translatorStatusState = atom<TranslatorStatus>({
  key: 'translatorStatusState',
  default: {
    status: '',
    isProcessing: false,
    showConfigModal: false,
    // showLeftPanel: true, // Removed showLeftPanel default
    showThinking: false
  }
});
