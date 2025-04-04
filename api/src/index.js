import Papa from 'papaparse';
import OpenAI from 'openai';
import { parseJsonRequest } from './parseJson';
import { getFilteredDictionary } from './filterDictionary';

// Global cache for the dictionary Map
let dictionaryMap = null;

// Global cache for the base prompt
let basePrompt = null;

// Function to load and parse the dictionary from R2
async function loadDictionary(env,reload = false) {
	if (dictionaryMap && !reload) {
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





// Function to generate translation prompt
async function getBasePrompt(env, reload = false) {
	if (basePrompt && !reload) {
		return ;
	}
	basePrompt = null;
  const key = 'base_prompt.txt';
  const r2Object = await env.MY_R2_BUCKET.get(key);
  if (!r2Object) {
    console.log('Base prompt not found');
    return ;
  }
  basePrompt = await r2Object.text();
}

function get_prompt(text, filteredDictionary) {
  return `${basePrompt}\n\n${filteredDictionary}\n\nChinese Text to Translate: ${text}`;
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path.includes("/access/")) {
			try {
				const parts = path.split("/");
				const key = parts[parts.length - 1];
				if (!key) {
					return new Response("No file key provided", { status: 400 });
				}
				const object = await env.MY_R2_BUCKET.get(key);
				if (object) {
					const content = await object.text();
					return new Response(content);
				} else {
					return new Response("File not found :" + key, { status: 404 });
				}

			}
			catch (error) {
				return new Response(`Failed to access file: ${error.message} ${path}`, { status: 500 });
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

				await getBasePrompt(env);
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

				await getBasePrompt(env);
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

		if (path.endsWith("/reset")) {
			dictionaryMap=null;
			basePrompt=null;
			await loadDictionary(env,true);
			await getBasePrompt(env,true);
			return new Response('Successfully reseted dictionary map and base prompt', { status: 200 });
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
