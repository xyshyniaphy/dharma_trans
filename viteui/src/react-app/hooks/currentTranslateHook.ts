import { atom, useRecoilState } from 'recoil';
import { Translation } from '../interface/translation_interface';

export const currentTranslate = atom<Translation | undefined>({
  key: 'currentTranslate',
  default: undefined,
});

export const useCurrentTranslate = () => {
  return useRecoilState(currentTranslate);
};
