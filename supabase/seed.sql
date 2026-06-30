-- =============================================================================
-- MyBoss360 — Demo Seed Data
-- Organization: Extreme Results Technologies
-- =============================================================================
--
-- HOW TO RUN (after Supabase project is Active Healthy):
--   Step 1 — Run migrations first, in timestamp order:
--             20260629000000_initial_schema.sql
--             202606300001_fix_handle_new_user_security_definer.sql
--             Supabase dashboard → SQL Editor
--             OR: supabase db push  (if using the CLI with a linked project)
--
--   Step 2 — Create your user account via the /register page.
--
--   Step 3 — Get your user UUID from:
--             Supabase dashboard → Authentication → Users → copy the UUID
--
--   Step 4 — Replace the placeholder below with your real UUID,
--             then paste this entire file into the SQL Editor and Run.
--
--   IMPORTANT: Replace this value before running:
--   YOUR_USER_UUID = the UUID from Authentication > Users

-- =============================================================================
-- Fixed seed UUIDs (do not change — they are cross-referenced below)
-- =============================================================================

-- Org & workspace
-- org_id:        a0000000-0000-0000-0000-000000000001
-- workspace_id:  b0000000-0000-0000-0000-000000000001

-- Roles
-- role_admin_id: f0000000-0000-0000-0000-000000000001
-- role_memb_id:  f0000000-0000-0000-0000-000000000002

-- =============================================================================
-- 1. Organization
-- =============================================================================
INSERT INTO organizations (id, name, slug, plan) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Extreme Results Technologies', 'extreme-results', 'pro')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Workspace
-- =============================================================================
INSERT INTO workspaces (id, organization_id, name, slug, description) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Executive Workspace', 'executive',
   'Executive leadership workspace for strategic decisions and CRM')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. System Roles
-- =============================================================================
INSERT INTO roles (id, organization_id, name, description, is_system) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Admin',  'Full administrative access', true),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Member', 'Standard workspace access',  true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. Membership
-- Replace 'YOUR-USER-UUID-HERE' with your actual Supabase Auth user UUID.
-- =============================================================================

-- INSERT INTO memberships (user_id, organization_id, workspace_id, role_id, status, joined_at)
-- SELECT
--   'YOUR-USER-UUID-HERE',
--   'a0000000-0000-0000-0000-000000000001',
--   'b0000000-0000-0000-0000-000000000001',
--   'f0000000-0000-0000-0000-000000000001',
--   'active',
--   now()
-- WHERE NOT EXISTS (
--   SELECT 1
--   FROM memberships m
--   WHERE m.user_id = 'YOUR-USER-UUID-HERE'
--     AND m.organization_id = 'a0000000-0000-0000-0000-000000000001'
--     AND m.workspace_id = 'b0000000-0000-0000-0000-000000000001'
-- );

