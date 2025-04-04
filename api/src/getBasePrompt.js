import { getFileFromR2ByKey } from './getFileFromR2';
// Global cache for the base prompt
let basePrompt = null;

// Function to generate translation prompt
async function getBasePrompt(env, reload = false) {
    if (basePrompt && !reload) {
        return basePrompt;
    }
    basePrompt = null;
    const key = 'base_prompt.txt';
    const response = await getFileFromR2ByKey(env, key);
    if (!response.ok) {
    console.log('Base prompt not found');
    return null;
    }
    basePrompt = await response.text();
    return basePrompt;
}

function get_prompt(text, filteredDictionary) {
  return `${basePrompt}\n\n${filteredDictionary}\n\nChinese Text to Translate: ${text}`;
}

export { getBasePrompt, get_prompt };