import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitDealSignals, emitTaskSignals, emitProjectSignals } from '../../../services/intelligence/signal-engine'
import type { LearningService } from '../../../services/learning/learning-service'
import type { Database } from '../../../types/database'

const NOW = new Date('2024-07-01T12:00:00.000Z').getTime()

type DealRow = Database['public']['Tables']['deals']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

function makeLearningService(): { createLearningSignal: ReturnType<typeof vi.fn> } & LearningService {
  return {
    createLearningSignal: vi.fn().mockResolvedValue({ id: 'signal-1' }),
    listSignals: vi.fn().mockResolvedValue([]),
    resolveSignal: vi.fn().mockResolvedValue(undefined),
    listPatterns: vi.fn().mockResolvedValue([]),
    detectPatterns: vi.fn().mockResolvedValue([]),
    listRecommendations: vi.fn().mockResolvedValue([]),
    createRecommendation: vi.fn().mockResolvedValue({ id: 'rec-1' }),
    submitFeedback: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof makeLearningService>
}

function makeDeal(overrides: Partial<DealRow> = {}): DealRow {
  return {
    id: 'deal-1',
    workspace_id: 'ws-1',
    organization_id: 'org-1',
    title: 'Test Deal',
    stage: 'proposal',
    value: '10000',
    probability: 60,
    expected_close_date: null,
    company_id: null,
    contact_id: null,
    owner_id: null,
    description: null,
    metadata: null,
    deleted_at: null,
    created_at: new Date(NOW).toISOString(),
    updated_at: new Date(NOW).toISOString(),
    ...overrides,
  } as DealRow
}

function makeTask(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: 'task-1',
    workspace_id: 'ws-1',
    organization_id: 'org-1',
    title: 'Test Task',
    status: 'in-progress',
    priority: 'high',
    due_date: null,
    project_id: null,
    assignee_id: null,
    description: null,
    metadata: null,
    deleted_at: null,
    created_at: new Date(NOW).toISOString(),
    updated_at: new Date(NOW).toISOString(),
    ...overrides,
  } as TaskRow
}

function makeProject(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'project-1',
    workspace_id: 'ws-1',
    organization_id: 'org-1',
    name: 'Test Project',
    status: 'at-risk',
    priority: 'high',
    due_date: null,
    owner_id: null,
    description: null,
    metadata: null,
    deleted_at: null,
    created_at: new Date(NOW).toISOString(),
    updated_at: new Date(NOW).toISOString(),
    ...overrides,
  } as ProjectRow
}

describe('emitDealSignals', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns false for terminal deal stages', async () => {
    const ls = makeLearningService()
    const deal = makeDeal({ stage: 'closed_won' })
    const result = await emitDealSignals(deal, 'ws-1', 'org-1', ls)
    expect(result).toBe(false)
    expect(ls.createLearningSignal).not.toHaveBeenCalled()
  })

  it('returns false for closed_lost stage', async () => {
    const ls = makeLearningService()
    const deal = makeDeal({ stage: 'closed_lost' })
    expect(await emitDealSignals(deal, 'ws-1', 'org-1', ls)).toBe(false)
    expect(ls.createLearningSignal).not.toHaveBeenCalled()
  })

  it('returns false when no close date and probability is above threshold', async () => {
    const ls = makeLearningService()
    const deal = makeDeal({ expected_close_date: null, probability: 60 })
    expect(await emitDealSignals(deal, 'ws-1', 'org-1', ls)).toBe(false)
  })

  it('emits critical signal when close date is within 3 days', async () => {
    const ls = makeLearningService()
    const closeDate = new Date(NOW + 2 * 86_400_000).toISOString()
    const deal = makeDeal({ stage: 'proposal', expected_close_date: closeDate })
    const result = await emitDealSignals(deal, 'ws-1', 'org-1', ls)
    expect(result).toBe(true)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical', signalType: 'deal_risk' })
    )
  })

  it('emits warning signal when close date is 4-7 days out', async () => {
    const ls = makeLearningService()
    const closeDate = new Date(NOW + 5 * 86_400_000).toISOString()
    const deal = makeDeal({ stage: 'proposal', expected_close_date: closeDate })
    await emitDealSignals(deal, 'ws-1', 'org-1', ls)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning' })
    )
  })

  it('emits signal for late-stage deal with low probability', async () => {
    const ls = makeLearningService()
    const closeDate = new Date(NOW + 20 * 86_400_000).toISOString()
    const deal = makeDeal({
      stage: 'negotiation',
      expected_close_date: closeDate,
      probability: 20, // below threshold of 30
    })
    const result = await emitDealSignals(deal, 'ws-1', 'org-1', ls)
    expect(result).toBe(true)
  })
})

