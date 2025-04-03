const promptApiUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;


const fetchPrompt = async (text: string): Promise<string> => {
    const response = await fetch(promptApiUrl + '/get_prompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
    });
    const data = await response.json();
    return data.prompt;
};

const m_processText = async (apiKey: string, inputText: string, selectedModel: string, apiUrl: string, setShowConfigModal: (show: boolean) => void, setIsProcessing: (processing: boolean) => void, setStatus: (status: string) => void, setOutputText: any, setThinkingText: any) => {
    if (!apiKey) {
        setShowConfigModal(true);
        return;
    }
    if (!inputText) {
        alert('请输入需要翻译的文本');
        return;
    }
    setIsProcessing(true);
    setStatus('翻译中');
    setOutputText('');
    setThinkingText('');
    try {
        const prompt = await fetchPrompt(inputText);
        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [{ role: 'user', content: prompt }],
                stream: true
            })
        });

        if (!response.ok || !response.body) {
            const errorBody = await response.text();
            console.error('API Error Response:', errorBody);
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data.trim() === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta;
                        if (delta) {
                            if (delta.reasoning) {
                                if (delta.reasoning !== '\n'){
                                    setThinkingText((prev: string) => (prev + String(delta.reasoning)).replace(/\\n$/, '\n'));
                                }
                            } else if (delta.content) {
                                setOutputText((prev: string) => prev + delta.content);
                            }
                        } else if (parsed.error) {
                            console.error("API Error in stream:", parsed.error);
                            throw new Error(`API Error: ${parsed.error.message || 'Unknown error'}`);
                        }
                    } catch (error) {
                        console.error('Error parsing JSON data:', data, error);
                        setOutputText((prev: string) => prev + '\n[Error parsing response chunk]\n');
                    }
                }
            }
        }
        if (buffer.trim()) {
            console.log("Remaining buffer:", buffer);
        }

        setStatus('翻译完成');
    } catch (error: any) {
        console.error('Error:', error);
        setStatus('翻译出错，请重试');
        if (error instanceof Error) {
            setOutputText(`翻译出错: ${error.message}`);
            if (error.message.includes('401') || error.message.toLowerCase().includes('invalid key')) {
                setShowConfigModal(true);
            }
        } else {
            setOutputText('发生未知错误');
        }
    } finally {
        setIsProcessing(false);
    }
};

export default m_processText;