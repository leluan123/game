/**
 * Data Embedding Generator
 * 
 * This script reads Data.txt and generates a JavaScript file with embedded data
 * Run: node games/pronou/generate-data.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'Data.txt');
const OUTPUT_FILE = path.join(__dirname, 'js', 'data-embed.js');

try {
  // Read the data file
  console.log(`Reading data from: ${DATA_FILE}`);
  const dataContent = fs.readFileSync(DATA_FILE, 'utf8');
  
  // Parse JSON to validate
  const data = JSON.parse(dataContent);
  console.log(`✓ Valid JSON with ${data.length} questions`);
  
  // Generate JavaScript file
  const jsContent = `/**
 * Embedded Pronunciation Data
 * 
 * Auto-generated from Data.txt
 * Total questions: ${data.length}
 * Generated at: ${new Date().toISOString()}
 */

const PRONUNCIATION_DATA = ${dataContent};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.PRONUNCIATION_DATA = PRONUNCIATION_DATA;
}
`;
  
  // Write the output file
  fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf8');
  console.log(`✓ Generated: ${OUTPUT_FILE}`);
  console.log(`✓ File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
  console.log('\n✓ Data embedding complete!');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}