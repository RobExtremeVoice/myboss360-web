import test from "node:test";
import assert from "node:assert/strict";

import { buildSystemPrompt } from "../../../services/ai/prompt-builder.ts";
import type { IntelligenceContext } from "../../../types/intelligence.ts";

// ── Minimal IntelligenceContext fixture ──────────────────────────────
function makeContext(overrides: Partial<IntelligenceContext> = {}): IntelligenceContext {
  const base: IntelligenceContext = {
    workspaceId: "ws-test-001",
    organizationId: "org-test-001",
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
        id: "r1",
        level: "high",
        title: "Q3 deal stalled",
        description: "Enterprise deal has no activity in 14 days.",
        relatedEntityId: "deal-1",
        relatedEntityType: "deal",
        createdAt: new Date().toISOString(),
      },
    ],
    topOpportunities: [],
    activeRecommendations: [],
    recentMemories: [],
    todayAgenda: [],
    importantTasks: [],
    recentSignals: [],
    generatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

// ── Tests ─────────────────────────────────────────────────────────────
test("buildSystemPrompt returns a non-empty string", () => {
  const prompt = buildSystemPrompt({ context: makeContext() });
  assert.ok(typeof prompt === "string");
  assert.ok(prompt.length > 100);
});

test("prompt contains core identity instructions", () => {
  const prompt = buildSystemPrompt({ context: makeContext() });
  assert.ok(prompt.includes("MyBoss360 Executive AI"));
});

test("prompt contains executive metrics", () => {
  const prompt = buildSystemPrompt({ context: makeContext() });
  assert.ok(prompt.includes("250"));  // totalPipelineValue = $250K
  assert.ok(prompt.includes("12"));   // activeDeals
  assert.ok(prompt.includes("5"));    // overdueTasksCount
});

test("prompt includes top risk title when risks are present", () => {
  const ctx = makeContext();
  const prompt = buildSystemPrompt({ context: ctx });
  assert.ok(prompt.includes("Q3 deal stalled"));
});

test("prompt includes user name when provided", () => {
  const ctx = makeContext();
  const prompt = buildSystemPrompt({ context: ctx, userFullName: "Jane Smith" });
  assert.ok(prompt.includes("Jane Smith"));
});

test("prompt omits risk section when no risks", () => {
  const ctx = makeContext({ topRisks: [] });
  const prompt = buildSystemPrompt({ context: ctx });
  assert.ok(!prompt.includes("TOP RISKS"));
});

test("prompt includes closing instructions", () => {
  const prompt = buildSystemPrompt({ context: makeContext() });
  assert.ok(prompt.includes("INSTRUCTIONS"));
  assert.ok(prompt.includes("direct and concise"));
});
