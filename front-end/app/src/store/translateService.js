import i18n from "../../../i18n";

const MYMEMORY_EMAIL = process.env.EXPO_PUBLIC_MYMEMORY_EMAIL;
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";

// In-memory cache for translations to avoid hitting API repeatedly
// Format: cache['targetLang']['originalText'] = 'translatedText'
const translationCache = {};

/**
 * Helper function to translate a single string using MyMemory API
 */
async function translateString(text, targetLang) {
  if (!text || !text.trim()) return text;

  // Initialize language cache if missing
  if (!translationCache[targetLang]) {
    translationCache[targetLang] = {};
  }

  // Check cache first
  if (translationCache[targetLang][text]) {
    return translationCache[targetLang][text];
  }

  let url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
  
  if (MYMEMORY_EMAIL) {
    url += `&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn("MyMemory API error:", response.status);
      return text; // Return original on error
    }

    const data = await response.json();
    if (data.responseStatus !== 200 && data.responseStatus !== "200") {
      console.warn("MyMemory API inner error:", data.responseDetails);
      return text;
    }

    const translatedText = data.responseData.translatedText;
    
    // Save to cache
    translationCache[targetLang][text] = translatedText;
    
    return translatedText;
  } catch (err) {
    console.warn("Translation failed, using original:", err.message);
    return text; // Return original on network error
  }
}

/**
 * Translate an array of texts to the currently selected language.
 * Skips translation if the current language is English.
 * @param {string[]} texts - Array of strings to translate
 * @returns {Promise<string[]>} - Translated strings (or originals if English)
 */
export async function translateTexts(texts) {
  const currentLang = i18n.language;

  // No translation needed for English
  if (!currentLang || currentLang === "en") {
    return texts;
  }

  try {
    const allTranslated = [];
    for (let i = 0; i < texts.length; i++) {
      const translated = await translateString(texts[i], currentLang);
      allTranslated.push(translated);
      
      // Add a 50ms delay between API calls to protect the free tier quota
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return allTranslated;
  } catch (error) {
    console.warn("Batch translation failed, using originals:", error.message);
    return texts;
  }
}

/**
 * Translate job fields (title, description, category) for an array of jobs.
 * @param {Array} jobs - Array of job objects from API
 * @returns {Promise<Array>} - Jobs with translated fields
 */
export async function translateJobs(jobs) {
  const currentLang = i18n.language;

  if (!currentLang || currentLang === "en" || jobs.length === 0) {
    return jobs;
  }

  // Collect all translatable texts from all jobs
  const textsToTranslate = [];
  const mapping = []; // tracks which text belongs to which job & field

  jobs.forEach((job, jobIndex) => {
    const fields = ["title", "description", "category", "skillsRequired"];
    fields.forEach((field) => {
      if (job[field] && job[field].trim()) {
        textsToTranslate.push(job[field]);
        mapping.push({ jobIndex, field });
      }
    });
  });

  if (textsToTranslate.length === 0) return jobs;

  try {
    // Execute translations sequentially with a tiny delay to prevent 429 Rate Limits
    const allTranslated = [];
    for (let i = 0; i < textsToTranslate.length; i++) {
      const text = textsToTranslate[i];
      const translated = await translateString(text, currentLang);
      allTranslated.push(translated);
      
      // Add a 50ms delay between API calls to protect the free tier quota
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Create translated copies of jobs
    const translatedJobs = jobs.map((job) => ({ ...job }));

    allTranslated.forEach((translatedText, i) => {
      const { jobIndex, field } = mapping[i];
      translatedJobs[jobIndex][field] = translatedText;
    });

    return translatedJobs;
  } catch (error) {
    console.warn("Job translation failed:", error.message);
    return jobs; // Return originals on error
  }
}
