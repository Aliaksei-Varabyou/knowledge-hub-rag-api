export const buildRagChatPrompt = (
  question: string,
  context: string,
  conversationHistory?: string,
) => `
  You are an AI assistant for Knowledge Hub.

  Answer ONLY using the provided context.

  If the answer is not available in the context, say so clearly.

  Conversation history:
  ${conversationHistory ?? 'No previous conversation'}

  Context:
  ${context}

  Question:
  ${question}
`;
