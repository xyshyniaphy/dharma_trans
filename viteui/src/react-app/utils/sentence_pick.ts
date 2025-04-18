import * as tf from '@tensorflow/tfjs';
// Import OneShotEntry type
import { OneShotEntry } from '../interface/trans_data';

// Optional: Set WebGL backend for better performance if supported
tf.setBackend('webgl');

// 单例 promise 用于加载模型
let modelPromise: Promise<tf.GraphModel> | null = null;

/**
 * 从 TensorFlow Hub 加载多语言 USE GraphModel
 * @returns Promise<tf.GraphModel>
 */
async function loadModel(): Promise<tf.GraphModel> {
  if (!modelPromise) {
    // 使用稳定的通用句子编码器英语模型 URL
    const modelUrl = 'https://tfhub.dev/google/universal-sentence-encoder/4?tfjs-format=file';
    modelPromise = tf.loadGraphModel(modelUrl, { fromTFHub: true });
  }
  return modelPromise;
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
  sentenceList: OneShotEntry[], // Changed parameter type
  k: number,
  lang: 'cn' | 'en' // Added lang parameter
): Promise<OneShotEntry[]> { // Changed return type
  // Load the model
  const model = await loadModel();

  // Extract the sentences based on the specified language
  const sentencesToCompare = sentenceList.map(entry => entry[lang]);

  // Combine input and list sentences for batch processing
  const allSentences = [inputSentence, ...sentencesToCompare];
  // 将字符串数组转换为 tf.Tensor 并生成 embeddings
  const inputTensor = tf.tensor(allSentences, [allSentences.length], 'string');
  const embeddingsTensor = model.predict(inputTensor) as tf.Tensor;
  const embeddings = await embeddingsTensor.array() as number[][];
  const inputEmbedding = embeddings[0];
  const listEmbeddings = embeddings.slice(1);

  // Compute cosine similarities
  const similarities = listEmbeddings.map(emb => {
    const dotProduct = inputEmbedding.reduce((sum, val, i) => sum + val * emb[i], 0);
    const normInput = Math.sqrt(inputEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normEmb = Math.sqrt(emb.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normInput * normEmb);
  });

  // Pair original OneShotEntry objects with their similarity scores
  const entrySimPairs = sentenceList.map((entry, index) => ({
    entry, // Keep the original entry
    similarity: similarities[index]
  }));

  // Sort by similarity in descending order
  entrySimPairs.sort((a, b) => b.similarity - a.similarity);

  // Return the top k OneShotEntry objects
  return entrySimPairs.slice(0, k).map(pair => pair.entry); // Return the entry object
}