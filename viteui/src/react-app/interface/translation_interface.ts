export interface Translation {
    input: string;
    output: string;
    thinking: string;
    timestamp: number;
    modelName: string;
    price: number;
    translateId: string; // Contains part of transBatchId
    modelId: string;
    transBatchId: string; // ID to group translations from the same input
    isThinkingExpanded?: boolean; // Optional: Tracks if the thinking section is expanded, defaults to false (collapsed)
    isExport?: boolean; // Optional: Tracks if the item is selected for export, defaults to true
}
