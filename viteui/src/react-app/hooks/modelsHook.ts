import { atom, useRecoilState } from 'recoil';
import { OpenRouterModel } from './filterModels';

const modelsStateAtom = atom<OpenRouterModel[]>({
  key: 'modelsState',
  default: [],
});

export const useModelsState = () => {
  return useRecoilState(modelsStateAtom);
};
