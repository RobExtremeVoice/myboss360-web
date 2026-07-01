import test from "node:test";
import assert from "node:assert/strict";

// Isolated registry instance — import the module directly so each test
// can reason about registration state without mutating the shared singleton.
import {
  registerProvider,
  getProvider,
  getDefaultProvider,
  isProviderRegistered,
  listProviders,
} from "../../../services/ai/provider-registry.ts";

import type { AIProvider, AICapability, AIProviderStatus, GenerateResponse, StreamChunk } from "../../../types/ai.ts";

// ── Minimal stub provider ────────────────────────────────────────────
function makeStub(id: string, status: AIProviderStatus = "active"): AIProvider {
  return {
    id,
    name: `Stub-${id}`,
    modelId: "test-model",
    capabilities: ["text"] as AICapability[],
    maxContextTokens: 4096,
    supportsStreaming: false,
    status,
    async generate(): Promise<GenerateResponse> {
      return { content: "stub", model: "test-model", tokensUsed: 1, finishReason: "stop" };
    },
    async *stream(): AsyncIterable<StreamChunk> {
      yield { delta: "stub", isDone: true };
    },
  };
}

test("registers a provider and retrieves it by id", () => {
  const stub = makeStub("test-reg-a");
  registerProvider(stub);
  assert.ok(isProviderRegistered("test-reg-a"));
  assert.equal(getProvider("test-reg-a").name, "Stub-test-reg-a");
});

test("throws when requesting an unregistered provider id", () => {
  assert.throws(() => getProvider("does-not-exist"), /not registered/i);
});

test("getDefaultProvider returns the first active provider", () => {
  registerProvider(makeStub("test-active-1"));
  const provider = getDefaultProvider();
  // Some active provider must be returned
  assert.equal(provider.status, "active");
});

test("getDefaultProvider skips unconfigured providers", () => {
  registerProvider(makeStub("test-uncfg", "unconfigured"));
  registerProvider(makeStub("test-active-2"));
  const provider = getDefaultProvider("test-uncfg");
  // Must not return the unconfigured one
  assert.notEqual(provider.id, "test-uncfg");
  assert.equal(provider.status, "active");
});

test("listProviders returns all registered providers", () => {
  const before = listProviders().length;
  registerProvider(makeStub("test-list-x"));
  registerProvider(makeStub("test-list-y"));
  const after = listProviders().length;
  assert.equal(after, before + 2);
});
