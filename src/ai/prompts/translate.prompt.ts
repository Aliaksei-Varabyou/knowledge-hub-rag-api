export const buildTranslatePrompt = (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string => {
  return `
    You are a professional translator.

    Translate the following text into ${targetLanguage}.
    ${sourceLanguage ? `The original language is ${sourceLanguage}.` : ''}

    Text:
    """${text}"""

    Return:
    - translated text
    - detected source language

    Format:
    {
      "translatedText": "...",
      "detectedLanguage": "..."
    }
    Return ONLY valid JSON. No extra text.
  `;
};
