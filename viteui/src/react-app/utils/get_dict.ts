import { DictEntry } from "../interface/trans_data";

/**
 * Checks if the text is predominantly English (more than 50% alphabet characters).
 * @param text The input text.
 * @returns True if predominantly English, false otherwise.
 */
function isEnglish(text: string): boolean {
    // Return false if the text is null, undefined, or empty
    if (!text) return false;
    let alphabetCount = 0;
    // Iterate through each character in the text
    for (let i = 0; i < text.length; i++) {
        // Get the character code of the current character
        const charCode = text.charCodeAt(i);
        // Check if the character code corresponds to an uppercase or lowercase English letter
        if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
            // Increment the count if it's an English letter
            alphabetCount++;
        }
    }
    // Calculate the proportion of English alphabet characters
    // Return true if the proportion is greater than 0.5 (50%)
    return alphabetCount / text.length > 0.5;
}


/**
 * Filters the dictionary to find Chinese words in the text and returns their English translations.
 * @param text The input text (assumed to be Chinese).
 * @param dictionary The dictionary array.
 * @returns A string containing matching dictionary entries, formatted and newline-separated.
 */
function getCn2EnFilteredDictionary(text: string, dictionary: DictEntry[]): string {
    // Create a Map from the dictionary for efficient lookup (Chinese -> English)
    const cn2enMap = new Map(dictionary.map(entry => [entry.cn, entry.en]));
    const results: string[] = [];
    // Use a Set to keep track of words already found to avoid duplicates
    const wordsFound = new Set<string>();
    // Define a reasonable maximum length for Chinese words to check
    const maxChineseWordLength = 10;

    // Iterate through the input text
    for (let i = 0; i < text.length; i++) {
        // Check substrings starting from the current position up to the max word length
        for (let len = 1; len <= maxChineseWordLength && i + len <= text.length; len++) {
            const potentialWord = text.substring(i, i + len);
            // Check if the potential word exists in the dictionary Map and hasn't been found yet
            if (cn2enMap.has(potentialWord) && !wordsFound.has(potentialWord)) {
                 const englishTranslation = cn2enMap.get(potentialWord);
                 // Add the formatted dictionary entry to the results array
                 results.push(`ch:${potentialWord} en:${englishTranslation}`); // Format: ch:[Chinese] en:[English]
                 // Add the found word to the Set to prevent re-adding
                 wordsFound.add(potentialWord);
            }
        }
    }
    // Join the results array into a single string separated by newlines
    return results.join('\n');
}

/**
 * Filters the dictionary to find English terms in the text and returns their Chinese translations.
 * @param text The input text (assumed to be English).
 * @param dictionary The dictionary array.
 * @returns A string containing matching dictionary entries, formatted and newline-separated.
 */
function getEn2CnFilteredDictionary(text: string, dictionary: DictEntry[]): string {
    // Create a Map from the dictionary for efficient lookup (English -> Chinese)
    // Note: If multiple Chinese words map to the same English word, the last one in the array wins.
    const en2cnMap = new Map(dictionary.map(entry => [entry.en.toLowerCase(), entry.cn]));
    const results: string[] = [];
    // Convert the input text to lowercase for case-insensitive matching
    const textLower = text.toLowerCase();

    // Iterate through the original dictionary entries to preserve the original English casing in the output
    for (const entry of dictionary) {
        const englishKey = entry.en;
        const keyLower = englishKey.toLowerCase();
        // Check if the lowercase input text includes the lowercase English key and the key exists in our map
        if (en2cnMap.has(keyLower) && textLower.includes(keyLower)) {
            const chineseValue = en2cnMap.get(keyLower);
            // Add the formatted dictionary entry to the results array
            results.push(`en:${englishKey} ch:${chineseValue}`); // Format: en:[English] ch:[Chinese]
            // Remove the key from the map after finding it to avoid duplicates if the same English term appears multiple times
            // or maps to multiple Chinese terms (though the map creation handles the latter)
            en2cnMap.delete(keyLower);
        }
    }
     // Join the results array into a single string separated by newlines
    return results.join('\n');
}


/**
 * Detects the language of the text and returns the filtered dictionary entries accordingly.
 * @param text The input text.
 * @param dictionary The dictionary array (DictEntry[]).
 * @returns A string containing formatted dictionary entries relevant to the input text.
 */
export function getFilteredDictionaryEntries(text: string, dictionary: DictEntry[]): string {
    // Check if the input text is predominantly English
    if (isEnglish(text)) {
        // If English, get English-to-Chinese translations
        return getEn2CnFilteredDictionary(text, dictionary);
    } else {
        // If Chinese (or other), get Chinese-to-English translations
        return getCn2EnFilteredDictionary(text, dictionary);
    }
} 