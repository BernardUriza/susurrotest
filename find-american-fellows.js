const fs = require('fs');

// Read transcription
const transcription = fs.readFileSync('transcription.txt', 'utf8');
const lines = transcription.split('\n');

// Find lines containing "fellow" followed by "Americans"
for (let i = 0; i < lines.length - 1; i++) {
  const currentLine = lines[i].toLowerCase();
  const nextLine = lines[i + 1].toLowerCase();
  
  if (currentLine.includes('fellow') && nextLine.includes('american')) {
    console.log('Found "fellow Americans" across lines:');
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    console.log(`Line ${i + 2}: ${lines[i + 1].trim()}`);
    
    // Extract timestamps and words
    const fellowMatch = lines[i].match(/\[(.*?)\]\s+(.*)/);
    const americansMatch = lines[i + 1].match(/\[(.*?)\]\s+(.*)/);
    
    if (fellowMatch && americansMatch) {
      console.log('\nCombined phrase:');
      console.log(`[${fellowMatch[1]} --> ${americansMatch[1].split(' --> ')[1]}] ${fellowMatch[2].trim()} ${americansMatch[2].trim()}`);
    }
  }
}

// Also search for the complete phrase in the full transcription
const fullText = lines.map(line => {
  const match = line.match(/\[(.*?)\]\s+(.*)/);
  return match ? match[2].trim() : '';
}).join(' ').toLowerCase();

console.log('\nFull transcription text:');
console.log(fullText);

if (fullText.includes('fellow americans')) {
  console.log('\n✅ The phrase "fellow Americans" was found in the transcription!');
}