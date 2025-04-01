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

// Common function to find potential words in the text using the dictionary
function findWordsToLookup(text, dictionary) {
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
	return wordsToLookup;
}

// Common function to format dictionary lookup results
function formatLookupResults(wordsToLookup, dictionary) {
	const results = [];
	for (const word of wordsToLookup) {
		if (dictionary.has(word)) {
			const englishTranslation = dictionary.get(word);
			results.push(`cn:${word} en:${englishTranslation}`);
		}
	}
	return results.join('\n');
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

			let inputText;
			try {
				inputText = await parseJsonRequest(request);
			} catch (error) {
				return new Response(error.message, { status: 400 });
			}

			try {
				const wordsToLookup = findWordsToLookup(inputText, dictionaryMap);
				const results = formatLookupResults(wordsToLookup, dictionaryMap);

				return new Response(results, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			} catch (error) {
				console.error('Error processing request:', error);
				return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
			}
		}

		// Handle /translate path
		if (path === "/translate") {
			if (request.method !== 'POST') {
				return new Response('Method Not Allowed. Please use POST.', { status: 405 });
			}

			let inputData;
			try {
				inputData = await request.json();
				const { text, model_name } = inputData;

				if (typeof text !== 'string' || text.length === 0) {
					throw new Error('Invalid input: "text" field must be a non-empty string.');
				}
				if (typeof model_name !== 'string' || model_name.length === 0) {
					throw new Error('Invalid input: "model_name" field must be a non-empty string.');
				}

				const dictionaryEntries = Array.from(dictionaryMap.entries())
					.map(([ch, en]) => `ch:${ch} en:${en}`)
					.join('\n');

				const prompt = `You are an expert translator fluent in Chinese and English, specializing in buddism text.
Translate the following Chinese text into English.
Mandatory Instructions:
You MUST use the specified English translations for the corresponding Chinese terms provided below.
Integrate these terms naturally into the final English translation. Adhere strictly to this list for the specified terms.
Specified Terms to Use:
${dictionaryEntries}
Chinese Text to Translate: ${text}`;

				const response = await fetch('https://openrouter.ai/v1/chat/completions', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
					},
					body: JSON.stringify({
						model: model_name,
						messages: [{ role: 'system', content: prompt }],
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error('OpenRouter API error:', errorText);
					return new Response(`Failed to translate text: ${response.statusText}`, { status: response.status });
				}

				const result = await response.json();
				const translatedText = result.choices[0].message.content;

				return new Response(JSON.stringify({
					text: translatedText,
					model_name: model_name,
					prompt: prompt,
				}), {
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				});
			} catch (error) {
				console.error('Error processing /translate request:', error);
				return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
			}
		}

		if (request.method !== 'POST') {
			return new Response('Method Not Allowed. Please use POST.', { status: 405 });
		}

		let inputText;
		try {
			inputText = await parseJsonRequest(request);
		} catch (error) {
			return new Response(error.message, { status: 400 });
		}

		try {
			const wordsToLookup = findWordsToLookup(inputText, dictionaryMap);
			const results = formatLookupResults(wordsToLookup, dictionaryMap);

			return new Response(results, {
				headers: { 'Content-Type': 'text/plain; charset=utf-8' },
			});
		} catch (error) {
			console.error('Error processing request:', error);
			return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
		}
	},
};
