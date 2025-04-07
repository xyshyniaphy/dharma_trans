import { atom, useRecoilState } from 'recoil';
import { OpenRouterModel } from './filterModels';

const currentModelState = atom<OpenRouterModel | null>({
  key: 'currentModelState',
  default: null,
});

export const useCurrentModelState = () => {
  return useRecoilState(currentModelState);
};
