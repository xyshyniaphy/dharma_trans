// Use require for Node.js built-in modules in CommonJS
const fs = require('fs');
const path = require('path');

// The script is now in the 'data' directory, so data files are in the current directory
const dataDir = __dirname; // Current directory
// Output path is now inside the current directory ('data')
const outputJsonPath = path.resolve(__dirname, './data.json'); // Updated output path

// Helper function to read a file and return its content as a string
const readFileContent = (fileName) => {
    try {
        // Construct path relative to the current script directory
        return fs.readFileSync(path.join(dataDir, fileName), 'utf-8');
    } catch (error) {
        console.error(`Error reading file ${fileName}:`, error);
        // Exit if essential files cannot be read
        process.exit(1);
        // Throw error to satisfy potential static analysis (though less relevant in JS)
        throw error;
    }
};

// Helper function to read lines from a file, filtering out empty lines
const readFileLines = (fileName) => {
    const content = readFileContent(fileName);
    // Split by newline characters (Windows or Unix)
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
// Filter empty lines after splitting
const dictLines = dictCsvContent.split(/\r?\n/).filter(line => line.trim() !== '');
const dict = dictLines.map(line => {
    // Split by the first comma only
    const parts = line.split(/,(.+)/);
    if (parts.length >= 2) {
        const cnText = parts[0].trim();
        // Skip if 'cn' field has only one character (assuming Chinese characters)
        if (cnText.length === 1) {
            console.log(`Skipping dictionary entry with single character: ${cnText}`);
            return null;
        }
        // Trim whitespace from both parts
        return { cn: cnText, en: parts[1].trim() };
    } else {
        console.warn(`Skipping malformed dictionary line: ${line}`);
        return null; // Indicate a malformed line
    }
}).filter(entry => entry !== null); // Remove null entries from the final array

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

// Assemble the final data object (structure mirrors TransData interface)
const jsonData = {
    base_prompt,
    simple_prompt,
    detail_prompt,
    dict,           // Array of {cn, en} objects
    model_list,     // Array of strings
    one_shot        // Array of {cn, en} objects
};

// Write the JSON data to the output file
try {
    // No need to ensure parent directory exists as it's the current directory
    // const outputDir = path.dirname(outputJsonPath);
    // if (!fs.existsSync(outputDir)){
    //     fs.mkdirSync(outputDir, { recursive: true });
    // }

    // Write the file with pretty printing (2-space indentation)
    fs.writeFileSync(outputJsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`Successfully generated ${outputJsonPath}`);
} catch (error) {
    console.error(`Error writing JSON file ${outputJsonPath}:`, error);
    process.exit(1);
} 