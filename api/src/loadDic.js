import { getTextFromR2ByKey } from './getFileFromR2';
import Papa from 'papaparse';

// Global cache for the dictionary Maps
let cn2enDictionaryMap = null; // Chinese to English Map
let en2cnDictionaryMap = null; // English to Chinese Map
let dictCSV = null;

// Helper function to check if text is predominantly English
function isEnglish(text) {
    if (!text) return false;
    let alphabetCount = 0;
    const englishChars = /^[a-zA-Z\s.,!?'"-]+$/; // Basic check for English characters + common punctuation/space
    for (let i = 0; i < text.length; i++) {
        // Consider ASCII letters as English indicators
        const charCode = text.charCodeAt(i);
        if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
            alphabetCount++;
        }
    }
    // If more than 50% are alphabet characters, assume English
    return alphabetCount / text.length > 0.5;
}


// Function to find Chinese words in the text and return English translations
function getCn2EnFilteredDictionary(text) {
    if (cn2enDictionaryMap == null) {
        loadDictionaryFromCsv(); // Ensure dictionary is loaded
    }
    if (!cn2enDictionaryMap) {
        console.error("Chinese to English dictionary not loaded.");
        return { results: "Error: Dictionary not loaded.", executionTimeMicroseconds: 0 };
    }

    const startTime = performance.now(); // Start time in milliseconds
    const results = [];
    const wordsFound = new Set(); // Avoid duplicate lookups for the same Chinese word

    // Iterate through the text to find potential Chinese words present in the dictionary
    // This approach is better for Chinese where words are not space-separated
    const maxChineseWordLength = 10; // Maximum length of Chinese word to check
    for (let i = 0; i < text.length; i++) {
        for (let len = 1; len <= maxChineseWordLength && i + len <= text.length; len++) {
            const potentialWord = text.substring(i, i + len);
            if (cn2enDictionaryMap.has(potentialWord) && !wordsFound.has(potentialWord)) {
                 const englishTranslation = cn2enDictionaryMap.get(potentialWord);
                 // Add comment indicating the source of the translation
                 results.push(`ch:${potentialWord} en:${englishTranslation}`); // Format: ch:[Chinese] en:[English]
                 wordsFound.add(potentialWord); // Mark as found
            }
        }
    }

    const endTime = performance.now(); // End time in milliseconds
    const executionTimeMicroseconds = (endTime - startTime) * 1000; // Convert to microseconds
    // Add comment explaining the return format
    return { results: results.join('\n'), executionTimeMicroseconds }; // Return results joined by newline and execution time
}

// Function to find English terms in the text and return Chinese translations
function getEn2CnFilteredDictionary(text) {
    if (en2cnDictionaryMap == null) {
        loadDictionaryFromCsv(); // Ensure dictionary is loaded
    }
     if (!en2cnDictionaryMap) {
        console.error("English to Chinese dictionary not loaded.");
        return { results: "Error: Dictionary not loaded.", executionTimeMicroseconds: 0 };
    }

    const startTime = performance.now(); // Start time in milliseconds
    const results = [];
    const textLower = text.toLowerCase(); // Convert input text to lowercase for case-insensitive matching

    // Iterate through the English keys in the dictionary
    // This is more suitable for English where terms can be multi-word phrases
    for (const [englishKey, chineseValue] of en2cnDictionaryMap.entries()) {
        const keyLower = englishKey.toLowerCase();
        // Check if the input text contains the dictionary key (case-insensitive)
        if (textLower.includes(keyLower)) {
             // Add comment indicating the source of the translation
            results.push(`en:${englishKey} ch:${chineseValue}`); // Format: en:[English] ch:[Chinese]
        }
    }

    const endTime = performance.now(); // End time in milliseconds
    const executionTimeMicroseconds = (endTime - startTime) * 1000; // Convert to microseconds
    // Add comment explaining the return format
    return { results: results.join('\n'), executionTimeMicroseconds }; // Return results joined by newline and execution time
}


