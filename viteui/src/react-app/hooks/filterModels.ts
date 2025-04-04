const apiUrl = import.meta.env.VITE_OPENAI_URL;

const dharmaPromptUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;

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

const fetchAndFilterModels = async () => {
    try {
        
        const modelList = await fetch(dharmaPromptUrl + '/access/model_list.txt');
        const modelListData = (await modelList.text()).split('\n');
        // console.log(modelListData);

        const response = await fetch(apiUrl + '/models');
        const data = await response.json();
        const modelNames = modelListData.map(name => name.trim().toLowerCase());
        console.log(modelNames);
        console.log(data.data);
        const filteredModels = data.data.filter((model: OpenRouterModel) => {
          return modelNames.some(name => model.id.toLowerCase() === name);
        });
        return filteredModels;
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
};

export { fetchAndFilterModels };
export type { OpenRouterModel };
