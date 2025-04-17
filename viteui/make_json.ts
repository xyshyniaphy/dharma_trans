import * as fs from 'fs';
import * as path from 'path';
// Import necessary functions for ESM path resolution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current filename and directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the path to the data directory relative to the workspace root
const dataDir = path.resolve(__dirname, '../../data');
// Define the path for the output JSON file relative to this script's location
const outputJsonPath = path.resolve(__dirname, './data.json');

// Helper function to read a file and return its content as a string
const readFileContent = (fileName: string): string => {
    try {
        return fs.readFileSync(path.join(dataDir, fileName), 'utf-8');
    } catch (error) {
        console.error(`Error reading file ${fileName}:`, error);
        // Exit if essential files cannot be read
        process.exit(1);
        // Add a throw to satisfy TS compiler about function return path
        throw error; // Added throw
    }
};

// Helper function to read lines from a file, filtering out empty lines
const readFileLines = (fileName: string): string[] => {
    const content = readFileContent(fileName);
    return content.split(/\r?\n/).filter(line => line.trim() !== '');
};

// Read prompt files
const base_prompt = readFileContent('base_prompt.txt');
const simple_prompt = readFileContent('simple_prompt.txt');
const detail_prompt = readFileContent('detail_prompt.txt');

// Read model list
const model_list = readFileLines('model_list.txt');

// Read dictionary CSV
// Basic CSV parsing: assumes no commas within quoted fields
const dictCsvContent = readFileContent('dic.csv');
const dictLines = dictCsvContent.split(/\r?\n/).filter(line => line.trim() !== ''); // Filter empty lines
const dict = dictLines.map(line => {
    // Split by the first comma only to handle potential commas in the English text
    const parts = line.split(/,(.+)/);
    if (parts.length >= 2) {
        return { cn: parts[0].trim(), en: parts[1].trim() };
    } else {
        console.warn(`Skipping malformed dictionary line: ${line}`);
        return null; // Skip malformed lines
    }
}).filter(entry => entry !== null); // Filter out null entries from skipped lines

// Read one-shot translation files
const cnLines = readFileLines('cn.txt');
const enLines = readFileLines('en.txt');

// Check if one-shot files have the same number of non-empty lines
if (cnLines.length !== enLines.length) {
    console.error(`Error: Mismatch in the number of non-empty lines between cn.txt (${cnLines.length}) and en.txt (${enLines.length}).`);
    process.exit(1);
}

// Map one-shot lines
const one_shot = cnLines.map((cnLine, index) => {
    return { cn: cnLine, en: enLines[index] };
});

// Assemble the final data object
const jsonData = {
    base_prompt,
    simple_prompt,
    detail_prompt,
    dict,
    model_list,
    one_shot
};

// Write the JSON data to the output file
try {
    fs.writeFileSync(outputJsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`Successfully generated ${outputJsonPath}`);
} catch (error) {
    console.error(`Error writing JSON file ${outputJsonPath}:`, error);
    process.exit(1);
} 