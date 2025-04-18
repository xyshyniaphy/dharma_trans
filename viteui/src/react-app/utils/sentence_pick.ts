import * as tf from '@tensorflow/tfjs';

// Optional: Set WebGL backend for better performance if supported
tf.setBackend('webgl');

// Singleton promise to load the model once
let modelPromise: Promise<tf.GraphModel> | null = null;

async function loadModel(): Promise<tf.GraphModel> {
  if (!modelPromise) {
    const modelUrl = 'https://tfhub.dev/google/universal-sentence-encoder-multilingual/3?tfjs-format=file';
    modelPromise = tf.loadGraphModel(modelUrl);
  }
  return modelPromise;
}

/**
 * Finds the k most similar sentences from a list based on an input sentence.
 * @param inputSentence The input sentence to compare against.
 * @param sentenceList The list of sentences to rank.
 * @param k The number of top similar sentences to return.
 * @returns A promise resolving to an array of the k most similar sentences.
 */
export async function findTopKSimilarSentences(
  inputSentence: string,
  sentenceList: string[],
  k: number
): Promise<string[]> {
  // Load the model
  const model = await loadModel();

  // Combine input and list sentences for batch processing
  const allSentences = [inputSentence, ...sentenceList];
  const inputTensor = tf.tensor(allSentences, [allSentences.length], 'string');

  // Generate embeddings
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

  // Pair sentences with their similarity scores
  const sentenceSimPairs = sentenceList.map((sentence, index) => ({
    sentence,
    similarity: similarities[index]
  }));

  // Sort by similarity in descending order
  sentenceSimPairs.sort((a, b) => b.similarity - a.similarity);

  // Return the top k sentences
  return sentenceSimPairs.slice(0, k).map(pair => pair.sentence);
}