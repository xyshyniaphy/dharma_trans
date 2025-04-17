// Define the structure for the dictionary entries read from dic.csv
interface DictEntry {
    cn: string; // Chinese term
    en: string; // English translation
}

// Define the structure for the one-shot translation examples
interface OneShotEntry {
    cn: string; // Chinese sentence
    en: string; // English translation
}

// Define the main data structure for the JSON object
export interface TransData {
    base_prompt: string;    // Base prompt text
    simple_prompt: string;  // Simple prompt text
    detail_prompt: string;  // Detail prompt text
    dict: DictEntry[];      // Array of dictionary entries
    model_list: string[];   // Array of model names
    one_shot: OneShotEntry[]; // Array of one-shot translation examples
} 