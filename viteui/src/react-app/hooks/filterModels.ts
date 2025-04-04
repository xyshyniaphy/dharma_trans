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
