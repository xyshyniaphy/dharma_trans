import { atom, useRecoilState } from 'recoil';
import { OpenRouterModel } from './filterModels';

const currentModelAtom = atom<OpenRouterModel | null>({
  key: 'currentModelState',
  default: null,
});

export const useCurrentModel = () => {
  return useRecoilState(currentModelAtom);
};