-- =============================================================================
-- 4A. Optional multi-user attachment pattern (safer + idempotent)
-- =============================================================================
--
-- Use this AFTER the users already exist in Supabase Auth.
-- Recommended flow:
--   1. Create or invite the users first.
--   2. Replace the example emails and names below.
--   3. Uncomment this full block and run it.
--
-- What this block does:
--   - resolves users from auth.users by email
--   - ensures profiles exist even if the auth trigger was skipped earlier
--   - updates existing memberships to the desired role/status
--   - inserts missing memberships only once
--
-- WITH seed_users AS (
--   SELECT *
--   FROM (
--     VALUES
--       ('ceo@extremeresults.com',      'Alex Morgan',   'Admin'),
--       ('ops@extremeresults.com',      'Taylor Brooks', 'Member'),
--       ('finance@extremeresults.com',  'Jordan Patel',  'Member'),
--       ('sales@extremeresults.com',    'Casey Nguyen',  'Member')
--   ) AS t(email, full_name, role_name)
-- ),
-- resolved_users AS (
--   SELECT
--     su.email,
--     su.full_name,
--     su.role_name,
--     au.id AS user_id
--   FROM seed_users su
--   JOIN auth.users au
--     ON lower(au.email) = lower(su.email)
-- ),
-- ensured_profiles AS (
--   INSERT INTO profiles (id, full_name)
--   SELECT
--     ru.user_id,
--     ru.full_name
--   FROM resolved_users ru
--   ON CONFLICT (id) DO UPDATE
--   SET full_name = COALESCE(profiles.full_name, EXCLUDED.full_name)
--   RETURNING id
-- ),
-- target_roles AS (
--   SELECT
--     ru.user_id,
--     ru.email,
--     ru.full_name,
--     r.id AS role_id
--   FROM resolved_users ru
--   JOIN roles r
--     ON r.organization_id = 'a0000000-0000-0000-0000-000000000001'
--    AND r.name = ru.role_name
-- ),
-- updated_memberships AS (
--   UPDATE memberships m
--   SET
--     role_id = tr.role_id,
--     status = 'active',
--     joined_at = COALESCE(m.joined_at, now()),
--     updated_at = now()
--   FROM target_roles tr
--   WHERE m.user_id = tr.user_id
--     AND m.organization_id = 'a0000000-0000-0000-0000-000000000001'
--     AND m.workspace_id = 'b0000000-0000-0000-0000-000000000001'
--   RETURNING m.user_id
-- )
-- INSERT INTO memberships (
--   user_id,
--   organization_id,
--   workspace_id,
--   role_id,
--   status,
--   joined_at
-- )
-- SELECT
--   tr.user_id,
--   'a0000000-0000-0000-0000-000000000001',
--   'b0000000-0000-0000-0000-000000000001',
--   tr.role_id,
--   'active',
--   now()
-- FROM target_roles tr
-- WHERE NOT EXISTS (
--   SELECT 1
--   FROM memberships m
--   WHERE m.user_id = tr.user_id
--     AND m.organization_id = 'a0000000-0000-0000-0000-000000000001'
--     AND m.workspace_id = 'b0000000-0000-0000-0000-000000000001'
-- );

