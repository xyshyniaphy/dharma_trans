import { useRecoilState } from 'recoil';
import { atom } from 'recoil';

export const currentTopicIdState = atom<string | null>({
  key: 'currentTopicState',
  default: null,
});

export function useCurrentTopicId() {
  const [currentTopicId, setCurrentTopicId] = useRecoilState(currentTopicIdState);
  
  return {
    currentTopicId,
    setCurrentTopicId,
  };
}
