

// Common function to validate and parse JSON input
async function parseJsonRequest(request) {
	try {
		const body = await request.json();
		const inputText = body.text;
		if (typeof inputText !== 'string' || inputText.length === 0) {
			throw new Error('Invalid input: "text" field must be a non-empty string.');
		}
		return inputText;
	} catch (error) {
		throw new Error('Invalid JSON input.');
	}
}
export { parseJsonRequest };