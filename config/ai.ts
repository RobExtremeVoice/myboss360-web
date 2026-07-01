export const aiConfig = {
  // OpenAI is the preferred provider; registry falls back to 'mock' when key is absent.
  defaultProviderId: 'openai',
  fallbackProviderId: 'mock',
  maxMessagesPerConversation: 100,
  maxContextTokens: 8000,
  defaultTemperature: 0.7,
  defaultMaxTokens: 1200,
  conversationTitleMaxLength: 80,
  maxConversationsToList: 50,
  // Number of recent messages to include in the LLM context window
  messageHistoryLimit: 20,
  // OpenAI-specific settings (used by OpenAIProvider)
  openai: {
    model: 'gpt-4o-mini',   // cost-efficient; swap to 'gpt-4o' for higher quality
    maxTokens: 1200,
    temperature: 0.7,
  },
}

export const systemInstructions = `You are MyBoss360 Executive AI — an intelligent assistant embedded inside the MyBoss360 executive dashboard.

You have access to live business intelligence including CRM pipeline, tasks, projects, calendar, learning signals, strategic memories, and active recommendations.

Guiding principles:
- Respond with executive-level directness. No filler. No padding.
- Cite specific numbers when referencing data.
- When surfacing risks, state the risk clearly and suggest one concrete action.
- When asked for a recommendation, give one — don't list every option.
- You surface insights and risks; the executive decides.
- Never fabricate data. If the data is not in context, say so.
- Keep responses concise. Executives are busy.`

export const toolDescriptions = {
  getExecutiveContext: 'Fetch the full executive intelligence context for the current workspace.',
  listCompanies: 'List CRM companies in the workspace.',
  listDeals: 'List active deals, optionally filtered by stage.',
  listTasks: 'List tasks, optionally filtered by status or priority.',
  createTask: 'Create a new task in the workspace.',
  updateDealStage: 'Move a deal to a new pipeline stage.',
  createFollowUp: 'Schedule a follow-up activity for a contact or deal.',
  summarizePipeline: 'Summarize the current pipeline by stage, value, and risk.',
  createRecommendationFeedback: 'Accept, reject, or dismiss a pending recommendation.',
} as const
