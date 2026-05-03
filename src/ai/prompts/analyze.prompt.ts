export type AnalyzeTask = 'review' | 'bugs' | 'optimize' | 'explain';

export const buildAnalyzePrompt = (
  text: string,
  task: AnalyzeTask = 'review',
): string => {
  return `
    You are a senior software/content reviewer.

    Analyze the following text with focus on: ${task}.

    Return response in JSON format:

    {
      "analysis": "overall explanation",
      "suggestions": ["suggestion1", "suggestion2"],
      "severity": "info" | "warning" | "error"
    }

    Text:
    """${text}"""
  `;
};