-- =============================================================================
-- 5. Companies (10)
-- =============================================================================
INSERT INTO companies (id, workspace_id, name, domain, industry, size, website, phone) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Nexus Dynamics',          'nexusdynamics.com',      'SaaS',          'Enterprise',  'https://nexusdynamics.com',       '+1 (415) 555-0101'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Atlas Financial Group',   'atlasfinancial.com',     'Finance',       'Large',       'https://atlasfinancial.com',      '+1 (212) 555-0202'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Horizon Medical Systems', 'horizonmedical.com',     'Healthcare',    'Large',       'https://horizonmedical.com',      '+1 (312) 555-0303'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Pacific Consulting Group','pacificconsulting.com',  'Consulting',    'Mid-Market',  'https://pacificconsulting.com',   '+1 (206) 555-0404'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'GreenFuture Energy',      'greenfuture.io',         'Energy',        'Large',       'https://greenfuture.io',          '+1 (303) 555-0505'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Quantum Software Labs',   'quantumsoftware.dev',    'Technology',    'SMB',         'https://quantumsoftware.dev',     '+1 (512) 555-0606'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Sterling Properties',     'sterlingproperties.com', 'Real Estate',   'Mid-Market',  'https://sterlingproperties.com',  '+1 (702) 555-0707'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Meridian Global Trade',   'meridianglobal.com',     'Import/Export', 'Large',       'https://meridianglobal.com',      '+1 (305) 555-0808'),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'TechVision Analytics',    'techvision.ai',          'Technology',    'SMB',         'https://techvision.ai',           '+1 (617) 555-0909'),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'Apex Manufacturing',      'apexmfg.com',            'Manufacturing', 'Enterprise',  'https://apexmfg.com',             '+1 (313) 555-1010')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. Contacts (12)
-- =============================================================================
INSERT INTO contacts (id, workspace_id, company_id, first_name, last_name, email, phone, job_title) VALUES
  ('c7000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sarah',    'Chen',       's.chen@nexusdynamics.com',       '+1 (415) 555-1001', 'CEO'),
  ('c7000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Michelle', 'Dubois',     'm.dubois@nexusdynamics.com',     '+1 (415) 555-1002', 'VP Sales'),
  ('c7000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Marcus',   'Thompson',   'm.thompson@atlasfinancial.com',  '+1 (212) 555-2001', 'CFO'),
  ('c7000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Ahmad',    'Hassan',     'a.hassan@atlasfinancial.com',   '+1 (212) 555-2002', 'Director of M&A'),
  ('c7000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Amanda',   'Rodriguez',  'a.rodriguez@horizonmedical.com', '+1 (312) 555-3001', 'CTO'),
  ('c7000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'James',    'O''Brien',   'j.obrien@pacificconsulting.com', '+1 (206) 555-4001', 'Managing Director'),
  ('c7000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'Elena',    'Vasquez',    'e.vasquez@greenfuture.io',       '+1 (303) 555-5001', 'VP Operations'),
  ('c7000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'Kevin',    'Park',       'k.park@quantumsoftware.dev',    '+1 (512) 555-6001', 'Co-Founder & CTO'),
  ('c7000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'Rachel',   'Morrison',   'r.morrison@sterlingproperties.com', '+1 (702) 555-7001', 'Principal'),
  ('c7000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'David',    'Okafor',     'd.okafor@meridianglobal.com',   '+1 (305) 555-8001', 'Chief Commercial Officer'),
  ('c7000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'Lisa',     'Hartmann',   'l.hartmann@techvision.ai',       '+1 (617) 555-9001', 'Head of Product'),
  ('c7000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'Robert',   'Chen',       'r.chen@apexmfg.com',             '+1 (313) 555-0001', 'COO')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. Deals (8)
-- =============================================================================
INSERT INTO deals (id, workspace_id, company_id, contact_id, title, stage, value, currency, probability, expected_close_date) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', 'c7000000-0000-0000-0000-000000000001',
   'Nexus Dynamics — Enterprise License', 'proposal', 240000, 'USD', 65,
   (CURRENT_DATE + INTERVAL '45 days')::DATE),

  ('d1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002', 'c7000000-0000-0000-0000-000000000003',
   'Atlas Financial — Platform Migration', 'qualified', 185000, 'USD', 40,
   (CURRENT_DATE + INTERVAL '60 days')::DATE),

  ('d1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003', 'c7000000-0000-0000-0000-000000000005',
   'Horizon Medical — Data Intelligence Suite', 'negotiation', 320000, 'USD', 80,
   (CURRENT_DATE + INTERVAL '21 days')::DATE),

  ('d1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000004', 'c7000000-0000-0000-0000-000000000006',
   'Pacific Consulting — CRM Implementation', 'prospect', 95000, 'USD', 20,
   (CURRENT_DATE + INTERVAL '90 days')::DATE),

  ('d1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000005', 'c7000000-0000-0000-0000-000000000007',
   'GreenFuture — Analytics Platform', 'closed_won', 175000, 'USD', 100,
   (CURRENT_DATE - INTERVAL '14 days')::DATE),

  ('d1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000006', 'c7000000-0000-0000-0000-000000000008',
   'Quantum Software — API Integration', 'closed_won', 42000, 'USD', 100,
   (CURRENT_DATE - INTERVAL '30 days')::DATE),

  ('d1000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000009',
   'Sterling Properties — Management System', 'proposal', 78000, 'USD', 55,
   (CURRENT_DATE + INTERVAL '35 days')::DATE),

  ('d1000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000008', 'c7000000-0000-0000-0000-000000000010',
   'Meridian Global — ERP Upgrade', 'negotiation', 215000, 'USD', 75,
   (CURRENT_DATE + INTERVAL '28 days')::DATE)
ON CONFLICT (id) DO NOTHING;

-- Update closed deals without changing existing seed history on re-run
UPDATE deals
SET closed_at = COALESCE(closed_at, now() - INTERVAL '14 days')
WHERE id = 'd1000000-0000-0000-0000-000000000005';

UPDATE deals
SET closed_at = COALESCE(closed_at, now() - INTERVAL '30 days')
WHERE id = 'd1000000-0000-0000-0000-000000000006';

-- =============================================================================
-- 8. Activities (10)
-- =============================================================================
INSERT INTO activities (id, workspace_id, type, title, body, company_id, contact_id, deal_id, occurred_at) VALUES
  ('ac000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'call', 'Discovery call — Nexus Dynamics',
   'Discussed current pain points with legacy CRM. Sarah confirmed budget approved. Next step: technical demo with engineering team.',
   'c0000000-0000-0000-0000-000000000001', 'c7000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   now() - INTERVAL '3 days'),

  ('ac000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'email', 'Proposal sent — Nexus Dynamics',
   'Sent full proposal deck and pricing breakdown. Included ROI calculator showing 340% return in 18 months.',
   'c0000000-0000-0000-0000-000000000001', 'c7000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001',
   now() - INTERVAL '1 day'),

  ('ac000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'meeting', 'Contract negotiation — Horizon Medical',
   'Met in person at their Chicago HQ. Legal team raised HIPAA compliance requirements. Agreed to add BAA to contract. Closing imminent.',
   'c0000000-0000-0000-0000-000000000003', 'c7000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003',
   now() - INTERVAL '2 days'),

  ('ac000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'note', 'Internal note — Atlas Financial stalling',
   'Deal has been in qualified stage for 6 weeks. Marcus mentioned internal reorganization. Re-engage after Q3 budget cycle closes.',
   'c0000000-0000-0000-0000-000000000002', 'c7000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002',
   now() - INTERVAL '5 days'),

  ('ac000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
   'call', 'Win call — GreenFuture Energy',
   'Contract signed! Kickoff scheduled for next Monday. Implementation team onboarding starts week 2.',
   'c0000000-0000-0000-0000-000000000005', 'c7000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005',
   now() - INTERVAL '14 days'),

  ('ac000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001',
   'email', 'Follow-up — Sterling Properties',
   'Sent revised proposal with phased implementation option at 3 × $26K milestones. Awaiting feedback from their board.',
   'c0000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000007',
   now() - INTERVAL '1 day'),

  ('ac000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001',
   'meeting', 'Exec QBR — Meridian Global',
   'Quarterly business review with David and their VP Finance. Confirmed urgency of ERP modernisation before year-end audit.',
   'c0000000-0000-0000-0000-000000000008', 'c7000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000008',
   now() - INTERVAL '4 days'),

  ('ac000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001',
   'call', 'Intro call — Pacific Consulting',
   'Initial discovery. James mentioned they are evaluating 3 vendors. Timeline 90 days. Key differentiator: our AI executive reporting.',
   'c0000000-0000-0000-0000-000000000004', 'c7000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004',
   now() - INTERVAL '7 days'),

  ('ac000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001',
   'note', 'TechVision — upsell opportunity identified',
   'Lisa flagged that TechVision is expanding their data team from 4 to 14 analysts. Could upgrade from Starter to Pro tier ($35K ARR uplift).',
   'c0000000-0000-0000-0000-000000000009', 'c7000000-0000-0000-0000-000000000011', NULL,
   now() - INTERVAL '2 days'),

  ('ac000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001',
   'email', 'Case study request — Apex Manufacturing',
   'Sent GreenFuture case study as requested. Robert wants to share it with their board before committing to a demo.',
   'c0000000-0000-0000-0000-000000000010', 'c7000000-0000-0000-0000-000000000012', NULL,
   now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. Projects (4)
-- =============================================================================
INSERT INTO projects (id, workspace_id, name, description, status, priority, start_date, due_date) VALUES
  ('a9000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Q3 Product Launch', 'Ship the AI Executive Briefing feature and mobile app v2.',
   'active', 'critical',
   CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '45 days'),

  ('a9000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'Enterprise Sales Pipeline', 'Close 5 enterprise deals ($500K+ combined ARR) by end of Q3.',
   'active', 'high',
   CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '60 days'),

  ('a9000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'Infrastructure Migration', 'Migrate all services to the new cloud architecture for 99.99% uptime SLA.',
   'active', 'high',
   CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '75 days'),

  ('a9000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Annual Investor Report', 'Prepare and deliver the FY annual report to all Series B investors.',
   'active', 'medium',
   CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. Tasks (10)
-- =============================================================================
INSERT INTO tasks (id, workspace_id, project_id, title, description, status, priority, due_date) VALUES
  ('a7000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000001',
   'Finalize AI Briefing UI mockups', 'Approve final Figma designs with engineering before sprint kick-off.',
   'done', 'high', CURRENT_DATE - INTERVAL '7 days'),

  ('a7000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000001',
   'Write launch announcement blog post', 'Draft, review, and schedule the product launch post for the company blog.',
   'in_progress', 'medium', CURRENT_DATE + INTERVAL '14 days'),

  ('a7000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000001',
   'Set up launch day war room', 'Assign on-call rotation, monitoring dashboards, and escalation path.',
   'todo', 'high', CURRENT_DATE + INTERVAL '40 days'),

  ('a7000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000002',
   'Send Horizon Medical contract for legal review',
   'Route BAA and MSA to our outside counsel by Friday for a 5-day turnaround.',
   'in_progress', 'critical', CURRENT_DATE + INTERVAL '2 days'),

  ('a7000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000002',
   'Schedule Nexus Dynamics technical demo', 'Coordinate with their engineering team for a 90-minute deep-dive demo.',
   'todo', 'high', CURRENT_DATE + INTERVAL '7 days'),

  ('a7000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000002',
   'Update pipeline forecast model', 'Refresh the weighted pipeline spreadsheet with Q3 actuals and new deals.',
   'todo', 'medium', CURRENT_DATE + INTERVAL '3 days'),

  ('a7000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000003',
   'Complete database migration dry run', 'Run full production data migration in staging environment and verify checksums.',
   'in_progress', 'critical', CURRENT_DATE + INTERVAL '5 days'),

  ('a7000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000003',
   'Update DNS failover configuration', 'Configure Route 53 health checks and failover routing for all critical endpoints.',
   'todo', 'high', CURRENT_DATE + INTERVAL '21 days'),

  ('a7000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000004',
   'Compile Q2 financial statements', 'Work with finance to compile audited P&L, balance sheet, and cash flow statements.',
   'todo', 'high', CURRENT_DATE + INTERVAL '10 days'),

  ('a7000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000004',
   'Draft investor letter from CEO', 'CEO to review and sign off on the letter by end of next week.',
   'todo', 'medium', CURRENT_DATE + INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. Calendar Events (5)
-- =============================================================================
INSERT INTO calendar_events (id, workspace_id, title, description, location, start_at, end_at, all_day) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Q3 Board Meeting',
   'Quarterly board meeting covering revenue, product roadmap, and Series C readiness.',
   'HQ — Boardroom A, 12th Floor',
   (CURRENT_DATE + INTERVAL '7 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '14 hours',
   (CURRENT_DATE + INTERVAL '7 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '17 hours',
   false),

  ('ce000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'Horizon Medical — Contract Signing',
   'Final contract signing for the Data Intelligence Suite deal. Send DocuSign 24h before.',
   'Video Call — Zoom',
   (CURRENT_DATE + INTERVAL '14 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '15 hours',
   (CURRENT_DATE + INTERVAL '14 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '16 hours',
   false),

  ('ce000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'Weekly Executive Sync',
   'Standing weekly leadership sync: OKR review, blockers, and cross-team dependencies.',
   'HQ — Boardroom B',
   (CURRENT_DATE + INTERVAL '2 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '9 hours',
   (CURRENT_DATE + INTERVAL '2 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '10 hours',
   false),

  ('ce000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Q3 Product Launch — All Hands',
   'Company-wide all-hands for the Q3 product launch. Live demo, press Q&A, and team celebration.',
   'Main Office — Event Space',
   (CURRENT_DATE + INTERVAL '45 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '13 hours',
   (CURRENT_DATE + INTERVAL '45 days')::TIMESTAMP WITH TIME ZONE + INTERVAL '15 hours',
   false),

  ('ce000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
   'Infrastructure Migration Freeze Starts',
   'No deployments or schema changes allowed during the 72-hour migration window.',
   NULL,
   (CURRENT_DATE + INTERVAL '30 days')::TIMESTAMP WITH TIME ZONE,
   (CURRENT_DATE + INTERVAL '33 days')::TIMESTAMP WITH TIME ZONE,
   true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Done. Summary:
--   1 organization, 1 workspace, 2 roles
--   10 companies, 12 contacts
--   8 deals (6 active, 2 closed-won)
--   10 activities, 4 projects, 10 tasks, 5 calendar events
--
-- Next step:
--   - for one user: uncomment and run the single membership INSERT above
--   - for multiple users: uncomment and run section 4A after those users exist
--   - re-running this seed is safe: fixed IDs plus conflict handling prevent duplicates
-- =============================================================================
