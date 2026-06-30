import test from "node:test";
import assert from "node:assert/strict";

import { getSupabaseAuthErrorMessage } from "../../../lib/supabase/auth-errors.ts";

test("maps common Supabase auth failures to user-friendly messages", () => {
  assert.equal(
    getSupabaseAuthErrorMessage({ message: "Invalid login credentials" }),
    "The email or password you entered is incorrect."
  );

  assert.equal(
    getSupabaseAuthErrorMessage({ message: "User already registered" }),
    "An account with this email already exists. Sign in instead or reset your password."
  );
});

test("falls back to a default message when Supabase returns an empty object payload", () => {
  assert.equal(
    getSupabaseAuthErrorMessage({}),
    "We couldn't complete that request. Please try again."
  );
});
