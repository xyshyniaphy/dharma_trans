import { OpenRouterModel } from "../hooks/filterModels";
import { calculateTotalPrice, CompletionData } from "../interface/price";
import { Translation } from "../interface/translation_interface";
import { getFewShotExamples } from "./getFewShot";
import { TransData } from "../interface/trans_data";
import { getFilteredDictionaryEntries } from './get_dict';

const promptApiUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;

const apiUrl = import.meta.env.VITE_OPENAI_URL;

let cachedTransData: TransData | null = null;

const fetchText = async (filename: string): Promise<string> => {
    const response = await fetch(promptApiUrl + '/access/' + filename, {
        method: 'GET',
    });
    return await response.text();
};

const fetchTransData = async (): Promise<TransData> => {
    if (cachedTransData) {
        return cachedTransData;
    }
    const responseText = await fetchText('data.json');
    const data = JSON.parse(responseText) as TransData;
    cachedTransData = data;
    return data;
};

const fetchPrompt = async (text: string, explain:boolean): Promise<string> => {
  const alphabetRegex = /[a-zA-Z]/g;
  const alphabetMatch = text.match(alphabetRegex);
  const alphabetPercentage = alphabetMatch ? (alphabetMatch.length / text.length) * 100 : 0;
  let isAlphabet = alphabetPercentage > 50;

  const transData = await fetchTransData();

  const filteredDictionaryString = getFilteredDictionaryEntries(text, transData.dict);

  let dictPrompt = `Please translate the following text, using the provided dictionary entries if applicable:\n\nDictionary:\n${filteredDictionaryString}\n\nText to translate:\n${text}\n\nTranslation:\n`;

  if(isAlphabet){
    dictPrompt = dictPrompt + "'''English'''";
  }else{
    dictPrompt = dictPrompt + "'''Chinese'''";
  }

  if(explain){
      const detail_prompt = transData.detail_prompt;
      return detail_prompt + '\n' + dictPrompt;
  }else{
      const simple_prompt = transData.simple_prompt;
      return simple_prompt + '\n' + dictPrompt;
  }
};

const m_processText = async (
  explain: boolean,
  apiKey: string, 
  trans: Translation,
  updateStatus: (status: { showConfigModal?: boolean, isProcessing?: boolean, status?: string }) => void,
  setTranslate: (trans: Translation | undefined) => void,
  currentModel: OpenRouterModel | undefined
): Promise<Translation> => {
  if (!apiKey) {
    updateStatus({ showConfigModal: true, isProcessing: false, status: '请先配置API Key' });
    return trans;
  } 
  if (!trans.input) {
    alert('请输入需要翻译的文本');
    return trans;
  }
  if (!currentModel) {
    alert('模型未配置');
    return trans;
  }
  
  let outputText = '';
  let thinkingText = '';
  let price = 0;
  let expandThinking = false;

  
  try {
    const prompt = await fetchPrompt(trans.input, explain);
    
    console.log("prompt is " + prompt);
    
    const fewShotExamples = await getFewShotExamples(trans.input);
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: currentModel.id,
        messages: [
          {role:'system', content:'You are an translate assistant that speaks like Buddha (a.k.a. Siddhārtha Gautama or Buddha Shakyamuni).'},   
          ...fewShotExamples,
          { role: 'user', content: prompt }
        ],
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
            
            if(parsed.usage){
              price = calculateTotalPrice(parsed, currentModel);
            }
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              if (delta.reasoning && delta.reasoning !== '\n') {
                thinkingText += String(delta.reasoning);
                expandThinking = true;

                setTranslate({ ...trans, thinking: thinkingText, isThinkingExpanded: expandThinking });
              }
              if (delta.content) {
                const content = String(delta.content);
                if(content && content.length > 0 ){
                  outputText += content;
                  setTranslate({ ...trans, output: outputText, isThinkingExpanded: expandThinking });
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

  } catch (error: any) {
    console.error('Error:', error);
    if (error instanceof Error) {
      outputText += `\n翻译出错: ${error.message}`;
      if (error.message.includes('401') || error.message.toLowerCase().includes('invalid key')) {
        updateStatus({ showConfigModal: true, isProcessing: false, status: '请先配置API Key' });
      }
    } else {
      outputText += `\n发生未知错误`;
    }
  } finally {
    setTranslate(undefined);
  }

  outputText = outputText.replace(/```md/g, '').replace(/```markdown/g, '').replace(/```/g, '');
  thinkingText = thinkingText.replace(/\\n/g, '\n');
  
  return { 
    ...trans, 
    output: outputText, 
    thinking: thinkingText,
    price: price,
    isThinkingExpanded: expandThinking 
  };
};

export default m_processText;