describe('emitTaskSignals', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns false for inactive task status', async () => {
    const ls = makeLearningService()
    const task = makeTask({ status: 'done', due_date: new Date(NOW - 2 * 86_400_000).toISOString() })
    expect(await emitTaskSignals(task, 'ws-1', 'org-1', ls)).toBe(false)
  })

  it('returns false when no due date', async () => {
    const ls = makeLearningService()
    const task = makeTask({ due_date: null })
    expect(await emitTaskSignals(task, 'ws-1', 'org-1', ls)).toBe(false)
  })

  it('returns false when due date is in the future', async () => {
    const ls = makeLearningService()
    const task = makeTask({ due_date: new Date(NOW + 2 * 86_400_000).toISOString() })
    expect(await emitTaskSignals(task, 'ws-1', 'org-1', ls)).toBe(false)
  })

  it('emits critical signal when task is 7+ days overdue', async () => {
    const ls = makeLearningService()
    const task = makeTask({ due_date: new Date(NOW - 8 * 86_400_000).toISOString() })
    await emitTaskSignals(task, 'ws-1', 'org-1', ls)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical', signalType: 'task_delay' })
    )
  })

  it('emits warning signal when 3-6 days overdue', async () => {
    const ls = makeLearningService()
    const task = makeTask({ due_date: new Date(NOW - 4 * 86_400_000).toISOString() })
    await emitTaskSignals(task, 'ws-1', 'org-1', ls)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning' })
    )
  })

  it('emits info signal when 1-2 days overdue', async () => {
    const ls = makeLearningService()
    const task = makeTask({ due_date: new Date(NOW - 2 * 86_400_000).toISOString() })
    await emitTaskSignals(task, 'ws-1', 'org-1', ls)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info' })
    )
  })

  it('handles all active task statuses', async () => {
    for (const status of ['todo', 'in-progress', 'blocked'] as const) {
      const ls = makeLearningService()
      const task = makeTask({ status, due_date: new Date(NOW - 2 * 86_400_000).toISOString() })
      expect(await emitTaskSignals(task, 'ws-1', 'org-1', ls)).toBe(true)
    }
  })
})

describe('emitProjectSignals', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns false for non-at-risk project', async () => {
    const ls = makeLearningService()
    const project = makeProject({ status: 'active' })
    expect(await emitProjectSignals(project, 'ws-1', 'org-1', ls)).toBe(false)
  })

  it('emits signal for at-risk project without due date', async () => {
    const ls = makeLearningService()
    const project = makeProject({ status: 'at-risk', due_date: null })
    const result = await emitProjectSignals(project, 'ws-1', 'org-1', ls)
    expect(result).toBe(true)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ signalType: 'recurring_bottleneck', severity: 'warning' })
    )
  })

  it('emits critical signal when due within 7 days', async () => {
    const ls = makeLearningService()
    const project = makeProject({
      status: 'at-risk',
      due_date: new Date(NOW + 3 * 86_400_000).toISOString(),
    })
    await emitProjectSignals(project, 'ws-1', 'org-1', ls)
    expect(ls.createLearningSignal).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical' })
    )
  })
})
