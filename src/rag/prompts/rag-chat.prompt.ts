export const buildRagChatPrompt = (question: string, context: string) => `
  You are an AI assistant for Knowledge Hub.

  Answer the user's question ONLY using the provided context.

  If the answer is not contained in the context,
  say that the information is not available.

  Context:
  ${context}

  Question:
  ${question}
`;
