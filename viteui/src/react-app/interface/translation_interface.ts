export interface Translation {
    input: string;
    output: string;
    thinking: string;
    timestamp: number;
    modelName: string;
    price: number;
    translateId: string; // Contains part of transBatchId
    modelId: string;
    transBatchId: string; // Added field: ID to group translations from the same input
}
