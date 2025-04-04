

const apiUrl = import.meta.env.VITE_OPENAI_URL;

const dharmaPromptUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;
interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
}

const fetchAndFilterModels = async () => {
    try {
        
        const modelList = await fetch(dharmaPromptUrl + '/access/model_list.txt');
        const modelListData = await modelList.text();
        console.log(modelListData);

        const response = await fetch(apiUrl + '/models');
        const data = await response.json();
        const filteredModels = data.data.filter((model: OpenRouterModel) =>
            model.name.toLowerCase().includes('free') &&
           !model.name.toLowerCase().includes('distill') &&
            !model.name.toLowerCase().includes('preview') &&
            !model.name.toLowerCase().includes('learnlm')
        ).filter((model: OpenRouterModel) =>
            (model.name.toLowerCase().includes('pro') &&model.name.toLowerCase().includes('gemini pro') )||
            model.name.toLowerCase().includes('deepseek') ||
            model.name.toLowerCase().includes('qwq') ||
            model.name.toLowerCase().includes('gemma')
        );
        return filteredModels;
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
};

export { fetchAndFilterModels };
export type { OpenRouterModel };
