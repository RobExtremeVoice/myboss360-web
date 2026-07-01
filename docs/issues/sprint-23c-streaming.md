# Sprint 23C — Streaming Pipeline

**Milestone:** v1.5 Executive Voice  
**Sprint:** 23C  
**Total SP:** 22

---

## ISS-060 — Build low-latency voice response pipeline

**Labels:** `feature`, `voice`, `ai`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 8  
**Priority:** P0

### Description

Build the end-to-end voice pipeline: STT result → intent classification → AI response (streaming) → TTS → audio playback. Optimize for < 800 ms total latency (p95).

### Acceptance Criteria

- [ ] Pipeline: `audioChunks → STT → classifyIntent → handleVoiceInput → AI stream → TTS chunks → audio playback`
- [ ] AI response starts streaming before complete (TTS begins on first sentence, not full response)
- [ ] TTS audio streamed to browser and played without buffering entire response
- [ ] Total latency target: p95 < 800 ms from end of speech to first audio output
- [ ] Latency breakdown logged per request: `{ stt_ms, classification_ms, ai_first_token_ms, tts_first_audio_ms, total_ms }`
- [ ] Abort: if user speaks while AI is responding, interrupt and re-process

### Dependencies

- [ ] ISS-057 (audio capture), ISS-054 (voice handler), ISS-061 (TTS)

### Definition of Done

- [ ] End-to-end voice query answered in < 800 ms (p95) measured in staging
- [ ] Mid-response interruption handled gracefully

---

## ISS-061 — Implement Text-to-Speech provider integration

**Labels:** `feature`, `voice`, `ai`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the TTS provider abstraction and implement the selected provider. Support streaming audio output to minimize time-to-first-audio.

### Acceptance Criteria

- [ ] `TtsProvider` interface: `synthesize(text: string, options: TtsOptions) → AsyncIterable<AudioChunk>`
- [ ] `TtsOptions`: `{ voice: string, speed: number, language: string }`
- [ ] Streaming: yields audio chunks as they are generated (not buffer entire audio)
- [ ] Voice selection: at minimum 2 voice options (executive can set preference in Settings)
- [ ] Language support: `en-US`, `pt-BR`
- [ ] Caching: short common responses cached to avoid repeated API calls

### Dependencies

- [ ] ISS-052 (provider selection from ADR)

### Definition of Done

- [ ] 100-word text synthesized to streaming audio
- [ ] First audio chunk delivered < 200 ms after request
- [ ] Caching: same text returned from cache on repeat call

---

## ISS-062 — Add streaming WebSocket connection for voice

**Labels:** `feature`, `voice`, `api`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the WebSocket endpoint that handles the full-duplex voice connection: receives audio chunks from the browser and streams AI audio back.

### Acceptance Criteria

- [ ] WebSocket endpoint: `ws://localhost:3000/api/voice/ws`
- [ ] Client → server messages: `{ type: 'audio_chunk', data: ArrayBuffer }` | `{ type: 'end_of_speech' }` | `{ type: 'abort' }`
- [ ] Server → client messages: `{ type: 'transcript', text, isFinal }` | `{ type: 'ai_chunk', text }` | `{ type: 'audio_chunk', data: ArrayBuffer }` | `{ type: 'done' }` | `{ type: 'error', message }`
- [ ] Connection authenticated via session cookie (same as HTTP)
- [ ] Connection auto-closes after 5 minutes of silence
- [ ] Max concurrent voice connections per workspace: 5

### Dependencies

- [ ] ISS-056 (STT), ISS-061 (TTS)

### Definition of Done

- [ ] WebSocket connection accepts audio and returns audio
- [ ] Authentication enforced (unauthenticated connections rejected)
- [ ] Connection limit enforced

---

## ISS-063 — Create voice conversation UI component

**Labels:** `feature`, `voice`, `ui`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 4  
**Priority:** P0

### Description

Build the VoiceAssistant UI component — a floating button that activates voice mode, shows transcription in real time, and plays AI audio responses.

### Acceptance Criteria

- [ ] Floating microphone button in bottom-right corner of dashboard
- [ ] States: idle (mic icon), listening (animated waveform), processing (spinner), speaking (audio wave)
- [ ] Real-time transcript shown as user speaks (partial results)
- [ ] AI response shown as text while audio plays
- [ ] "Stop speaking" button interrupts AI mid-response
- [ ] Keyboard shortcut: `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Win) activates voice mode
- [ ] Accessible: full keyboard control, screen reader announces state transitions

### Dependencies

- [ ] ISS-062 (WebSocket), ISS-060 (pipeline)

### Definition of Done

- [ ] Voice UI works end-to-end in Chrome and Firefox
- [ ] Keyboard shortcut activates voice mode
- [ ] State transitions announced to screen reader
