import assert from "node:assert/strict";
import test from "node:test";
import { scoreAq10, scoreAsrsPartA, scoreGad7, scorePhq9, scoreWsas } from "./scores.js";

test("PHQ-9 highlights any self-harm response even where the total is low", () => {
  const result = scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 1]);
  assert.equal(result.total, 1);
  assert.equal(result.selfHarmResponse, true);
  assert.equal(result.requiresClinicalReview, true);
});

test("GAD-7 uses the moderate review threshold", () => {
  assert.equal(scoreGad7([2, 2, 2, 2, 2, 0, 0]).requiresClinicalReview, true);
});

test("AQ-10 scores keyed agreement and disagreement responses", () => {
  assert.equal(scoreAq10([2, 1, 1, 1, 1, 1, 2, 2, 1, 2]).total, 10);
});

test("ASRS Part A applies item-specific shaded thresholds", () => {
  const result = scoreAsrsPartA([2, 2, 2, 3, 0, 0]);
  assert.equal(result.endorsedItems, 4);
  assert.equal(result.requiresClinicalReview, true);
});

test("WSAS validates response range", () => {
  assert.throws(() => scoreWsas([0, 0, 0, 0, 9]), /0 to 8/);
});
