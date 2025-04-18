import { OpenRouterModel } from "../hooks/filterModels";
import { calculateTotalPrice, CompletionData } from "../interface/price";
import { Translation } from "../interface/translation_interface";
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

export const fetchTransData = async (): Promise<TransData> => {
    if (cachedTransData) {
        return cachedTransData;
    }
    const responseText = await fetchText('data.json');
    const data = JSON.parse(responseText) as TransData;
    cachedTransData = data;
    return data;
};

const fetchPrompt = async (text: string, explain:boolean): Promise<string> => {

  const transData = await fetchTransData();

  const filteredDictionaryString = getFilteredDictionaryEntries(text, transData.dict);

  let prompt = transData.base_prompt + '\n\n' + filteredDictionaryString;

  if(explain){
    prompt = prompt + '\n\n'  + transData.detail_prompt;
  }else{
    prompt = prompt + '\n\n' + transData.simple_prompt;
  }


  return prompt;
};

const m_processText = async (
  explain: boolean,
  apiKey: string, 
  trans: Translation,
  updateStatus: (status: { showConfigModal?: boolean, isProcessing?: boolean, status?: string }) => void,
  setTranslate: (trans: Translation | undefined) => void,
  currentModel: OpenRouterModel | undefined,
  fewShotExamples: any[],
  translatePrompt: string,
  // transData: TransData // Removed unused parameter
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
    // const transData = await fetchTransData(); // Removed

    const prompt = await fetchPrompt(trans.input, explain);
    
    console.log("prompt is " + prompt);
    const delimiter: string = '####'

    // const alphabetRegex = /[a-zA-Z]/g; // Removed
    // const alphabetMatch = trans.input.match(alphabetRegex); // Removed
    // const alphabetPercentage = alphabetMatch ? (alphabetMatch.length / trans.input.length) * 100 : 0; // Removed
    // let isAlphabet = alphabetPercentage > 50; // Removed
    // let translatePrompt = "Translate following text into " // Removed
  
    // if(isAlphabet){ // Removed
    //   translatePrompt = translatePrompt + "Chinese "; // Removed
    // }else{ // Removed
    //   translatePrompt = translatePrompt + "English "; // Removed
    // }
    
    // const fewShotExamples = await getFewShotExamples(trans.input, transData.one_shot, translatePrompt); // Removed
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: currentModel.id,
        messages: [
          {role:'system', content: prompt},
          ...fewShotExamples,
          { role: 'user', content: translatePrompt + " " + delimiter + trans.input + delimiter }
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
