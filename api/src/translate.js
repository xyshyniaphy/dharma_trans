import OpenAI from 'openai';
import { getFilteredDictionary} from './loadDic';
import { getBasePrompt, get_prompt  } from './getBasePrompt';

async function translate(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed. Please use POST.', { status: 405 });
    }
  
    try {
      const inputData = await request.json();
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
  
      const { results: filteredDictionary, executionTimeMicroseconds } = getFilteredDictionary(text);
  
      await getBasePrompt(env);
      const prompt = get_prompt(text, filteredDictionary);
  
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
        dic_lookup_time: executionTimeMicroseconds,
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch (error) {
      console.error('Error processing /translate request:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }

  export { translate };