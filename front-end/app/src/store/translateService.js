import i18n from "../../../i18n";

const AZURE_KEY = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_KEY;
const AZURE_REGION = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_REGION;
const AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

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

  // Filter out empty/null texts, keeping track of indices
  const validEntries = [];
  const results = [...texts];

  texts.forEach((text, index) => {
    if (text && text.trim()) {
      validEntries.push({ index, text });
    }
  });

  if (validEntries.length === 0) return results;

  try {
    const body = validEntries.map((e) => ({ Text: e.text }));

    const response = await fetch(
      `${AZURE_ENDPOINT}/translate?api-version=3.0&from=en&to=${currentLang}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
          "Ocp-Apim-Subscription-Region": AZURE_REGION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.warn("Azure Translate API error:", response.status);
      return results; // Return originals on error
    }

    const data = await response.json();

    // Map translated texts back to their original positions
    data.forEach((item, i) => {
      results[validEntries[i].index] = item.translations[0].text;
    });

    return results;
  } catch (error) {
    console.warn("Translation failed, using originals:", error.message);
    return results; // Return originals on network error
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

  // Collect all translatable texts from all jobs in one batch
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
    // Azure allows up to 100 texts per request, batch if needed
    const BATCH_SIZE = 50;
    const allTranslated = [];

    for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
      const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
      const body = batch.map((t) => ({ Text: t }));

      const response = await fetch(
        `${AZURE_ENDPOINT}/translate?api-version=3.0&from=en&to=${currentLang}`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": AZURE_KEY,
            "Ocp-Apim-Subscription-Region": AZURE_REGION,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        console.warn("Azure Translate API error:", response.status);
        return jobs; // Return originals on error
      }

      const data = await response.json();
      allTranslated.push(...data.map((d) => d.translations[0].text));
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
