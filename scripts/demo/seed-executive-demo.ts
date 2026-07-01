#!/usr/bin/env bun
/**
 * seed-executive-demo.ts
 * Populates a workspace with realistic executive demo data.
 *
 * Usage:
 *   bun scripts/demo/seed-executive-demo.ts --workspace-id <uuid> --organization-id <uuid> [--user-id <uuid>]
 *
 * Prerequisites:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.
 *
 * All inserts bypass RLS using the service-role key.
 */

import { createClient } from "@supabase/supabase-js"

// ── CLI arg parser ─────────────────────────────────────────────────────────────
function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 ? process.argv[idx + 1] : undefined
}

const workspaceId = getArg("workspace-id")
const organizationId = getArg("organization-id")
const userId = getArg("user-id") ?? null

if (!workspaceId || !organizationId) {
  console.error("Usage: bun scripts/demo/seed-executive-demo.ts --workspace-id <uuid> --organization-id <uuid> [--user-id <uuid>]")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function now() {
  return new Date().toISOString()
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString()
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3_600_000).toISOString()
}

// ── Seed data definitions ─────────────────────────────────────────────────────

const companies = [
  { name: "Acme Corp", domain: "acme.com", industry: "SaaS", website: "https://acme.com" },
  { name: "Global Ventures", domain: "globalventures.io", industry: "Investment", website: "https://globalventures.io" },
  { name: "TechForward", domain: "techforward.ai", industry: "AI/ML", website: "https://techforward.ai" },
  { name: "Meridian Health", domain: "meridianhealth.com", industry: "Healthcare", website: "https://meridianhealth.com" },
  { name: "Northstar Capital", domain: "northstarcapital.com", industry: "Finance", website: "https://northstarcapital.com" },
]

const contactDefs = [
  { firstName: "Sarah", lastName: "Chen", email: "sarah.chen@acme.com", jobTitle: "VP of Product", companyIdx: 0 },
  { firstName: "Marcus", lastName: "Rivera", email: "m.rivera@globalventures.io", jobTitle: "Managing Partner", companyIdx: 1 },
  { firstName: "Priya", lastName: "Patel", email: "priya@techforward.ai", jobTitle: "CEO", companyIdx: 2 },
  { firstName: "James", lastName: "O'Brien", email: "jobrien@meridianhealth.com", jobTitle: "Chief Digital Officer", companyIdx: 3 },
  { firstName: "Elena", lastName: "Vasquez", email: "e.vasquez@northstarcapital.com", jobTitle: "Investment Director", companyIdx: 4 },
  { firstName: "David", lastName: "Kim", email: "dkim@acme.com", jobTitle: "Head of Partnerships", companyIdx: 0 },
]

const dealDefs = [
  { title: "Acme Corp — Platform License", stage: "proposal", value: 145000, contactIdx: 0 },
  { title: "Global Ventures — Series B Advisory", stage: "negotiation", value: 80000, contactIdx: 1 },
  { title: "TechForward — AI Integration", stage: "qualified", value: 220000, contactIdx: 2 },
  { title: "Meridian Health — Digital Transformation", stage: "prospect", value: 350000, contactIdx: 3 },
  { title: "Northstar — Portfolio Analytics", stage: "closed_won", value: 95000, contactIdx: 4 },
]

const taskDefs = [
  { title: "Prepare Q3 board presentation deck", priority: "urgent", status: "in_progress", dueDays: -1 },
  { title: "Follow up with TechForward on contract terms", priority: "high", status: "pending", dueDays: 0 },
  { title: "Review Global Ventures NDA", priority: "high", status: "pending", dueDays: 1 },
  { title: "Send product roadmap to Acme Corp", priority: "medium", status: "pending", dueDays: 2 },
  { title: "Quarterly OKR review with leadership team", priority: "medium", status: "pending", dueDays: 3 },
  { title: "Update CRM pipeline with latest deal stages", priority: "low", status: "pending", dueDays: 5 },
]

