import * as stringSimilarity from 'string-similarity';
// Import OneShotEntry type
import { OneShotEntry } from '../interface/trans_data';

// Optional: Set WebGL backend for better performance if supported
// tf.setBackend('webgl');

// Removed unused modelPromise variable to fix build error (TS6133)

/**
 * 不需要加载模型，直接使用 string-similarity 库
 * @returns Promise<any>
 */
async function loadModel(): Promise<any> {
  return Promise.resolve();
}

/**
 * Finds the k most similar OneShotEntry objects from a list based on an input sentence and specified language field.
 * @param inputSentence The input sentence to compare against.
 * @param sentenceList The list of OneShotEntry objects containing bilingual sentences.
 * @param k The number of top similar entries to return.
 * @param lang The language field ('cn' or 'en') within OneShotEntry to use for comparison.
 * @returns A promise resolving to an array of the k most similar OneShotEntry objects.
 */
export async function findTopKSimilarSentences(
  inputSentence: string,
  sentenceList: OneShotEntry[],
  k: number,
  lang: 'cn' | 'en'
): Promise<OneShotEntry[]> {
  // 不需要加载模型
  await loadModel();

  // 根据指定的语言提取句子
  const sentencesToCompare = sentenceList.map(entry => entry[lang]);

  // 计算输入句子与列表中每个句子的相似性
  const similarities = sentencesToCompare.map(sentence =>
    stringSimilarity.compareTwoStrings(inputSentence, sentence)
  );

  // 将原始 OneShotEntry 对象与它们的相似性分数配对
  const entrySimPairs = sentenceList.map((entry, index) => ({
    entry,
    similarity: similarities[index]
  }));

  // 按相似性降序排列
  entrySimPairs.sort((a, b) => b.similarity - a.similarity);

  // 返回前 k 个 OneShotEntry 对象
  return entrySimPairs.slice(0, k).map(pair => pair.entry);
}