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
    // Avoid division by zero for empty strings
    return text.length > 0 ? alphabetCount / text.length > 0.5 : false;
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
        // Iterate backwards from max length to potentially prioritize longer matches slightly
        for (let len = Math.min(maxChineseWordLength, text.length - i); len >= 1; len--) {
            const potentialWord = text.substring(i, i + len);
            // Check if the potential word exists in the dictionary Map and hasn't been found yet
            if (cn2enMap.has(potentialWord) && !wordsFound.has(potentialWord)) {
                 const englishTranslation = cn2enMap.get(potentialWord);
                 // Add the formatted dictionary entry to the results array
                 results.push(`ch:${potentialWord} en:${englishTranslation}`); // Format: ch:[Chinese] en:[English]
                 // Add the found word to the Set to prevent re-adding
                 wordsFound.add(potentialWord);
                 // Optional: If longest match is strictly required at a starting position 'i',
                 // you could break here after finding the first (longest) match.
                 // break;
            }
        }
    }
    // Join the results array into a single string separated by newlines
    return results.join('\n');
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param str The input string.
 * @returns The string with regex special characters escaped.
 */
function escapeRegex(str: string): string {
    // Escape characters with special meaning in regex: . * + ? ^ $ { } ( ) | [ ] \
    // I have corrected the unterminated string literal by removing the escaping backslash before the closing single quote.
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'); // $& inserts the matched substring
}

/**
 * Filters the dictionary to find English terms (whole words/phrases) in the text
 * using case-insensitive matching and returns their Chinese translations.
 * @param text The input text (assumed to be English).
 * @param dictionary The dictionary array.
 * @returns A string containing matching dictionary entries, formatted and newline-separated.
 */
function getEn2CnFilteredDictionary(text: string, dictionary: DictEntry[]): string {
    // Create maps for efficient lookup:
    // en2cnMap: lowercase English -> Chinese translation
    // enOriginalCaseMap: lowercase English -> original English casing
    const en2cnMap = new Map<string, string>();
    const enOriginalCaseMap = new Map<string, string>();

    // Populate the maps in a single pass through the dictionary
    for (const entry of dictionary) {
        // Ensure entry.en is not null or undefined before processing
        if (entry.en) {
            const keyLower = entry.en.toLowerCase();
            // Store translation, potentially overwriting if duplicates exist (last one wins)
            en2cnMap.set(keyLower, entry.cn);
            // Store original casing
            enOriginalCaseMap.set(keyLower, entry.en);
        }
    }

    // Use a Set to store results and automatically handle duplicates
    const resultsSet = new Set<string>();

    // Iterate through the unique lowercase English keys from the dictionary
    for (const keyLower of enOriginalCaseMap.keys()) {
        // Escape the key for safe use in regex
        const escapedKey = escapeRegex(keyLower);
        // Create a regex to find the key as a whole word/phrase, case-insensitive, globally
        // \b ensures word boundaries (won't match 'cat' in 'caterpillar')
        const regex = new RegExp(`\\\\b${escapedKey}\\\\b`, 'gi');
        // Find all occurrences of the key in the input text
        while ((regex.exec(text)) !== null) {
            // Retrieve the original English casing and the Chinese translation
            // Use non-null assertion (!) as we know the key exists in both maps
            const originalEn = enOriginalCaseMap.get(keyLower)!;
            const chineseValue = en2cnMap.get(keyLower)!;
            // Add the formatted result to the Set
            resultsSet.add(`en:${originalEn} ch:${chineseValue}`); // Format: en:[English] ch:[Chinese]
        }
    }

     // Convert the Set to an array and join into a newline-separated string
    return Array.from(resultsSet).join('\n');
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
