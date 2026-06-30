import test from "node:test";
import assert from "node:assert/strict";

import { shouldUseDevelopmentCrmFallback } from "../../../services/crm/runtime.ts";

test("enables CRM fallback only for empty non-production workspaces", () => {
  assert.equal(
    shouldUseDevelopmentCrmFallback({ hasLiveRecords: false, nodeEnv: "development" }),
    true
  );

  assert.equal(
    shouldUseDevelopmentCrmFallback({ hasLiveRecords: false, nodeEnv: "production" }),
    false
  );

  assert.equal(
    shouldUseDevelopmentCrmFallback({ hasLiveRecords: true, nodeEnv: "development" }),
    false
  );
});
