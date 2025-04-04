
interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
}

const fetchAndFilterModels = async () => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
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
