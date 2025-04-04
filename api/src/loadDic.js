import { getFileFromR2ByKey } from './getFileFromR2';
import Papa from 'papaparse';

// Global cache for the dictionary Map
let dictionaryMap = null;

// Function to load and parse the dictionary from R2
async function loadDictionary(env,reload = false) {
	if (dictionaryMap && !reload) {
		return dictionaryMap;
	}
	dictionaryMap = null;

	console.log('Loading dictionary from R2...');
	try {
		const csvText = await getFileFromR2ByKey(env, 'dic.csv');
		const parseResult = Papa.parse(csvText, {
			skipEmptyLines: true,
		});
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
		return dictionaryMap;

	} catch (error) {
		console.error('Error loading dictionary:', error);
		dictionaryMap = null; // Reset cache on error
		throw error; // Re-throw error to be caught by the handler
	}
}
export { loadDictionary };