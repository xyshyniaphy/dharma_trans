import { useRecoilState } from 'recoil';
import { inputTextState } from '../state/inputTextState';

// I am creating a custom hook to provide a simple interface for components
// to interact with the shared inputTextState.
export const useInputText = () => {
  const [inputText, setInputText] = useRecoilState(inputTextState);
  return { inputText, setInputText };
};
