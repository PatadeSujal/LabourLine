const fs = require('fs');
const path = require('path');

const workDataPath = path.join(process.cwd(), 'app/src/store/WorkData.js');
const files = ['locals/en.json', 'locals/mr.json', 'locals/hi.json'];

const content = fs.readFileSync(workDataPath, 'utf8');

const labels = [...content.matchAll(/label:\s*"([^"]+)"/g)].map(m => m[1]);
const values = [...content.matchAll(/value:\s*"([^"]+)"/g)].map(m => m[1]);
const items = [...content.matchAll(/item:\s*"([^"]+)"/g)].map(m => m[1]);

const uniqueStrings = [...new Set([...labels, ...values, ...items])];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!json.workData) json.workData = {};
    
    uniqueStrings.forEach(str => {
      // Only set if missing to preserve manual translations they might have already done
      if (!json.workData[str]) {
        json.workData[str] = str; 
      }
    });

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
    console.log(`Updated placeholders in ${file}`);
  }
});
