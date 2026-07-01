# Sprint 23B — Speech To Text

**Milestone:** v1.5 Executive Voice  
**Sprint:** 23B  
**Total SP:** 20

---

## ISS-056 — Implement Speech-to-Text provider integration

**Labels:** `feature`, `voice`, `ai`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the STT provider abstraction and implement the selected provider (from ISS-052 ADR). Support streaming transcription for real-time feedback.

### Acceptance Criteria

- [ ] `SttProvider` interface: `transcribe(audio: Blob, options: SttOptions) → Promise<TranscriptResult>`
- [ ] `streamTranscribe(audioStream, onPartial, onFinal)` for streaming mode
- [ ] Implementation for selected provider (Whisper or Deepgram)
- [ ] `TranscriptResult`: `{ text, confidence, words: WordTimestamp[], durationMs }`
- [ ] Languages supported: at minimum `en-US`, `pt-BR` (user preference)
- [ ] Error handling: no audio detected → `{ text: '', confidence: 0 }`

### Dependencies

- [ ] ISS-052 (provider selection from ADR)

### Definition of Done

- [ ] 10-second audio clip transcribed with accuracy ≥ 95%
- [ ] Streaming returns partial results < 200 ms after speech starts

---

## ISS-057 — Build real-time audio capture and streaming

**Labels:** `feature`, `voice`, `ui`, `high-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P0

### Description

Implement browser-side audio capture using the Web Audio API. Detect voice activity and send audio chunks to the STT provider in real time.

### Acceptance Criteria

- [ ] `useAudioCapture()` React hook: `{ start, stop, isRecording, audioLevel }`
- [ ] Voice activity detection (VAD): silence detection after 1.5 seconds stops recording
- [ ] Audio format: 16 kHz, mono, PCM16 (Whisper/Deepgram optimal)
- [ ] Audio chunks sent to `/api/voice/transcribe` every 100 ms for streaming
- [ ] Microphone permission request handled gracefully (clear error if denied)
- [ ] Visual indicator: audio level bar shows capture level in real time

### Dependencies

- [ ] ISS-056 (STT provider)

### Definition of Done

- [ ] Speak → audio captured and sent
- [ ] Silence → recording stops automatically
- [ ] Denied microphone → clear error message shown

---

## ISS-058 — Add STT result processing and normalization

**Labels:** `feature`, `voice`, `medium-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P1

### Description

Post-process raw STT transcripts: punctuation normalization, number formatting, filler word removal, and domain-specific entity correction.

### Acceptance Criteria

- [ ] Punctuation insertion for unpunctuated transcripts (lightweight rule-based, not ML)
- [ ] Number normalization: "ten thousand dollars" → "$10,000"
- [ ] Filler word removal: "um", "uh", "like", "you know" stripped from final transcript
- [ ] Domain corrections: common business terms retained verbatim (CRM, SaaS, KPI, etc.)
- [ ] `normalizeTranscript(raw: string) → string` pure function
- [ ] Unit tests: 15 test cases

### Dependencies

- [ ] ISS-056, ISS-057

### Definition of Done

- [ ] All 15 unit tests pass
- [ ] Normalized transcript cleaner than raw for business speech

---

## ISS-059 — Implement meeting transcription mode

**Labels:** `feature`, `voice`, `knowledge`, `medium-priority`, `sprint-23`, `v1.5`  
**Story Points:** 5  
**Priority:** P1

### Description

Long-form transcription mode for recording entire meetings. Stores the transcript as a `meeting_notes` document in the Knowledge Engine.

### Acceptance Criteria

- [ ] "Start meeting transcription" button in Executive Agenda meeting cards
- [ ] Audio captured continuously for up to 60 minutes
- [ ] Transcript saved in real time (every 30 seconds) to a draft `knowledge_document`
- [ ] Meeting ends → document published with: title (from meeting name), attendees, date, full transcript
- [ ] Speaker diarization: if provider supports it, label speakers as "Speaker 1", "Speaker 2"

### Dependencies

- [ ] ISS-058 (normalization), ISS-006 (meeting notes workflow)

### Definition of Done

- [ ] Record 5-minute meeting → knowledge document created with normalized transcript
- [ ] Draft saved during recording (no data loss on crash)
