import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../../services/ai/prompt-builder'
import type { IntelligenceContext } from '../../../types/intelligence'

function makeContext(overrides: Partial<IntelligenceContext> = {}): IntelligenceContext {
  const base: IntelligenceContext = {
    workspaceId: 'ws-test-001',
    organizationId: 'org-test-001',
    executiveMetrics: {
      totalPipelineValue: 250_000,
      activeDeals: 12,
      atRiskDealsCount: 3,
      avgDealAgedays: 28,
      closedWonThisMonth: 2,
      closedWonValueThisMonth: 80_000,
      overdueTasksCount: 5,
      atRiskProjectsCount: 1,
      upcomingMeetingsCount: 4,
    },
    topRisks: [
      {
        id: 'r1',
        level: 'high',
        title: 'Q3 deal stalled',
        description: 'Enterprise deal has no activity in 14 days.',
        relatedEntityId: 'deal-1',
        relatedEntityType: 'deal',
        createdAt: new Date().toISOString(),
      },
    ],
    topOpportunities: [],
    activeRecommendations: [],
    recentMemories: [],
    todayAgenda: [],
    importantTasks: [],
    recentSignals: [],
    learningSignals: [],
    emailIntelligence: {
      criticalThreads: [],
      highPriorityThreads: [],
      awaitingReplies: [],
      overdueFollowUps: [],
      dealRelatedThreads: [],
      topSenders: [],
      newRelationships: [],
    },
    peopleIntelligence: {
      topRelationships: [],
      staleRelationships: [],
      newRelationships: [],
      champions: [],
      decisionMakers: [],
      awaitingReply: [],
      needingFollowUp: [],
    },
    generatedAt: new Date().toISOString(),
  }
  return { ...base, ...overrides }
}

describe('buildSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildSystemPrompt({ context: makeContext() })
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('contains core identity instructions', () => {
    const prompt = buildSystemPrompt({ context: makeContext() })
    expect(prompt).toContain('MyBoss360 Executive AI')
  })

  it('contains executive metrics', () => {
    const prompt = buildSystemPrompt({ context: makeContext() })
    expect(prompt).toContain('250') // totalPipelineValue = $250K
    expect(prompt).toContain('12')  // activeDeals
    expect(prompt).toContain('5')   // overdueTasksCount
  })

  it('includes top risk title when risks are present', () => {
    const prompt = buildSystemPrompt({ context: makeContext() })
    expect(prompt).toContain('Q3 deal stalled')
  })

  it('includes user name when provided', () => {
    const prompt = buildSystemPrompt({ context: makeContext(), userFullName: 'Jane Smith' })
    expect(prompt).toContain('Jane Smith')
  })

  it('omits risk section when no risks', () => {
    const prompt = buildSystemPrompt({ context: makeContext({ topRisks: [] }) })
    expect(prompt).not.toContain('TOP RISKS')
  })

  it('includes closing instructions', () => {
    const prompt = buildSystemPrompt({ context: makeContext() })
    expect(prompt).toContain('INSTRUCTIONS')
    expect(prompt).toContain('direct and concise')
  })
})
