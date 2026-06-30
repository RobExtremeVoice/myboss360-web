import type { AITool } from '@/types/ai'
import type { IntelligenceContext } from '@/types/intelligence'
import { systemInstructions } from '@/config/ai'

interface PromptBuilderInput {
  context: IntelligenceContext
  userFullName?: string | null
  tools?: AITool[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

// Builds the full system prompt for an LLM provider.
// Structured so real LLMs can reason over the context and call tools.
export function buildSystemPrompt(input: PromptBuilderInput): string {
  const { context, userFullName, tools } = input
  const m = context.executiveMetrics
  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const sections: string[] = []

  // Core instructions
  sections.push(systemInstructions)

  // Identity
  sections.push(`--- USER ---
Name: ${userFullName ?? 'Executive'}
Workspace ID: ${context.workspaceId}
Organization ID: ${context.organizationId}
Date: ${now}`)

  // Executive metrics
  sections.push(`--- EXECUTIVE METRICS ---
Pipeline value: ${formatCurrency(m.totalPipelineValue)}
Active deals: ${m.activeDeals}
At-risk deals: ${m.atRiskDealsCount}
Avg deal age: ${m.avgDealAgedays} days
Closed won this month: ${m.closedWonThisMonth} (${formatCurrency(m.closedWonValueThisMonth)})
Overdue tasks: ${m.overdueTasksCount}
At-risk projects: ${m.atRiskProjectsCount}
Upcoming meetings: ${m.upcomingMeetingsCount}`)

  // Top risks
  if (context.topRisks.length > 0) {
    const riskLines = context.topRisks
      .map((r, i) => `${i + 1}. [${r.level.toUpperCase()}] ${r.title}: ${r.description}`)
      .join('\n')
    sections.push(`--- TOP RISKS ---\n${riskLines}`)
  }

  // Top opportunities
  if (context.topOpportunities.length > 0) {
    const oppLines = context.topOpportunities
      .map((o, i) => `${i + 1}. ${o.title}: ${o.description}`)
      .join('\n')
    sections.push(`--- OPPORTUNITIES ---\n${oppLines}`)
  }

  // Active recommendations
  if (context.activeRecommendations.length > 0) {
    const recLines = context.activeRecommendations
      .slice(0, 5)
      .map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title}: ${r.description}`)
      .join('\n')
    sections.push(`--- ACTIVE RECOMMENDATIONS ---\n${recLines}`)
  }

  // Strategic memories
  if (context.recentMemories.length > 0) {
    const memLines = context.recentMemories
      .slice(0, 5)
      .map((m) => `• [${m.type}] ${m.title}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '…' : ''}`)
      .join('\n')
    sections.push(`--- STRATEGIC MEMORY ---\n${memLines}`)
  }

  // Today's agenda
  if (context.todayAgenda.length > 0) {
    const agendaLines = context.todayAgenda
      .map((a) => {
        const time = new Date(a.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        return `• ${time} — ${a.title}${a.location ? ` (${a.location})` : ''}`
      })
      .join('\n')
    sections.push(`--- TODAY'S AGENDA ---\n${agendaLines}`)
  }

  // Important tasks
  const overdueTasks = context.importantTasks.filter((t) => t.isOverdue)
  if (overdueTasks.length > 0) {
    const taskLines = overdueTasks
      .slice(0, 5)
      .map((t) => `• [${t.priority}] ${t.title}`)
      .join('\n')
    sections.push(`--- OVERDUE HIGH-PRIORITY TASKS ---\n${taskLines}`)
  }

  // Tool availability
  if (tools && tools.length > 0) {
    const toolList = tools.map((t) => `• ${t.name}: ${t.description}`).join('\n')
    sections.push(`--- AVAILABLE TOOLS ---\n${toolList}\n\nUse tools when the user requests specific actions (create task, update deal stage, etc.).`)
  }

  // Closing instruction
  sections.push(`--- INSTRUCTIONS ---
Answer using the business context above.
Be direct and concise.
Cite specific numbers when available.
Do not fabricate data not present in context.`)

  return sections.join('\n\n')
}

// Builds the minimal tool schema list for LLM function calling.
export function buildToolSchemas(): AITool[] {
  return [
    {
      name: 'getExecutiveContext',
      description: 'Fetch the full executive intelligence context for the current workspace.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'listDeals',
      description: 'List active deals, optionally filtered by stage.',
      parameters: {
        type: 'object',
        properties: {
          stage: { type: 'string', description: 'Pipeline stage filter (e.g. prospect, proposal, negotiation)' },
        },
      },
    },
    {
      name: 'listTasks',
      description: 'List tasks filtered by status or priority.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Task status filter' },
          priority: { type: 'string', description: 'Task priority filter' },
        },
      },
    },
    {
      name: 'summarizePipeline',
      description: 'Return a structured pipeline summary by stage, value, and risk.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'createTask',
      description: 'Create a new task in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          priority: { type: 'string', description: 'Priority: low, medium, high, or urgent' },
          dueDate: { type: 'string', description: 'ISO date string for due date' },
        },
        required: ['title'],
      },
    },
    {
      name: 'updateDealStage',
      description: 'Move a deal to a new pipeline stage.',
      parameters: {
        type: 'object',
        properties: {
          dealId: { type: 'string', description: 'UUID of the deal' },
          stage: { type: 'string', description: 'New stage: prospect, qualified, proposal, negotiation, closed_won, closed_lost' },
        },
        required: ['dealId', 'stage'],
      },
    },
    {
      name: 'createRecommendationFeedback',
      description: 'Accept, reject, or dismiss a pending recommendation.',
      parameters: {
        type: 'object',
        properties: {
          recommendationId: { type: 'string', description: 'UUID of the recommendation' },
          action: { type: 'string', description: 'accepted, rejected, or dismissed' },
        },
        required: ['recommendationId', 'action'],
      },
    },
  ]
}