// Combined function to find words/terms based on detected language
function getFilteredDictionary(text) {
    // Ensure dictionaries are loaded if they haven't been already
    if (cn2enDictionaryMap == null || en2cnDictionaryMap == null) {
        loadDictionaryFromCsv();
    }

    // Add comment explaining language detection logic
    // Detect language: if >50% alphabetic chars, assume English, otherwise Chinese.
    if (isEnglish(text)) {
        // Add comment indicating English path
        // Input detected as English, looking up Chinese translations.
        return getEn2CnFilteredDictionary(text);
    } else {
        // Add comment indicating Chinese path
        // Input detected as Chinese, looking up English translations.
        return getCn2EnFilteredDictionary(text);
    }
}


function loadDictionaryFromCsv(){
    // Add comment explaining the purpose of this function
    // Parses the loaded CSV string and populates both dictionaries.

    // Check if CSV data is available
    if (!dictCSV) {
        console.error("Dictionary CSV data is not loaded.");
        // Reset maps to ensure consistent state
        cn2enDictionaryMap = null;
        en2cnDictionaryMap = null;
        return; // Exit if no CSV data
    }

    //console.log("before parse csv" + dictCSV);
    const parseResult = Papa.parse(dictCSV, {
        skipEmptyLines: true,
    });

    //console.log("after parse csv");
    if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        // Reset maps on parsing error
        cn2enDictionaryMap = null;
        en2cnDictionaryMap = null;
        throw new Error('Failed to parse dictionary CSV.');
    }

    // Create Maps for fast lookups
    const tempCn2EnMap = new Map(); // Temporary map for Chinese to English
    const tempEn2CnMap = new Map(); // Temporary map for English to Chinese
    for (const row of parseResult.data) {
        if (row.length >= 2 && row[0] && row[1]) {
            const chineseWord = row[0].trim();
            const englishWord = row[1].trim();

            // Populate Chinese to English map
            // Add comment: Storing Chinese as key, English as value
            tempCn2EnMap.set(chineseWord, englishWord);

            // Populate English to Chinese map
            // Add comment: Storing English as key, Chinese as value. Handles potential duplicate English keys by overwriting (last entry wins).
            // Consider if multiple Chinese words map to the same English phrase - this stores the last one encountered.
            tempEn2CnMap.set(englishWord, chineseWord);
        } else {
            console.warn('Skipping invalid row in CSV:', row);
        }
    }
    // Assign the temporary maps to the global variables
    cn2enDictionaryMap = tempCn2EnMap;
    en2cnDictionaryMap = tempEn2CnMap;
    // Add comment: Log successful loading and counts for both dictionaries.
    console.log(`Chinese->English dictionary loaded successfully with ${cn2enDictionaryMap.size} entries.`);
    console.log(`English->Chinese dictionary loaded successfully with ${en2cnDictionaryMap.size} entries.`);
}

// Function to load the dictionary CSV from R2
async function loadDictionary(env, reload = false) {
    // Add comment: Check if dictionaries are already loaded and reload is not forced.
	if (cn2enDictionaryMap && en2cnDictionaryMap && !reload) {
        // Add comment: Dictionaries already loaded, skipping reload.
		console.log('Dictionaries already loaded.');
		return; // No need to reload
	}
    // Add comment: Resetting existing dictionaries before loading/reloading.
	cn2enDictionaryMap = null;
    en2cnDictionaryMap = null;
    dictCSV = null;

	console.log('Loading dictionary CSV from R2...');
	try {
        // Add comment: Fetching dictionary CSV content from R2 storage.
		dictCSV = await getTextFromR2ByKey(env, 'dic.csv');
        // Add comment: CSV content loaded, proceed to parse.
        loadDictionaryFromCsv(); // Parse the CSV immediately after loading - Moved this call to be on-demand inside lookup functions
	} catch (error) {
		console.error('Error loading dictionary CSV from R2:', error);
		dictCSV = null;
        // Add comment: Reset maps on R2 load error.
		cn2enDictionaryMap = null;
        en2cnDictionaryMap = null;
		throw error; // Re-throw error to be caught by the caller
	}
}
// Add comment: Exporting the main lookup function and the loader.
// The individual lookup functions (getCn2EnFilteredDictionary, getEn2CnFilteredDictionary) are internal helpers.
export { loadDictionary, getFilteredDictionary };
