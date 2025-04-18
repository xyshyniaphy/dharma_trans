const apiUrl = import.meta.env.VITE_OPENAI_URL;


import { fetchTransData } from '../utils/translate_tool';

interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    created: number;
    context_length: number;
    architecture: {
        modality: string;
        input_modalities: string[];
        output_modalities: string[];
        tokenizer: string;
        instruct_type: null;
    };
    pricing: {
        prompt: string;
        completion: string;
        request: string;
        image: string;
        web_search: string;
        internal_reasoning: string;
        input_cache_read: string;
        input_cache_write: string;
    };
    top_provider: {
        context_length: number;
        max_completion_tokens: number;
        is_moderated: boolean;
    };
    per_request_limits: null;
}


//models are static, just load for once
const fetchAndFilterModels = async () => {
    try {
        const transData = await fetchTransData();
        // 直接使用 transData.model_list，不做 map 操作
        const myCustomizedModelNames = transData.model_list; // 保持原始格式，避免 map

        //this is openrouter api, fetch all models from openrouter
        const response = await fetch(apiUrl + '/models');
        const openRouterModels: {data: OpenRouterModel[]} = await response.json();
        // 用 modelNames 过滤模型
        const filteredModels = openRouterModels.data.filter((model: OpenRouterModel) => {
          return myCustomizedModelNames.some(name => model.id.toLowerCase() === name.toLowerCase()); // 保证不区分大小写
        });
        return filteredModels;
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
};

export { fetchAndFilterModels };
export type { OpenRouterModel };
