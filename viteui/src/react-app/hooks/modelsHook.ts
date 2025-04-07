import { atom, useRecoilState } from 'recoil';
import { OpenRouterModel } from './filterModels';

const modelsState = atom<OpenRouterModel[]>({
  key: 'modelsState',
  default: [],
});

export const useModelsState = () => {
  return useRecoilState(modelsState);
};
