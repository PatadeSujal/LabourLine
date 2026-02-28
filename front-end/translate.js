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
// 🔑 PASTE YOUR AZURE CREDENTIALS HERE
// ========================================
const AZURE_KEY = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_KEY;
const AZURE_REGION = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_REGION; // Change to your region (e.g., "global", "eastus", "westeurope")
const AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

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
 * Call Azure Translator API to translate a batch of texts
 * Azure allows up to 100 texts per request
 */
async function translateBatch(texts, targetLang) {
  const body = texts.map((t) => ({ Text: t }));

  const url = `${AZURE_ENDPOINT}/translate?api-version=3.0&from=en&to=${targetLang}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
      "Ocp-Apim-Subscription-Region": AZURE_REGION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Azure API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.map((d) => d.translations[0].text);
}

/**
 * Translate all strings for a single target language
 */
async function translateForLanguage(strings, targetLang) {
  const BATCH_SIZE = 50; // Azure supports up to 100, using 50 for safety
  const translatedStrings = [];

  // Protect variables before sending to Azure
  const protectedTexts = strings.map((s) => protectVariables(s.value));

  for (let i = 0; i < protectedTexts.length; i += BATCH_SIZE) {
    const batch = protectedTexts.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((b) => b.text);

    console.log(`    Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(protectedTexts.length / BATCH_SIZE)}...`);

    const translated = await translateBatch(batchTexts, targetLang);

    // Restore variables
    for (let j = 0; j < translated.length; j++) {
      const restored = restoreVariables(translated[j], batch[j].vars);
      translatedStrings.push(restored);
    }

    // Small delay to avoid rate limiting
    if (i + BATCH_SIZE < protectedTexts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return translatedStrings;
}

/**
 * Main execution
 */
async function main() {
  console.log("🌐 Azure Translator - LabourLine Translation Generator\n");

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
