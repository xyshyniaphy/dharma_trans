import Papa from 'papaparse';

// Global cache for the dictionary Map
let dictionaryMap = null;

// Function to load and parse the dictionary from R2
async function loadDictionary(env) {
	if (dictionaryMap) {
		return dictionaryMap;
	}

	console.log('Loading dictionary from R2...');
	try {
		const r2Object = await env.MY_R2_BUCKET.get('dic.csv');
		if (r2Object === null) {
			console.error('Dictionary file "dic.csv" not found in R2 bucket.');
			throw new Error('Dictionary file not found.');
		}

		const csvText = await r2Object.text();
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

// Basic segmentation (split by common punctuation and whitespace)
// More sophisticated NLP techniques could be used here if needed.
function segmentText(text) {
    // Replace common punctuation with spaces and split
    const segments = text.replace(/[。,、？！；：“”‘’（）《》【】]/g, ' ').split(/\s+/);
    return segments.filter(segment => segment.length > 0); // Remove empty strings
}


export default {
	async fetch(request, env, ctx) {

		{// Get dictionary for test
			const url = new URL(request.url);
			const path = url.pathname;

			if (path.startsWith("/access/")) {
			const key = path.slice("/access/".length);
			if (!key) {
				return new Response("No file key provided", { status: 400 });
			}

			const object = await env.MY_R2_BUCKET.get(key);
			if (object) {
				const content = await object.text();
				return new Response(content);
			} else {
				return new Response("File not found", { status: 404 });
			}
			}

			// Handle /map_dict path
			if (path === "/map_dict") {
				if (request.method !== 'POST') {
					return new Response('Method Not Allowed. Please use POST.', { status: 405 });
				}

				try {
					await loadDictionary(env);
				} catch (error) {
					return new Response(`Failed to load dictionary: ${error.message}`, { status: 500 });
				}

				if (!dictionaryMap) {
					return new Response('Dictionary not available.', { status: 500 });
				}

				let inputText;
				try {
					const body = await request.json();
					inputText = body.text;
					if (typeof inputText !== 'string' || inputText.length === 0) {
						return new Response('Invalid input: "text" field must be a non-empty string.', { status: 400 });
					}
				} catch (error) {
					return new Response('Invalid JSON input.', { status: 400 });
				}

				try {
					// Find potential words in the original text
					const wordsToLookup = new Set();
					for (let i = 0; i < inputText.length; i++) {
						const maxChineseWordLength = 10;
						for (let len = 1; len <= maxChineseWordLength && i + len <= inputText.length; len++) {
							const potentialWord = inputText.substring(i, i + len);
							if (dictionaryMap.has(potentialWord)) {
								wordsToLookup.add(potentialWord);
							}
						}
					}

					// Lookup words in the dictionary and format output
					const results = [];
					for (const word of wordsToLookup) {
						if (dictionaryMap.has(word)) {
							const englishTranslation = dictionaryMap.get(word);
							results.push(`cn:${word} en:${englishTranslation}`);
						}
					}

					// Return the results
					return new Response(results.join('\n'), {
						headers: { 'Content-Type': 'text/plain; charset=utf-8' },
					});
				} catch (error) {
					console.error('Error processing request:', error);
					return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
				}
			}
		}


		// Ensure dictionary is loaded, potentially loading it on the first request
		// Use ctx.waitUntil to allow dictionary loading to happen out of band
        // after the first request, but ensure it completes before subsequent requests need it.
        // For simplicity here, we await directly, which might add latency to the first request.
		try {
			await loadDictionary(env);
		} catch (error) {
			return new Response(`Failed to load dictionary: ${error.message}`, { status: 500 });
		}

		if (!dictionaryMap) {
			// This should ideally not happen if loadDictionary throws, but as a safeguard
			return new Response('Dictionary not available.', { status: 500 });
		}

		if (request.method !== 'POST') {
			return new Response('Method Not Allowed. Please use POST.', { status: 405 });
		}

		let inputText;
		try {
			const body = await request.json();
			inputText = body.text;
			// const convert = body.convert; // Removed: No longer converting based on parameter
			if (typeof inputText !== 'string' || inputText.length === 0) {
				return new Response('Invalid input: "text" field must be a non-empty string.', { status: 400 });
			}
		} catch (error) {
			return new Response('Invalid JSON input.', { status: 400 });
		}

		try {
			// 1. Use input text directly (no conversion)
			let textToProcess = inputText;

			// 2. Find potential words in the original text
            // This is a basic segmentation and substring matching approach.
			const wordsToLookup = new Set(); // Use a Set to avoid duplicate lookups
            // Iterate through the text to find substrings that match dictionary keys
            for (let i = 0; i < textToProcess.length; i++) {
                const maxChineseWordLength = 10; // Maximum length of Chinese word to check in the dictionary (in characters)
                for (let len = 1; len <= maxChineseWordLength && i + len <= textToProcess.length; len++) {
                    const potentialWord = textToProcess.substring(i, i + len);
                    if (dictionaryMap.has(potentialWord)) {
                        wordsToLookup.add(potentialWord);
                    }
                }
            }

			// 3. Lookup words in the dictionary and format output
			const results = [];
			for (const word of wordsToLookup) {
                // Check again, although Set logic should ensure it's present
				if (dictionaryMap.has(word)) {
					const englishTranslation = dictionaryMap.get(word);
					results.push(`cn:${word} en:${englishTranslation}`);
				}
			}

			// 4. Return the results
			return new Response(results.join('\n'), {
				headers: { 'Content-Type': 'text/plain; charset=utf-8' },
			});

		} catch (error) {
			console.error('Error processing request:', error);
			return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
		}
	},
};
