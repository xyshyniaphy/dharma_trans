// Import necessary types
import { OneShotEntry } from "../interface/trans_data";

// Adjusted type declaration for Intl.Segmenter
declare global {
    namespace Intl {
        interface Segmenter {
            segment(input: string): Iterable<SegmentData>; // Use a more specific Iterable type if possible
        }
        interface SegmentData { // Define the structure returned by segment()
            segment: string;
            index: number;
            input: string;
            isWordLike?: boolean;
        }
        interface SegmenterOptions {
            granularity?: 'grapheme' | 'word' | 'sentence';
            localeMatcher?: 'lookup' | 'best fit';
        }
        const Segmenter: {
            new(locales?: string | string[], options?: SegmenterOptions): Segmenter;
            prototype: Segmenter;
            supportedLocalesOf(locales: string | string[], options?: SegmenterOptions): string[];
        };
    }
}

// Interface for LLM message objects
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Interface for similarity results, referencing the original index
interface SimilarityResult {
  index: number;
  similarity: number;
}

// Function to detect if the text is predominantly Chinese characters
function isChinese(text: string): boolean {
  // Check for presence of characters in the CJK Unified Ideographs block
  return /[\u4E00-\u9FFF]/.test(text);
}

// Function to get the set of words from text using Intl.Segmenter
function getWordSet(text: string, segmenter: Intl.Segmenter | null): Set<string> { // Allow segmenter to be null
  // Fallback if segmenter is null or initialization failed
  if (!segmenter) {
    console.warn("Intl.Segmenter not available or failed, using basic splitting.");
    return new Set(text.toLowerCase().split(/\s+|\b/).filter(word => word.length > 0));
  }
  try {
    const segments = segmenter.segment(text);
    // Use the defined SegmentData interface
    return new Set(Array.from(segments)
                        .filter((s: Intl.SegmentData) => s.isWordLike)
                        .map((s: Intl.SegmentData) => s.segment.toLowerCase()));
  } catch (error) {
    console.warn("Intl.Segmenter failed during segmentation, falling back:", error);
    return new Set(text.toLowerCase().split(/\s+|\b/).filter(word => word.length > 0));
  }
}

// Function to compute Jaccard similarity between two sets
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  // Handle empty sets
  if (setA.size === 0 && setB.size === 0) return 1;

  // Calculate intersection: elements present in both sets
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  // Calculate union: all unique elements from both sets
  const union = new Set([...setA, ...setB]);

  // Check union size *after* calculating it
  if (union.size === 0) return 0;

  // Jaccard Index = |Intersection| / |Union|
  return intersection.size / union.size;
}

// Main function to get few-shot examples based on similarity
export function getFewShotExamples(
  input: string,
  oneShotData: OneShotEntry[],
  translatePrompt: string,
  k: number = 3,
  delimiter: string = '####'
): Message[] {

  // Initialize segmenters to null
  let segmenterZh: Intl.Segmenter | null = null;
  let segmenterEn: Intl.Segmenter | null = null;

  try {
    // Check if Intl.Segmenter is available before trying to instantiate
    if (typeof Intl.Segmenter === 'function') {
        segmenterZh = new Intl.Segmenter('zh', { granularity: 'word' });
        segmenterEn = new Intl.Segmenter('en', { granularity: 'word' });
    } else {
        console.warn("Intl.Segmenter constructor not found.");
    }
  } catch (e) {
      console.error("Error initializing Intl.Segmenter:", e);
      // segmenters remain null
  }

  // Detect input language
  const isInputChinese = isChinese(input);
  // Choose the appropriate segmenter (might be null)
  const segmenter = isInputChinese ? segmenterZh : segmenterEn;
  // Determine which field ('cn' or 'en') in oneShotData to compare against
  const searchField = isInputChinese ? 'cn' : 'en';

  // Tokenize the input text (getWordSet handles null segmenter)
  const inputWordSet = getWordSet(input, segmenter);

  // Compute similarities for each entry in oneShotData
  const similarities: SimilarityResult[] = oneShotData.map((entry, index) => {
    // Get the text from the appropriate field ('cn' or 'en')
    const entryText = entry[searchField];
    // Tokenize the entry text (getWordSet handles null segmenter)
    const entryWordSet = getWordSet(entryText, segmenter);
    // Calculate similarity
    const similarity = jaccardSimilarity(inputWordSet, entryWordSet);
    // Return the index and similarity score
    return { index, similarity };
  });

  // Sort entries by similarity in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Select the top K examples based on similarity
  const topKIndices = similarities.slice(0, k).map(result => result.index);

  // Format the selected top K examples
  const examples: Message[] = [];
  for (const index of topKIndices) {
    const entry = oneShotData[index];
    // Prepend translatePrompt to the user content
    const userContent = `${translatePrompt} ${delimiter}${entry.cn}${delimiter}`;
    // The assistant content should be the English part
    const assistantContent = entry.en;
    // Add the formatted pair to the examples array
    examples.push({ role: 'user', content: userContent });
    examples.push({ role: 'assistant', content: assistantContent });
  }

  // Return the formatted examples
  return examples;
}