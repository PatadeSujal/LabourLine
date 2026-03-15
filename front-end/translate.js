/**
 * Azure Translator Script - Generates translation JSON files
 * 
 * SETUP:
 * 1. Add your Azure key and region below
 * 2. Run: node translate.js
 * 3. The script will generate ta.json, te.json, kn.json, as.json, ur.json in ./locals/
 */

const fs = require("fs");
const path = require("path");

// ========================================
// 🔑 MYMEMORY EMAIL FOR HIGHER RATE LIMITS
// ========================================
const MYMEMORY_EMAIL = process.env.EXPO_PUBLIC_MYMEMORY_EMAIL;
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";

// Languages to generate
const TARGET_LANGUAGES = [
  { code: "mr", filename: "mr.json", name: "Marathi" },
  { code: "ta", filename: "ta.json", name: "Tamil" },
  { code: "te", filename: "te.json", name: "Telugu" },
  { code: "kn", filename: "kn.json", name: "Kannada" },
  { code: "as", filename: "as.json", name: "Assamese" },
  { code: "ur", filename: "ur.json", name: "Urdu" },
];

const LOCALS_DIR = path.join(__dirname, "locals");

// Read the English source file
const enJson = JSON.parse(fs.readFileSync(path.join(LOCALS_DIR, "en.json"), "utf8"));

/**
 * Collect all translatable strings from a nested object
 * Returns array of { path: ["auth", "login"], value: "Login" }
 */
function collectStrings(obj, currentPath = []) {
  const results = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      results.push({ path: [...currentPath, key], value: val });
    } else if (typeof val === "object" && val !== null) {
      results.push(...collectStrings(val, [...currentPath, key]));
    }
  }
  return results;
}

/**
 * Set a value in a nested object by path
 */
function setNestedValue(obj, pathArr, value) {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!current[pathArr[i]]) current[pathArr[i]] = {};
    current = current[pathArr[i]];
  }
  current[pathArr[pathArr.length - 1]] = value;
}

/**
 * Protect interpolation variables like {{amount}} from translation
 * Replaces them with numbered placeholders, translates, then restores
 */
function protectVariables(text) {
  const vars = [];
  const protected_ = text.replace(/\{\{(\w+)\}\}/g, (match) => {
    vars.push(match);
    return `__VAR${vars.length - 1}__`;
  });
  return { text: protected_, vars };
}

function restoreVariables(text, vars) {
  let result = text;
  vars.forEach((v, i) => {
    // Handle possible spacing/formatting changes from translation
    const regex = new RegExp(`__VAR${i}__`, "g");
    result = result.replace(regex, v);
  });
  return result;
}

/**
 * Call MyMemory API to translate a single text
 */
async function translateText(text, targetLang) {
  let url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
  
  if (MYMEMORY_EMAIL) {
    url += `&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MyMemory API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  
  // MyMemory returns translated text in responseData.translatedText
  if (data.responseStatus !== 200 && data.responseStatus !== "200") {
     throw new Error(`MyMemory API Error (${data.responseStatus}): ${data.responseDetails}`);
  }

  return data.responseData.translatedText;
}

/**
 * Translate all strings for a single target language
 */
async function translateForLanguage(strings, targetLang) {
  const translatedStrings = [];

  // Protect variables before sending to translation
  const protectedTexts = strings.map((s) => protectVariables(s.value));

  for (let i = 0; i < protectedTexts.length; i++) {
    const b = protectedTexts[i];

    console.log(`    Translating ${i + 1}/${protectedTexts.length}...`);

    let translatedText = "";
    try {
      translatedText = await translateText(b.text, targetLang);
    } catch(err) {
      console.error(`      Error on text "${b.text}": ${err.message}`);
      translatedText = b.text; // fallback
    }

    // Restore variables
    const restored = restoreVariables(translatedText, b.vars);
    translatedStrings.push(restored);

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  return translatedStrings;
}

/**
 * Main execution
 */
async function main() {
  console.log("🌐 MyMemory Translator - LabourLine Translation Generator\n");

  // Collect all strings from en.json
  const strings = collectStrings(enJson);
  console.log(`📄 Found ${strings.length} strings to translate\n`);

  for (const lang of TARGET_LANGUAGES) {
    console.log(`🔄 Translating to ${lang.name} (${lang.code})...`);

    try {
      const translated = await translateForLanguage(strings, lang.code);

      // Build the translated JSON object
      const result = {};
      strings.forEach((s, index) => {
        setNestedValue(result, s.path, translated[index]);
      });

      // Write the file
      const outputPath = path.join(LOCALS_DIR, lang.filename);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8");

      console.log(`  ✅ ${lang.name} saved to locals/${lang.filename}\n`);
    } catch (error) {
      console.error(`  ❌ Failed for ${lang.name}: ${error.message}\n`);
    }
  }

  console.log("🎉 Done! All translation files generated.");
  console.log("\n📝 Next steps:");
  console.log("   1. Review the generated files in locals/");
  console.log("   2. Update i18n.js to import the new files");
  console.log("   3. Update LanguageSelection.js languageCodeMap");
}

main().catch(console.error);
