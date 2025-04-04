import { getTextFromR2ByKey } from './getFileFromR2';
import Papa from 'papaparse';

// Global cache for the dictionary Map
let dictionaryMap = null;
let dictCSV = null;

// Combined function to find words in the text and format the dictionary results
function getFilteredDictionary(text) {

    if (dictionaryMap == null){
        loadDictionaryFromCsv();
    }

	const startTime = performance.now(); // Start time in milliseconds

	const wordsToLookup = new Set();
	const maxChineseWordLength = 10; // Maximum length of Chinese word to check in the dictionary
	for (let i = 0; i < text.length; i++) {
		for (let len = 1; len <= maxChineseWordLength && i + len <= text.length; len++) {
			const potentialWord = text.substring(i, i + len);
			if (dictionaryMap.has(potentialWord)) {
				wordsToLookup.add(potentialWord);
			}
		}
	}

	const results = [];
	for (const word of wordsToLookup) {
		if (dictionaryMap.has(word)) {
			const englishTranslation = dictionaryMap.get(word);
			results.push(`ch:${word} en:${englishTranslation}`);
		}
	}

	const endTime = performance.now(); // End time in milliseconds
	const executionTimeMicroseconds = (endTime - startTime) * 1000; // Convert to microseconds
	return { results: results.join('\n'), executionTimeMicroseconds };
}

function loadDictionaryFromCsv(){

    //console.log("before parse csv" + dictCSV);
    const parseResult = Papa.parse(dictCSV, {
        skipEmptyLines: true,
    });
    
    //console.log("after parse csv");
    if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        throw new Error('Failed to parse dictionary CSV.');
    }

    // Create a Map for fast lookups: Key = Chinese (Original), Value = English
    const tempMap = new Map();
    for (const row of parseResult.data) {
        if (row.length >= 2 && row[0] && row[1]) {
            // Assuming column 1 is Chinese, column 2 is English
            // Use the original Chinese word as the key
            const originalKey = row[0].trim();
            tempMap.set(originalKey, row[1].trim());
        } else {
            console.warn('Skipping invalid row in CSV:', row);
        }
    }
    dictionaryMap = tempMap;
    console.log(`Dictionary loaded successfully with ${dictionaryMap.size} entries.`);
}

// Function to load and parse the dictionary from R2
async function loadDictionary(env,reload = false) {
	if (dictionaryMap && !reload) {
		return dictionaryMap;
	}
	dictionaryMap = null;
    dictCSV = null;

	console.log('Loading dictionary from R2...');
	try {
		dictCSV = await getTextFromR2ByKey(env, 'dic.csv');
	} catch (error) {
		console.error('Error loading dictionary:', error);
		dictCSV = null;
		dictionaryMap = null; // Reset cache on error
		throw error; // Re-throw error to be caught by the handler
	}
}
export { loadDictionary , getFilteredDictionary};