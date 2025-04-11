import { OpenRouterModel } from "../hooks/filterModels";
import { calculateTotalPrice, CompletionData } from "../interface/price";
import { Translation } from "../interface/translation_interface";

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

const m_processText = async (
  explain: boolean,
  apiKey: string, 
  trans: Translation,
  selectedModel: string, 
  updateStatus: (status: { showConfigModal?: boolean, isProcessing?: boolean, status?: string }) => void,
  setTranslate: (trans: Translation | undefined) => void,
  currentModel: OpenRouterModel | null
): Promise<Translation> => {
  if (!apiKey) {
    updateStatus({ showConfigModal: true, isProcessing: false, status: '请先配置API Key' });
    return trans;
  } 
  if (!trans.input) {
    alert('请输入需要翻译的文本');
    return trans;
  }
  
  updateStatus({ isProcessing: true, status: '开始翻译' });
  
  let outputText = '';
  
  try {
    const prompt = await fetchPrompt(trans.input, explain);

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0,
        top_p: 0.1,
        presence_penalty: 0,
        frequency_penalty: 0
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
    let thinkingText = '';
    let price = 0;

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
              price = calculateTotalPrice(parsed, currentModel);
            }
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              if (delta.reasoning && delta.reasoning !== '\n') {
                thinkingText += String(delta.reasoning);
                setTranslate({ ...trans, thinking: thinkingText });
              }
              if (delta.content) {
                const content = String(delta.content);
                if(content && content.length > 0 ){
                  outputText += content;
                  setTranslate({ ...trans, output: outputText });
                }
              }
            } 
          } catch (error) {
            console.error('Error parsing JSON data:', data, error);
            outputText += '\n[Error parsing response chunk]\n';
          }
        }
      }
    }
    
    outputText = outputText.replace(/```md/g, '').replace(/```markdown/g, '').replace(/```/g, '');
    thinkingText = thinkingText.replace(/\n$/, '\n');
    
    return { 
      ...trans, 
      output: outputText, 
      thinking: thinkingText,
      price: price 
    };

  } catch (error: any) {
    console.error('Error:', error);
    updateStatus({ isProcessing: false, status: '翻译出错，请重试' });
    if (error instanceof Error) {
      outputText = `翻译出错: ${error.message}`;
      if (error.message.includes('401') || error.message.toLowerCase().includes('invalid key')) {
        updateStatus({ showConfigModal: true, isProcessing: false, status: '请先配置API Key' });
      }
    } else {
      outputText = '发生未知错误';
    }
    return { ...trans, output: outputText };
  } finally {
    updateStatus({ isProcessing: false, status: '' });
  }
};

export default m_processText;
