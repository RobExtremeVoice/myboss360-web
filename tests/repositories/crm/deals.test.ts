import test from "node:test";
import assert from "node:assert/strict";

import { createDealsRepository } from "../../../repositories/crm/deals.ts";

type RecordedCall = [method: string, ...args: unknown[]];

class QueryBuilder {
  calls: RecordedCall[];
  response: { data: unknown; error: unknown };

  constructor(calls: RecordedCall[], response: { data: unknown; error: unknown }) {
    this.calls = calls;
    this.response = response;
  }

  select(value: string) {
    this.calls.push(["select", value]);
    return this;
  }

  eq(column: string, value: unknown) {
    this.calls.push(["eq", column, value]);
    return this;
  }

  is(column: string, value: unknown) {
    this.calls.push(["is", column, value]);
    return this;
  }

  or(value: string) {
    this.calls.push(["or", value]);
    return this;
  }

  order(column: string, options?: Record<string, unknown>) {
    this.calls.push(["order", column, options ?? null]);
    return this;
  }

  limit(value: number) {
    this.calls.push(["limit", value]);
    return this;
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(this.response).then(onfulfilled, onrejected);
  }
}

function createMockDb(calls: RecordedCall[], data: unknown) {
  return {
    from(table: string) {
      calls.push(["from", table]);
      return new QueryBuilder(calls, { data, error: null });
    },
  };
}

test("deals repository applies workspace, stage, query, and limit filters", async () => {
  const calls: RecordedCall[] = [];
  const db = createMockDb(calls, [{ id: "deal-1" }]);
  const repository = createDealsRepository(db as never);

  const deals = await repository.listFiltered("workspace-9", {
    query: "renewal",
    stage: "proposal",
    limit: 3,
  });

  assert.deepEqual(deals, [{ id: "deal-1" }]);
  assert.deepEqual(calls, [
    ["from", "deals"],
    ["select", "*"],
    ["eq", "workspace_id", "workspace-9"],
    ["is", "deleted_at", null],
    ["eq", "stage", "proposal"],
    ["or", "title.ilike.%renewal%,notes.ilike.%renewal%"],
    ["order", "value", { ascending: false, nullsFirst: false }],
    ["limit", 3],
  ]);
});