const meetingDefs = [
  { title: "Acme Corp — Quarterly Business Review", locationHint: "Zoom", hoursFromNow: 2 },
  { title: "Board Strategy Session", locationHint: "HQ Conference Room A", hoursFromNow: 5 },
  { title: "TechForward Demo Call", locationHint: "Google Meet", hoursFromNow: 26 },
  { title: "Northstar Capital — Portfolio Update", locationHint: "Zoom", hoursFromNow: 48 },
]

const memoryDefs = [
  {
    type: "decision",
    title: "Prioritize enterprise segment in Q3",
    content: "Board agreed to shift 70% of sales capacity toward enterprise accounts above $100K ACV. SMB self-serve remains on existing growth trajectory.",
    importance: "high",
  },
  {
    type: "observation",
    title: "TechForward CEO interested in strategic partnership",
    content: "Priya mentioned interest in co-selling arrangement during intro call. She wants an NDA before discussing integration details.",
    importance: "high",
  },
  {
    type: "meeting_summary",
    title: "Global Ventures Series B advisory kickoff",
    content: "Marcus confirmed a 6-month engagement starting next quarter. Key deliverables: market analysis, investor deck review, intro to 3 portfolio companies.",
    importance: "normal",
  },
  {
    type: "ai_insight",
    title: "Pipeline at risk — Q3 close rate below forecast",
    content: "Current close rate of 22% is 8pp below the 30% forecast needed to hit Q3 target. Two high-value deals in negotiation stage are 30+ days stalled.",
    importance: "critical",
  },
  {
    type: "user_preference",
    title: "Communication style preference",
    content: "Executive prefers concise briefings — bullet points over paragraphs. Limit daily standups to 10 minutes.",
    importance: "normal",
  },
  {
    type: "executive_note",
    title: "Competitor pricing intel — Meridian Health",
    content: "James mentioned they received a proposal from Veeva at 40% below our rate. Prepare competitive response emphasizing long-term ROI and implementation support.",
    importance: "high",
  },
]

const signalDefs = [
  {
    signalType: "deal_risk",
    severity: "critical",
    title: "TechForward deal stalled",
    description: "No activity on TechForward AI Integration deal in 18 days. Proposal sent on "+daysAgo(18).split("T")[0]+" has not been acknowledged.",
  },
  {
    signalType: "follow_up_delay",
    severity: "warning",
    title: "Global Ventures follow-up overdue",
    description: "Initial email to Marcus Rivera sent 7 days ago with no response. Second touchpoint recommended.",
  },
  {
    signalType: "customer_health",
    severity: "warning",
    title: "Meridian Health engagement dropping",
    description: "Contact frequency with Meridian Health down 60% vs previous quarter. Risk of losing opportunity to competitor.",
  },
  {
    signalType: "performance_trend",
    severity: "info",
    title: "Northstar Capital closed — case study opportunity",
    description: "Northstar Portfolio Analytics deal closed at $95K. High satisfaction score (9/10) makes this a strong reference candidate.",
  },
]

const recommendationDefs = [
  {
    type: "action",
    priority: "critical",
    title: "Re-engage TechForward before deal goes cold",
    description: "Send a personalized follow-up to Priya Patel with updated timeline and revised pricing. Offer a live demo of new integration features.",
    actionLabel: "Draft email",
  },
  {
    type: "warning",
    priority: "high",
    title: "Prepare competitive response for Meridian Health",
    description: "James O'Brien received a competing proposal at 40% lower price. Schedule a value-focused call within 48 hours.",
    actionLabel: "Schedule call",
  },
  {
    type: "opportunity",
    priority: "high",
    title: "Expand Acme Corp relationship to CS team",
    description: "Sarah Chen mentioned their CS team of 30 has no dedicated tool. Expansion opportunity estimated at $45K ARR.",
    actionLabel: "Explore upsell",
  },
  {
    type: "insight",
    priority: "medium",
    title: "Q3 close rate 8pp below forecast",
    description: "Two stalled deals represent $300K of the Q3 target. Recommend a pipeline review meeting with sales team this week.",
    actionLabel: "Schedule review",
  },
]

