// Define the URLs for the text files (replace with actual Cloudflare Workers URLs)
const CHINESE_URL: string = 'http://s.com/chinese.txt';
const ENGLISH_URL: string = 'http://s.com/english.txt';

// Cache for text file lines
let chineseLines: string[] | null = null;
let englishLines: string[] | null = null;

// Interface for similarity results
interface SimilarityResult {
  index: number;
  similarity: number;
}

// Interface for LLM message objects
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Function to load and cache the text files
async function loadTexts(): Promise<void> {
  if (chineseLines && englishLines) return;
  try {
    const [chineseResponse, englishResponse] = await Promise.all([
      fetch(CHINESE_URL),
      fetch(ENGLISH_URL),
    ]);
    if (!chineseResponse.ok || !englishResponse.ok) {
      throw new Error('Failed to fetch text files');
    }
    const chineseText = await chineseResponse.text();
    const englishText = await englishResponse.text();
    chineseLines = chineseText.split('\n').filter((line) => line.trim() !== '');
    englishLines = englishText.split('\n').filter((line) => line.trim() !== '');
    if (chineseLines.length !== englishLines.length) {
      throw new Error('Text files have different number of lines');
    }
  } catch (error) {
    console.error('Error loading texts:', error);
    throw error instanceof Error ? error : new Error('Unknown error loading texts');
  }
}

// Function to detect if the text is Chinese
function isChinese(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

// Function to get the set of words from text using Intl.Segmenter
// @ts-ignore
function getWordSet(text: string, segmenter: Intl.Segmenter): Set<string> {
  const segments = segmenter.segment(text);
  return new Set(Array.from(segments).map((s:any) => s.segment));
}

// Function to compute Jaccard similarity between two sets
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// Main function to get few-shot examples
export async function getFewShotExamples(
  input: string,
  k: number = 3,
  delimiter: string = '####'
): Promise<Message[]> {
  await loadTexts();
  // @ts-ignore  // Ignoring for segmenterZh as Intl.Segmenter is available in Chrome
  const segmenterZh = new Intl.Segmenter('zh', { granularity: 'word' });
  // @ts-ignore  // Ignoring for segmenterEn as Intl.Segmenter is available in Chrome
  const segmenterEn = new Intl.Segmenter('en', { granularity: 'word' });
  const isInputChinese = isChinese(input);
  const searchArray = isInputChinese ? chineseLines! : englishLines!;
  const correspondArray = isInputChinese ? englishLines! : chineseLines!;
  const segmenter = isInputChinese ? segmenterZh : segmenterEn;
  const inputWordSet = getWordSet(input, segmenter);

  // Compute similarities
  const similarities: SimilarityResult[] = searchArray.map((line, index) => {
    const lineWordSet = getWordSet(line, segmenter);
    const similarity = jaccardSimilarity(inputWordSet, lineWordSet);
    return { index, similarity };
  });

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Take top K
  const topK = similarities.slice(0, k);

  // Format the examples
  const examples: Message[] = [];
  for (const { index } of topK) {
    const userContent = `${delimiter}${searchArray[index]}${delimiter}`;
    const assistantContent = correspondArray[index];
    examples.push({ role: 'user', content: userContent });
    examples.push({ role: 'assistant', content: assistantContent });
  }

  return examples;
}