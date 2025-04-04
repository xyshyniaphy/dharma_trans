import { parseJsonRequest } from './parseJson';
import { getFileFromR2 } from './getFileFromR2';
import { loadDictionary , getFilteredDictionary} from './loadDic';
import { getBasePrompt, get_prompt  } from './getBasePrompt';
import {translate} from './translate'


export default {
	async fetch(request, env, ctx) {
		// Ensure dictionary is up-to-date
		await loadDictionary(env);

		const url = new URL(request.url);
		const path = url.pathname;
		if (path.includes("/access/")) {
			return await getFileFromR2(env, path);
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

				const { results: filteredDictionary } = getFilteredDictionary(text);

				const basePrompt = await getBasePrompt(env);
				//console.log	("baseprompt is " + basePrompt);
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
		if (url.pathname === '/translate') {
			return translate(request, env);
		  }

		if (path.endsWith("/reset")) {
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
