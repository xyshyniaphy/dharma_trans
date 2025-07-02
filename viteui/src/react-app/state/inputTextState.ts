import { atom } from 'recoil';

// I am creating a new Recoil atom to manage the global state of the input text.
// This will allow multiple components to share and update the input field's content.
export const inputTextState = atom<string>({
  key: 'inputTextState', // unique ID (with respect to other atoms/selectors)
  default: '', // default value (aka initial value)
});
