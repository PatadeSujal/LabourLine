const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locals');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  en: {
    clearFilter: "Clear Filter",
    clearSort: "Clear Sort",
    distanceNearest: "Distance (Nearest)",
    priceLowToHigh: "Price (Low to High)",
    priceHighToLow: "Price (High to Low)",
    biddingOnly: "Bidding Allowed Only",
    fixedPriceOnly: "Fixed Price Only",
    filterBy: "Filter By",
    sortBy: "Sort By"
  },
  hi: {
    clearFilter: "फ़िल्टर साफ़ करें",
    clearSort: "सॉर्ट साफ़ करें",
    distanceNearest: "दूरी (निकटतम)",
    priceLowToHigh: "कीमत (कम से ज्यादा)",
    priceHighToLow: "कीमत (ज्यादा से कम)",
    biddingOnly: "केवल बोली वाले काम",
    fixedPriceOnly: "केवल निश्चित मूल्य वाले काम",
    filterBy: "फ़िल्टर करें",
    sortBy: "सॉर्ट करें"
  },
  mr: {
    clearFilter: "फिल्टर साफ करा",
    clearSort: "सॉर्ट साफ करा",
    distanceNearest: "अंतर (सर्वात जवळ)",
    priceLowToHigh: "किंमत (कमी ते जास्त)",
    priceHighToLow: "किंमत (जास्त ते कमी)",
    biddingOnly: "फक्त बोली लावणारी कामे",
    fixedPriceOnly: "फक्त निश्चित किंमत असलेली कामे",
    filterBy: "फिल्टर करा",
    sortBy: "सॉर्ट करा"
  }
};

const fallback = newKeys.en;

for (const file of files) {
  const filePath = path.join(localesDir, file);
  const lang = file.split('.')[0];
  const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!obj.filterAndSort) {
     obj.filterAndSort = {};
  }

  const translations = newKeys[lang] || fallback;
  
  Object.assign(obj.filterAndSort, translations);

  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
  console.log('Updated ' + file);
}
