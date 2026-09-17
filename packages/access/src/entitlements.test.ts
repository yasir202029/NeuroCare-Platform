import assert from "node:assert/strict";
import test from "node:test";
import { isEntitled, planEntitlements } from "./entitlements.js";
test("plan entitlements enforce white-label boundaries", () => {
  assert.equal(isEntitled("STARTER", "whiteLabel"), false);
  assert.equal(isEntitled("ENTERPRISE", "whiteLabel"), true);
  assert.equal(planEntitlements.STARTER.clinicians, 5);
});
