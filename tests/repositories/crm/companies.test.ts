import test from "node:test";
import assert from "node:assert/strict";

import { createCompaniesRepository } from "../../../repositories/crm/companies.ts";

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

  order(column: string) {
    this.calls.push(["order", column]);
    return this;
  }

  update(value: Record<string, unknown>) {
    this.calls.push(["update", value]);
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

test("companies repository scopes list queries to workspace and non-deleted records", async () => {
  const calls: RecordedCall[] = [];
  const db = createMockDb(calls, [{ id: "company-1" }]);
  const repository = createCompaniesRepository(db as never);

  const companies = await repository.list("workspace-1");

  assert.deepEqual(companies, [{ id: "company-1" }]);
  assert.deepEqual(calls, [
    ["from", "companies"],
    ["select", "*"],
    ["eq", "workspace_id", "workspace-1"],
    ["is", "deleted_at", null],
    ["order", "name"],
  ]);
});

test("companies repository soft deletes by setting deleted_at", async () => {
  const calls: RecordedCall[] = [];
  const db = createMockDb(calls, null);
  const repository = createCompaniesRepository(db as never);

  await repository.softDelete("company-42");

  assert.equal(calls[0]?.[0], "from");
  assert.equal(calls[0]?.[1], "companies");
  assert.equal(calls[1]?.[0], "update");
  assert.equal(typeof (calls[1]?.[1] as { deleted_at?: unknown }).deleted_at, "string");
  assert.deepEqual(calls[2], ["eq", "id", "company-42"]);
});
