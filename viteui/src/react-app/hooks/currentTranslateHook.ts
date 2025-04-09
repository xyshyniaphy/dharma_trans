import { atom, useRecoilState } from 'recoil';
import { Translation } from '../interface/translation_interface';

export const translateState = atom<Translation | undefined>({
  key: 'translateState',
  default: undefined,
});

export const useCurrentTranslate = () => {
  return useRecoilState(translateState);
};
