import { atom, useRecoilState } from 'recoil';
import { OpenRouterModel } from './filterModels';

// Change the type to OpenRouterModel[] and default to an empty array
const currentModelAtom = atom<OpenRouterModel[]>({
  key: 'currentModelState',
  default: [],
});

export const useCurrentModel = () => {
  // The hook remains the same, but now manages an array
  return useRecoilState(currentModelAtom);
};
