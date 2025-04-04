// Combined function to find words in the text and format the dictionary results
function getFilteredDictionary(text, dictionary) {
	const startTime = performance.now(); // Start time in milliseconds

	const wordsToLookup = new Set();
	const maxChineseWordLength = 10; // Maximum length of Chinese word to check in the dictionary
	for (let i = 0; i < text.length; i++) {
		for (let len = 1; len <= maxChineseWordLength && i + len <= text.length; len++) {
			const potentialWord = text.substring(i, i + len);
			if (dictionary.has(potentialWord)) {
				wordsToLookup.add(potentialWord);
			}
		}
	}

	const results = [];
	for (const word of wordsToLookup) {
		if (dictionary.has(word)) {
			const englishTranslation = dictionary.get(word);
			results.push(`ch:${word} en:${englishTranslation}`);
		}
	}

	const endTime = performance.now(); // End time in milliseconds
	const executionTimeMicroseconds = (endTime - startTime) * 1000; // Convert to microseconds
	return { results: results.join('\n'), executionTimeMicroseconds };
}

export { getFilteredDictionary };