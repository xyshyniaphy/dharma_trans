import { OpenRouterModel } from "../hooks/filterModels";




interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface ChoiceDelta {
    role: string;
    content: string;
    reasoning: string;
}

interface Choice {
    index: number;
    delta: ChoiceDelta;
    finish_reason: string | null;
    native_finish_reason: string | null;
    logprobs: null | any;
}

interface CompletionData {
    id: string;
    provider: string;
    model: string;
    object: string;
    created: number;
    choices: Choice[];
    usage: Usage;
}






function calculateTotalPrice(completionData: CompletionData, modelInfo: OpenRouterModel): number {
    const pricing = modelInfo.pricing;
    const usage = completionData.usage;

    const promptPriceStr: string = pricing.prompt;
    const completionPriceStr: string = pricing.completion;

    const promptTokens: number = usage.prompt_tokens;
    const completionTokens: number = usage.completion_tokens;

    let promptPrice: number;
    try {
        promptPrice = parseFloat(promptPriceStr);
    } catch (error) {
        promptPrice = 0.0;
    }

    let completionPrice: number;
    try {
        completionPrice = parseFloat(completionPriceStr);
    } catch (error) {
        completionPrice = 0.0;
    }

    const promptCost: number = (promptTokens / 1000) * promptPrice;
    const completionCost: number = (completionTokens / 1000) * completionPrice;

    const totalPrice: number = promptCost + completionCost;
    return totalPrice;
}


export { calculateTotalPrice }
export type { Usage, ChoiceDelta, Choice, CompletionData }