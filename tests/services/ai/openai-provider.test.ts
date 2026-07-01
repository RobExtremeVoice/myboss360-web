import test from "node:test";
import assert from "node:assert/strict";

import { OpenAIProvider } from "../../../services/ai/providers/openai-provider.ts";

// ── Helper ───────────────────────────────────────────────────────────
function withEnv(key: string, value: string | undefined, fn: () => void) {
  const original = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  try {
    fn();
  } finally {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
}

// ── Tests ────────────────────────────────────────────────────────────
test("OpenAIProvider has correct static properties", () => {
  withEnv("OPENAI_API_KEY", undefined, () => {
    const provider = new OpenAIProvider();
    assert.equal(provider.id, "openai");
    assert.equal(provider.name, "OpenAI");
    assert.ok(provider.maxContextTokens >= 128_000);
    assert.ok(provider.capabilities.includes("text"));
  });
});

test("status is 'unconfigured' when OPENAI_API_KEY is absent", () => {
  withEnv("OPENAI_API_KEY", undefined, () => {
    const provider = new OpenAIProvider();
    assert.equal(provider.status, "unconfigured");
  });
});

test("status is 'active' when OPENAI_API_KEY is present", () => {
  withEnv("OPENAI_API_KEY", "sk-test-fake-key", () => {
    const provider = new OpenAIProvider();
    assert.equal(provider.status, "active");
  });
});

test("generate() rejects with a clear message when API key is missing", async () => {
  withEnv("OPENAI_API_KEY", undefined, () => {
    const provider = new OpenAIProvider();
    // generate() must throw — wrap in a promise catch inside the sync withEnv block
    const promise = provider.generate({
      systemPrompt: "test",
      messages: [{ role: "user", content: "hello" }],
    });

    // Store the rejected promise for assertion outside the sync scope
    (globalThis as Record<string, unknown>).__testPromise = promise;
  });

  await assert.rejects(
    (globalThis as Record<string, unknown>).__testPromise as Promise<unknown>,
    /OPENAI_API_KEY/i
  );
  delete (globalThis as Record<string, unknown>).__testPromise;
});

test("modelId matches the config default (gpt-4o-mini)", () => {
  withEnv("OPENAI_API_KEY", undefined, () => {
    const provider = new OpenAIProvider();
    assert.equal(provider.modelId, "gpt-4o-mini");
  });
});
