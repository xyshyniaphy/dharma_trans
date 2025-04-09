import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Topic } from '../interface/topic_interface';

export const currentTopicState = atom<Topic | null>({
  key: 'currentTopicState',
  default: null,
});

export function useCurrentTopic() {
  const [currentTopic, setCurrentTopic] = useRecoilState(currentTopicState);
  
  return {
    currentTopic,
    setCurrentTopic,
  };
}
