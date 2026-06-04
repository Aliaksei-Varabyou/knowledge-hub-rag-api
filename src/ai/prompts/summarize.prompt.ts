export type SummaryLength = 'short' | 'medium' | 'detailed';

export const buildSummarizePrompt = (
  text: string,
  maxLength: SummaryLength = 'medium',
): string => {
  const lengthInstruction = {
    short: 'in 1-2 sentenses',
    medium: 'in 1 paragraph',
    detailed: 'in detailed description',
  }[maxLength];

  return `
    You are an assistant that summarizes articles,
    Summarize the following text ${lengthInstruction},
    Focus on
    - key ideas,
    - main conclusions

    Text:
    """${text}"""

    Return only summary
  `;
};
