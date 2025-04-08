import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Translation } from '../translation_interface';

const transHistoryAtom = atom<Array<Translation>>({
  key: 'transHistoryState',
  default: []
});

export const useTransHistory = () => {
  const [transHistory, setTransHistory] = useRecoilState(transHistoryAtom);

  const setStoredTransHistory = (value: Array<Translation>) => {
    window.localStorage.setItem('TRANS_HISTORY', JSON.stringify(value));
  };

  useEffect(() => {
    const storedHistory = window.localStorage.getItem('TRANS_HISTORY');
    if (storedHistory) {
      setTransHistory(JSON.parse(storedHistory));
    }
  }, []);

  const updateTransHistory = (newHistory: Array<Translation>) => {
    setTransHistory(newHistory);
    setStoredTransHistory(newHistory);
  };

  return [transHistory, updateTransHistory] as const;
};
