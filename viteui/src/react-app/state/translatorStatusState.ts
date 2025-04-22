import { atom } from 'recoil';
// No import needed here as the interface is defined below

// Define the interface for the translator status
// Added interface definition locally
export interface TranslatorStatus {
    status: string; // Status message
    isProcessing: boolean; // Flag indicating if processing is ongoing
    showConfigModal: boolean; // Flag to show/hide the configuration modal
    // showLeftPanel: boolean; // Removed showLeftPanel flag
    showThinking: boolean; // Legacy or per-item thinking flag
    hideAllThinkingDiv: boolean; // New global flag to control thinking div visibility
}

// Define the state atom for translator status
export const translatorStatusState = atom<TranslatorStatus>({
  key: 'translatorStatusState', // Unique identifier for the atom
  default: {
    status: '', // Default status message
    isProcessing: false, // Default processing state
    showConfigModal: false, // Default config modal visibility
    // showLeftPanel: true, // Removed showLeftPanel default
    showThinking: false, // Default thinking visibility (likely legacy or per-item?)
    hideAllThinkingDiv: false, // Added flag to hide all thinking divs globally
  }
});
