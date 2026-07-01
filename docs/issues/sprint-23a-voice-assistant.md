# Sprint 23A — Voice Assistant

**Milestone:** v1.5 Executive Voice  
**Sprint:** 23A  
**Total SP:** 20

---

## ISS-052 — Design voice assistant architecture and pipeline

**Labels:** `research`, `voice`, `ai`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P0

### Description

Architecture spike for the voice assistant. Evaluate STT/TTS providers, latency requirements, browser audio capture APIs, and wake word approaches. Produce an ADR and implementation plan.

### Acceptance Criteria

- [ ] Evaluated providers: STT (OpenAI Whisper, Deepgram, Google STT), TTS (OpenAI TTS-1, ElevenLabs, Google TTS), Wake word (Picovoice Porcupine, Snowboy)
- [ ] Latency budget breakdown: audio capture (0 ms) → STT (150 ms) → AI inference (300 ms) → TTS (150 ms) → audio playback = 600 ms total target
- [ ] Browser audio API: Web Audio API + MediaRecorder vs. Web Speech API (evaluate both)
- [ ] ADR written: `docs/architecture/voice-adr.md`
- [ ] Follow-up implementation issues created from ADR

### Dependencies

- [ ] None (research spike)

### Definition of Done

- [ ] ADR written and merged
- [ ] Provider selected with justification
- [ ] Implementation issues created for Sprint 23B and 23C

---

## ISS-053 — Implement intent classification system

**Labels:** `feature`, `voice`, `ai`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P0

### Description

Classify user voice input into one of three intent categories: knowledge query, action command, or dictation. Routing to the correct handler is based on intent classification.

### Acceptance Criteria

- [ ] Intent types: `knowledge_query`, `action_command`, `dictation`, `unknown`
- [ ] Classification uses AI (fast, < 50 ms latency via small model or rule-based heuristics first)
- [ ] Keyword rules (fast path): "create", "add", "schedule" → `action_command`; "what is", "tell me", "find" → `knowledge_query`; "note:", "remind me to..." → `dictation`
- [ ] Fallback to AI classification for ambiguous inputs
- [ ] `classifyIntent(transcript: string) → Intent` pure function
- [ ] Unit tests: 30 test inputs with expected classifications

### Dependencies

- [ ] ISS-052 (ADR defines classification approach)

### Definition of Done

- [ ] All 30 unit tests pass
- [ ] p95 classification latency < 100 ms

---

## ISS-054 — Build voice command handler

**Labels:** `feature`, `voice`, `ai`, `rag`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 7  
**Priority:** P0

### Description

Route classified intents to correct handlers. `knowledge_query` → RAG search + AI response; `action_command` → Workflow Engine or direct API; `dictation` → Knowledge Engine document.

### Acceptance Criteria

- [ ] `handleVoiceInput(transcript, intent, session)` dispatches to:
  - `knowledge_query` → hybrid search + AI response (same as chat, but via voice)
  - `action_command` → NLU extracts action type + params → API call or workflow trigger
  - `dictation` → creates `knowledge_documents` record with transcript as content
  - `unknown` → asks for clarification
- [ ] Action commands supported: `create task [title]`, `schedule meeting with [contact] at [time]`, `find deal [name]`, `set reminder [description] at [time]`
- [ ] Response always returns: `{ text: string, audio?: Blob }` (audio from TTS handler in Sprint 23C)

### Dependencies

- [ ] ISS-053 (intent), ISS-036 (RAG)

### Definition of Done

- [ ] "What is our pricing for enterprise?" → grounded RAG answer
- [ ] "Create task: follow up with Acme" → task created in workspace
- [ ] "Note: discussed discount with Acme, agreed 15%" → knowledge document created

---

## ISS-055 — Create voice session management

**Labels:** `feature`, `voice`, `medium-priority`, `sprint-23`, `v1.5`  
**Story Points:** 3  
**Priority:** P1

### Description

Persist voice conversation history so the executive can review what was discussed and what actions were taken.

### Acceptance Criteria

- [ ] `voice_sessions` table: `id`, `workspace_id`, `user_id`, `started_at`, `ended_at`
- [ ] `voice_turns` table: `id`, `session_id`, `transcript`, `intent`, `response_text`, `actions_taken JSONB`, `created_at`
- [ ] Session created on first voice input, ended after 5 minutes of silence
- [ ] Voice history visible at `/dashboard/voice/history`
- [ ] Sessions searchable by transcript content

### Dependencies

- [ ] ISS-054

### Definition of Done

- [ ] Voice conversation stored and viewable after session ends
- [ ] Actions taken (tasks created, etc.) listed per turn