const knowledgeDocDefs = [
  {
    title: "Q3 Sales Playbook — Enterprise Segment",
    content: "This playbook covers the end-to-end sales process for enterprise accounts above $100K ACV. Includes qualification criteria, discovery questions, objection handling, and approval workflows.",
    category: "document",
    objectType: "document",
    status: "processed",
  },
  {
    title: "Competitive Analysis — Platform Comparison 2026",
    content: "Head-to-head comparison of our platform against top 5 competitors. Covers pricing, feature parity, integration ecosystem, and enterprise support. Last updated Q2 2026.",
    category: "document",
    objectType: "document",
    status: "processed",
  },
  {
    title: "Meridian Health — Account Brief",
    content: "James O'Brien leads digital transformation at Meridian Health (5,000 employees, 12 hospitals). Budget approval process requires two executive sign-offs. Decision timeline: Q3 close.",
    category: "note",
    objectType: "note",
    status: "processed",
  },
  {
    title: "Board Presentation — Q2 Review & Q3 Outlook",
    content: "Board presentation covering Q2 performance ($1.4M ARR), Q3 forecast ($1.9M ARR target), strategic initiatives, and headcount plan for H2 2026.",
    category: "document",
    objectType: "document",
    status: "processed",
  },
]

// ── Insert helpers ────────────────────────────────────────────────────────────

async function insert(table: string, rows: Record<string, unknown>[]): Promise<Array<{ id: string }>> {
  const { data, error } = await db.from(table).insert(rows).select()
  if (error) throw new Error(`[${table}] ${error.message}`)
  return (data ?? []) as unknown as Array<{ id: string }>
}

