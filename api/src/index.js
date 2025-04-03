import Papa from 'papaparse';
import OpenAI from 'openai';

// Global cache for the dictionary Map
let dictionaryMap = null;

// Global variable to track the last modified timestamp of dic.csv
let lastModifiedTimestamp = null;

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

		// Check if the dictionary file has been updated
		const currentTimestamp = r2Object.uploaded;
		if (lastModifiedTimestamp && currentTimestamp <= lastModifiedTimestamp) {
			console.log('Dictionary is already up-to-date.');
			return dictionaryMap;
		}
		lastModifiedTimestamp = currentTimestamp;

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

// Common function to validate and parse JSON input
async function parseJsonRequest(request) {
	try {
		const body = await request.json();
		const inputText = body.text;
		if (typeof inputText !== 'string' || inputText.length === 0) {
			throw new Error('Invalid input: "text" field must be a non-empty string.');
		}
		return inputText;
	} catch (error) {
		throw new Error('Invalid JSON input.');
	}
}

// Combined function to find words in the text and format the dictionary results
function getFilteredDictionary(text, dictionary) {
	const startTime = performance.now(); // Start time in milliseconds

	const wordsToLookup = new Set();
	const maxChineseWordLength = 10; // Maximum length of Chinese word to check in the dictionary
	for (let i = 0; i < text.length; i++) {
		for (let len = 1; len <= maxChineseWordLength && i + len <= text.length; len++) {
			const potentialWord = text.substring(i, i + len);
			if (dictionary.has(potentialWord)) {
				wordsToLookup.add(potentialWord);
			}
		}
	}

	const results = [];
	for (const word of wordsToLookup) {
		if (dictionary.has(word)) {
			const englishTranslation = dictionary.get(word);
			results.push(`ch:${word} en:${englishTranslation}`);
		}
	}

	const endTime = performance.now(); // End time in milliseconds
	const executionTimeMicroseconds = (endTime - startTime) * 1000; // Convert to microseconds
	return { results: results.join('\n'), executionTimeMicroseconds };
}

// Function to generate translation prompt
function get_prompt(text, filteredDictionary) {
  return `You are an expert translator fluent in Chinese and English, specializing in buddism text.
Translate the following Chinese text into formal buddism English.
Mandatory Instructions:
You will output in GitHub Flavored markdown format, with proper emphasis and formatting.
You will output translate result in English only and will output thinkin process and all other in chinese.
You MUST use the specified English translations for the corresponding Chinese terms provided below.
Integrate these terms naturally into the final English translation. Adhere strictly to this list for the specified terms.
Do not explain, But give a list of used chinese terms and coressponding english terms after the end of the translation.
Also give another list of chinese terms and coressponding english terms that you will use if I do not give you the dictionary.
When one chinese term has multiple english terms, put the second english term into translated text too in a parentheses
Specified Terms to Use:
${filteredDictionary}
Chinese Text to Translate: ${text}`;
}

export default {
	async fetch(request, env, ctx) {
		// Ensure dictionary is loaded, potentially loading it on the first request
		try {
			await loadDictionary(env);
		} catch (error) {
			return new Response(`Failed to load dictionary: ${error.message}`, { status: 500 });
		}

		if (!dictionaryMap) {
			return new Response('Dictionary not available.', { status: 500 });
		}

		const url = new URL(request.url);
		const path = url.pathname;

		if (path.includes("/access/")) {
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
		if (path.endsWith("/map_dict")) {
			if (request.method !== 'POST') {
				return new Response('Method Not Allowed. Please use POST.', { status: 405 });
			}

			let inputText;
			try {
				inputText = await parseJsonRequest(request);
			} catch (error) {
				return new Response(error.message, { status: 400 });
			}

			// try {
			// 	const wordsToLookup = findWordsToLookup(inputText, dictionaryMap);
			// 	const results = formatLookupResults(wordsToLookup, dictionaryMap);

			// 	return new Response(results, {
			// 		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
			// 	});
			// } catch (error) {
			// 	console.error('Error processing request:', error);
			// 	return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
			// }
		}

		// Handle /get_prompt path
		if (path.endsWith("/get_prompt")) {
			if (request.method !== 'POST') {
				return new Response('Method Not Allowed. Please use POST.', { status: 405 });
			}

			let inputData;
			try {
				inputData = await request.json();
				const { text } = inputData;

				if (typeof text !== 'string' || text.length === 0) {
					throw new Error('Invalid input: "text" field must be a non-empty string.');
				}

				// Ensure dictionary is up-to-date
				await loadDictionary(env);

				const { results: filteredDictionary } = getFilteredDictionary(text, dictionaryMap);

				const prompt = get_prompt(text, filteredDictionary);

				return new Response(JSON.stringify({
					prompt: prompt,
					text: text
				}), {
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				});
			} catch (error) {
				console.error('Error processing /get_prompt request:', error);
				return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
			}
		}

		// Handle /translate path
		if (path.endsWith("/translate")) {
			if (request.method !== 'POST') {
				return new Response('Method Not Allowed. Please use POST.', { status: 405 });
			}

			let inputData;
			try {
				inputData = await request.json();
				const { text, model_name, api_key } = inputData;

				if (typeof text !== 'string' || text.length === 0) {
					throw new Error('Invalid input: "text" field must be a non-empty string.');
				}
				if (typeof model_name !== 'string' || model_name.length === 0) {
					throw new Error('Invalid input: "model_name" field must be a non-empty string.');
				}
				if (typeof api_key !== 'string' || api_key.length === 0) {
					throw new Error('Invalid input: "api_key" field must be a non-empty string.');
				}

				// Ensure dictionary is up-to-date
				await loadDictionary(env);

				const { results: filteredDictionary, executionTimeMicroseconds } = getFilteredDictionary(text, dictionaryMap);

				const prompt = get_prompt(text, filteredDictionary);

				// Initialize OpenAI client
				const openai = new OpenAI({
					baseURL: 'https://openrouter.ai/api/v1',
					apiKey: api_key, // Use the provided API key
					defaultHeaders: {
						'HTTP-Referer': 'https://x.hdcx.site', // Optional. Replace with your site URL.
						'X-Title': 'hdcx', // Optional. Replace with your site name.
					},
				});

				const completion = await openai.chat.completions.create({
					model: model_name,
					messages: [{ role: 'user', content: prompt }],
				});

				const translatedText = completion.choices[0].message.content;

				return new Response(JSON.stringify({
					text: translatedText,
					model_name: model_name,
					prompt: prompt,
					dic_lookup_time: executionTimeMicroseconds, // Add dictionary lookup time
				}), {
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				});
			} catch (error) {
				console.error('Error processing /translate request:', error);
				return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
			}
		}

		if (path.endsWith("/reset_dict")) {
			if (request.method !== 'GET') {
				return new Response('Method Not Allowed. Please use GET.', { status: 405 });
			}

			dictionaryMap = null; // Reset the global dictionary map
			await loadDictionary(env);
			return new Response('Successfully reseted dictionary map', { status: 200 });
		}

		
		if (request.method !== 'POST') {
			return new Response('you url is ' + request.url + 'path is ' + path, { status: 200 });
		}

		try {
			const inputText = await parseJsonRequest(request);
			return new Response(inputText, { status: 200 });
		} catch (error) {
			return new Response(error.message, { status: 400 });
		}
	},
};
