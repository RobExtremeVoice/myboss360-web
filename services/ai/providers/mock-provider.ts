import type { AICapability, AIProvider, AIProviderStatus, GenerateRequest, GenerateResponse, StreamChunk } from '@/types/ai'
import type { IntelligenceContext } from '@/types/intelligence'
import { formatCompactCurrency as formatCurrency } from '@/utils/formatters'

function buildMockResponse(userMessage: string, context?: IntelligenceContext): string {
  const msg = userMessage.toLowerCase()
  const m = context?.executiveMetrics
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Briefing / today / what should I focus on
  if (msg.match(/brief|today|focus|morning|status|summary/)) {
    if (m) {
      const risks = context?.topRisks ?? []
      const riskLine = risks.length > 0 ? `\n\nTop risk: ${risks[0].title} — ${risks[0].description}` : ''
      const tasks = context?.importantTasks?.filter((t) => t.isOverdue) ?? []
      const taskLine = tasks.length > 0 ? `\n\n${tasks.length} high-priority task${tasks.length > 1 ? 's are' : ' is'} overdue.` : ''
      const agenda = context?.todayAgenda ?? []
      const agendaLine = agenda.length > 0 ? `\n\nToday: ${agenda.map((a) => a.title).join(' · ')}` : ''
      return `Executive briefing — ${now}:\n\nPipeline: ${formatCurrency(m.totalPipelineValue)} across ${m.activeDeals} active deals. ${m.atRiskDealsCount > 0 ? `${m.atRiskDealsCount} at risk.` : 'No deals at immediate risk.'}${riskLine}${taskLine}${agendaLine}`
    }
    return `Executive briefing — ${now}:\n\nConnect a live LLM provider to receive AI-generated briefings grounded in real business data.`
  }

  // Pipeline / deals
  if (msg.match(/pipeline|deal|revenue|forecast|close|stage/)) {
    if (m) {
      return `Pipeline snapshot:\n\n• Total active value: ${formatCurrency(m.totalPipelineValue)}\n• Active deals: ${m.activeDeals}\n• At risk: ${m.atRiskDealsCount}\n• Avg deal age: ${m.avgDealAgedays} days\n• Closed won this month: ${m.closedWonThisMonth} deal${m.closedWonThisMonth !== 1 ? 's' : ''} (${formatCurrency(m.closedWonValueThisMonth)})\n\n${m.atRiskDealsCount > 0 ? `${m.atRiskDealsCount} deal${m.atRiskDealsCount > 1 ? 's require' : ' requires'} attention before the close date.` : 'Pipeline is healthy.'}`
    }
    return 'Pipeline data is loading. Configure a live LLM provider for real-time deal analysis.'
  }

  // Tasks / overdue
  if (msg.match(/task|overdue|todo|backlog|blocked|assign/)) {
    if (m) {
      const important = context?.importantTasks ?? []
      const overdueList = important.filter((t) => t.isOverdue).slice(0, 3)
      const listText = overdueList.length > 0
        ? '\n\nMost urgent overdue:\n' + overdueList.map((t) => `• ${t.title} (${t.priority})`).join('\n')
        : ''
      return `Task overview:\n\n• Overdue: ${m.overdueTasksCount}\n• At-risk projects: ${m.atRiskProjectsCount}${listText}\n\n${m.overdueTasksCount > 5 ? 'High overdue count indicates capacity pressure — consider reassigning or deferring lower-priority items.' : 'Task load is within normal range.'}`
    }
    return 'Task data is loading. Configure a live LLM provider for task recommendations.'
  }

  // Calendar / meetings / agenda
  if (msg.match(/calendar|meeting|agenda|schedule|today.*meet|next/)) {
    const agenda = context?.todayAgenda ?? []
    if (agenda.length > 0) {
      const list = agenda.map((a) => {
        const time = new Date(a.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        return `• ${time} — ${a.title}`
      }).join('\n')
      return `Today's calendar (${agenda.length} item${agenda.length !== 1 ? 's' : ''}):\n\n${list}`
    }
    return `No meetings scheduled for today. ${(context?.executiveMetrics?.upcomingMeetingsCount ?? 0) > 0 ? `You have ${context?.executiveMetrics?.upcomingMeetingsCount} upcoming meetings this week.` : ''}`
  }

  // Risks / problems
  if (msg.match(/risk|threat|danger|problem|issue|concern|warn/)) {
    const risks = context?.topRisks ?? []
    if (risks.length > 0) {
      const list = risks.map((r, i) => `${i + 1}. [${r.level.toUpperCase()}] ${r.title} — ${r.description}`).join('\n')
      return `Top risks detected:\n\n${list}\n\nAddress critical risks first. Accept or dismiss each one via the recommendations panel when resolved.`
    }
    return 'No critical risks detected at this time. The learning engine continues to monitor for patterns.'
  }

  // Opportunities
  if (msg.match(/opportunit|grow|upsell|cross|expand|potential/)) {
    const opps = context?.topOpportunities ?? []
    if (opps.length > 0) {
      const list = opps.map((o, i) => `${i + 1}. ${o.title} — ${o.description}`).join('\n')
      return `Identified opportunities:\n\n${list}`
    }
    return 'No specific opportunities have been flagged yet. Run a pipeline scan to surface follow-up and growth signals.'
  }

  // Recommendations
  if (msg.match(/recommend|suggest|advice|what.*should|action/)) {
    const recs = context?.activeRecommendations ?? []
    if (recs.length > 0) {
      const topRec = recs[0]
      return `Top recommendation: **${topRec.title}**\n\n${topRec.description}\n\nYou have ${recs.length} active recommendation${recs.length !== 1 ? 's' : ''}. Accept or dismiss them to keep the system calibrated.`
    }
    return 'No pending recommendations. The learning engine will surface actionable insights as signals accumulate.'
  }

  // Fallback — generic executive response
  const metrics = m
    ? `Pipeline: ${formatCurrency(m.totalPipelineValue)} · Deals: ${m.activeDeals} active · Tasks overdue: ${m.overdueTasksCount}`
    : 'Business context is loading.'

  return `I have your executive context loaded.\n\n${metrics}\n\nAsk me about your pipeline, tasks, risks, calendar, or recommendations. For AI-generated analysis and action suggestions, connect an LLM provider in settings.\n\n*This is MockProvider — responses are deterministic and data-driven, not generative.*`
}

export class MockProvider implements AIProvider {
  readonly id = 'mock'
  readonly name = 'Mock Provider'
  readonly modelId = 'mock-v1'
  readonly capabilities: AICapability[] = ['text']
  readonly maxContextTokens = 8000
  readonly supportsStreaming = false
  readonly status: AIProviderStatus = 'active'

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const lastUserMsg = [...request.messages].reverse().find((m) => m.role === 'user')
    const content = buildMockResponse(lastUserMsg?.content ?? '', request.context)
    return {
      content,
      model: this.modelId,
      tokensUsed: Math.ceil(content.length / 4),
      finishReason: 'stop',
    }
  }

  async *stream(request: GenerateRequest): AsyncIterable<StreamChunk> {
    const response = await this.generate(request)
    yield { delta: response.content, isDone: true, finishReason: 'stop' }
  }
}
