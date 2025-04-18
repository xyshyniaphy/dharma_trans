// Import necessary types
import { OneShotEntry } from "../interface/trans_data";
// Import the sentence similarity function
import { findTopKSimilarSentences } from './sentence_pick';

// Interface for LLM message objects
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Main function to get few-shot examples based on similarity
export async function getFewShotExamples(
  input: string,
  oneShotData: OneShotEntry[],
  translatePrompt: string,
  k: number = 2,
  delimiter: string = '####'
): Promise<Message[]> { // Changed return type to Promise<Message[]> as findTopK is async

  // Determine the language for comparison (simple check for CJK characters)
  // A more robust language detection might be needed depending on requirements
  // Check for non-ASCII characters. If present, assume 'cn', otherwise 'en'.
  const lang: 'cn' | 'en' = /[^\x00-\x7F]/.test(input) ? 'cn' : 'en';

  // Get the top K most similar entries using the sentence encoder model
  const topKEntries = await findTopKSimilarSentences(input, oneShotData, k, lang);

  // Format the selected top K examples
  const examples: Message[] = [];
  // Iterate through the returned OneShotEntry objects
  for (const entry of topKEntries) {
    // Prepend translatePrompt to the user content (using the Chinese part)
    const userContent = `${translatePrompt} ${delimiter}${entry.cn}${delimiter}`;
    // The assistant content should be the English part
    const assistantContent = entry.en;
    // Add the formatted pair to the examples array
    examples.push({ role: 'user', content: userContent });
    examples.push({ role: 'assistant', content: assistantContent });
  }

  // Return the formatted examples
  console.log("on getFewShotExamples: ", examples);
  return examples;
}