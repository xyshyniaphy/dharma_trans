import { useRecoilState } from 'recoil';
import { translatorStatusState } from '../state/translatorStatusState';

export interface TranslatorStatus {
  status: string;
  isProcessing: boolean;
  showConfigModal: boolean;
  // showLeftPanel: boolean; // Removed showLeftPanel
  showThinking: boolean;
}

export const useTranslatorStatus = (): [TranslatorStatus, (status: Partial<TranslatorStatus>) => void] => {
  const [status, setStatus] = useRecoilState(translatorStatusState);

  const updateStatus = (newStatus: Partial<TranslatorStatus>) => {
    setStatus(prev => ({
      ...prev,
      ...newStatus
    }));
  };

  return [status, updateStatus];
};
