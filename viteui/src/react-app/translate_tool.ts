import { OpenRouterModel } from "./hooks/filterModels";
import { calculateTotalPrice, CompletionData } from "./interface/price";

const promptApiUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;

const apiUrl = import.meta.env.VITE_OPENAI_URL;

const fetchText = async (filename: string): Promise<string> => {
    const response = await fetch(promptApiUrl + '/access/' + filename, {
        method: 'GET',
    });
    return await response.text();
};

const fetchPrompt = async (text: string, explain:boolean): Promise<string> => {
    const response = await fetch(promptApiUrl + '/get_prompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
    });
    const data = await response.json();
    const prompt = data.prompt;
    console.log("dict prompt is " + prompt);
    if(explain){
        const simple_prompt = await fetchText('detail_prompt.txt');
        return simple_prompt + '\n' + prompt;
    }else{
        const detail_prompt = await fetchText('simple_prompt.txt');
        return detail_prompt + '\n' + prompt;
    }
};

const m_processText = async (explain:boolean,apiKey: string, inputText: string, selectedModel: string, setShowConfigModal: (show: boolean) => void, setIsProcessing: (processing: boolean) => void, setStatus: (status: string) => void, setOutputText: any, setThinkingText: any, setPrice: (price: number) => void, currentModel: OpenRouterModel | null) => {
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
        const prompt = await fetchPrompt(inputText,explain);
        console.log("prompt is " + prompt);

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
                        const parsed = JSON.parse(data) as CompletionData;
                        if(parsed.usage && currentModel !== null){  
                            const totalPrice = calculateTotalPrice(parsed, currentModel);
                            console.log("totalPrice is " + totalPrice);
                            setPrice(totalPrice);
                        }
                        const delta = parsed.choices?.[0]?.delta;
                        if (delta) {
                            if (delta.reasoning) {
                                if (delta.reasoning !== '\n'){
                                    const reasoning = String(delta.reasoning);
                                setThinkingText((prev: string) => (prev + String(reasoning)));
                            }
                        } else if (delta.content) {
                            const content = (delta.content);
                            setOutputText((prev: string) => prev + content);
                        }
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
        
        setThinkingText((prev: string) => prev.replace(/\\n$/, '\n'));
        setOutputText((prev: string) => prev.replace(/```md/g, '').replace(/```markdown/g, '').replace(/```/g, ''));

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