async function upsert(table: string, rows: Record<string, unknown>[], onConflict: string): Promise<Array<{ id: string }>> {
  const { data, error } = await db.from(table).upsert(rows, { onConflict }).select()
  if (error) throw new Error(`[${table}] ${error.message}`)
  return (data ?? []) as unknown as Array<{ id: string }>
}

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding executive demo data...")
  console.log(`   workspace: ${workspaceId}`)
  console.log(`   organization: ${organizationId}`)
  if (userId) console.log(`   user: ${userId}`)

  // 1. Companies
  console.log("\n📦 Inserting companies...")
  const companyRows = await upsert(
    "companies",
    companies.map((c) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      website: c.website,
      status: "active",
      created_at: daysAgo(90),
      updated_at: now(),
    })),
    "workspace_id,name"
  ) as Array<{ id: string }>
  console.log(`   ✓ ${companyRows.length} companies`)

  // 2. Contacts
  console.log("\n👥 Inserting contacts...")
  const contactRows = await upsert(
    "contacts",
    contactDefs.map((c) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      job_title: c.jobTitle,
      company_id: companyRows[c.companyIdx]?.id ?? null,
      status: "active",
      created_at: daysAgo(60),
      updated_at: now(),
    })),
    "workspace_id,email"
  ) as Array<{ id: string }>
  console.log(`   ✓ ${contactRows.length} contacts`)

  // 3. Deals
  console.log("\n💼 Inserting deals...")
  const dealRows = await upsert(
    "deals",
    dealDefs.map((d) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      title: d.title,
      stage: d.stage,
      value: d.value,
      contact_id: contactRows[d.contactIdx]?.id ?? null,
      company_id: companyRows[contactDefs[d.contactIdx]?.companyIdx ?? 0]?.id ?? null,
      status: d.stage === "closed_won" ? "closed_won" : "open",
      expected_close_date: d.stage === "closed_won" ? daysAgo(5) : daysFromNow(30),
      created_at: daysAgo(45),
      updated_at: daysAgo(2),
    })),
    "workspace_id,title"
  ) as Array<{ id: string }>
  console.log(`   ✓ ${dealRows.length} deals`)

  // 4. Tasks
  console.log("\n✅ Inserting tasks...")
  const taskRows = await insert(
    "tasks",
    taskDefs.map((t) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.dueDays < 0 ? daysAgo(Math.abs(t.dueDays)) : daysFromNow(t.dueDays),
      assigned_to: userId,
      created_at: daysAgo(7),
      updated_at: now(),
    }))
  ) as Array<{ id: string }>
  console.log(`   ✓ ${taskRows.length} tasks`)

  // 5. Calendar events
  console.log("\n📅 Inserting calendar events...")
  const eventRows = await insert(
    "calendar_events",
    meetingDefs.map((m) => ({
      workspace_id: workspaceId!,
      title: m.title,
      location: m.locationHint,
      start_at: hoursFromNow(m.hoursFromNow),
      end_at: hoursFromNow(m.hoursFromNow + 1),
      source: "manual",
      created_at: daysAgo(3),
      updated_at: now(),
    }))
  ) as Array<{ id: string }>
  console.log(`   ✓ ${eventRows.length} calendar events`)

  // 6. Memories
  console.log("\n🧠 Inserting memories...")
  const memoryRows = await insert(
    "memories",
    memoryDefs.map((m) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      user_id: userId,
      type: m.type,
      title: m.title,
      content: m.content,
      source: "manual",
      importance: m.importance,
      is_pinned: m.importance === "critical",
      created_by: userId,
      created_at: daysAgo(Math.floor(Math.random() * 14) + 1),
      updated_at: now(),
    }))
  ) as Array<{ id: string }>
  console.log(`   ✓ ${memoryRows.length} memories`)

  // 7. Learning signals
  console.log("\n⚡ Inserting learning signals...")
  const signalRows = await insert(
    "learning_signals",
    signalDefs.map((s) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      signal_type: s.signalType,
      severity: s.severity,
      title: s.title,
      description: s.description,
      entity_type: "deal",
      confidence: 0.85,
      data: {},
      metadata: {},
      detected_at: daysAgo(Math.floor(Math.random() * 3) + 1),
      created_at: daysAgo(2),
      updated_at: now(),
    }))
  ) as Array<{ id: string }>
  console.log(`   ✓ ${signalRows.length} learning signals`)

  // 8. Recommendations
  console.log("\n💡 Inserting recommendations...")
  const expiresAt = daysFromNow(7)
  const recRows = await insert(
    "recommendations",
    recommendationDefs.map((r) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      user_id: userId,
      type: r.type,
      priority: r.priority,
      title: r.title,
      description: r.description,
      action_label: r.actionLabel,
      status: "pending",
      expires_at: expiresAt,
      created_at: daysAgo(1),
      updated_at: now(),
    }))
  ) as Array<{ id: string }>
  console.log(`   ✓ ${recRows.length} recommendations`)

  // 9. Knowledge documents
  console.log("\n📚 Inserting knowledge documents...")
  const docRows = await insert(
    "knowledge_documents",
    knowledgeDocDefs.map((d) => ({
      workspace_id: workspaceId!,
      organization_id: organizationId!,
      title: d.title,
      content: d.content,
      category: d.category,
      object_type: d.objectType,
      status: d.status,
      version: 1,
      word_count: Math.round(d.content.split(/\s+/).length),
      metadata: {},
      created_by: userId,
      created_at: daysAgo(Math.floor(Math.random() * 30) + 1),
      updated_at: daysAgo(Math.floor(Math.random() * 3)),
    }))
  ) as Array<{ id: string }>
  console.log(`   ✓ ${docRows.length} knowledge documents`)

  console.log("\n✅ Demo seed complete!")
  console.log("   Companies:", companyRows.length)
  console.log("   Contacts:", contactRows.length)
  console.log("   Deals:", dealRows.length)
  console.log("   Tasks:", taskRows.length)
  console.log("   Calendar events:", eventRows.length)
  console.log("   Memories:", memoryRows.length)
  console.log("   Learning signals:", signalRows.length)
  console.log("   Recommendations:", recRows.length)
  console.log("   Knowledge docs:", docRows.length)
  console.log("\n   Visit /dashboard to see the data.")
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message ?? err)
  process.exit(1)
})
