import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertLiveFaceSwapSequence,
  assertLiveFaceSwapSessionId,
  LIVE_FACE_SWAP_CREDITS,
  LIVE_FACE_SWAP_CREDITS_PER_SECOND,
  LIVE_FACE_SWAP_PROVIDER_COST_USD,
  LIVE_FACE_SWAP_SECONDS,
  LIVE_FACE_SWAP_MAX_CHUNKS,
  liveFaceSwapPaidUntil,
  calculateLiveFaceSwapSettlement,
} from './pricing';

test('Lucy live pricing matches 3.6 credits/second competitor benchmark', () => {
  assert.equal(LIVE_FACE_SWAP_SECONDS, 30);
  assert.equal(LIVE_FACE_SWAP_CREDITS_PER_SECOND, 3.6);
  assert.equal(LIVE_FACE_SWAP_CREDITS, 108);
  assert.equal(LIVE_FACE_SWAP_CREDITS * 2, 216); // 60s, two prepaid chunks
});

test('estimated upstream costs are separately budgeted at the conservative fal rate', () => {
  assert.equal(LIVE_FACE_SWAP_PROVIDER_COST_USD, 1.2);
  // This benchmark tariff is NOT the 1.7x generic cost-to-credits conversion.
  // Large credit packs may have no margin at a $0.04/s provider rate.
  assert.ok((108 * 39.99) / 3600 < LIVE_FACE_SWAP_PROVIDER_COST_USD);
});

test('billing chunk times advance without a fixed 30-second total cap', () => {
  const start = 1_800_000_000_000;
  assert.equal(liveFaceSwapPaidUntil(start, 0), start + 30_000);
  assert.equal(liveFaceSwapPaidUntil(start, 1), start + 60_000);
  assert.equal(liveFaceSwapPaidUntil(start, 9), start + 300_000);
});

test('session id rejects malicious or ambiguous paths', () => {
  assert.equal(
    assertLiveFaceSwapSessionId('9ca6b83c-171b-4450-8d1c-7b1352c7e3ca'),
    '9ca6b83c-171b-4450-8d1c-7b1352c7e3ca'
  );
  for (const value of ['', 'abc', '../admin', 'some:1', 'a'.repeat(100), 42]) {
    assert.throws(() => assertLiveFaceSwapSessionId(value));
  }
});

test('renewal sequence is positive and within safety ceiling', () => {
  assert.equal(assertLiveFaceSwapSequence(1), 1);
  assert.equal(assertLiveFaceSwapSequence(119), LIVE_FACE_SWAP_MAX_CHUNKS - 1);
  for (const value of [-1, 0, 1.5, '2', LIVE_FACE_SWAP_MAX_CHUNKS, NaN]) {
    assert.throws(() => assertLiveFaceSwapSequence(value));
  }
});

test('refunds unused prepaid credits at integer-second resolution', () => {
  const issuedAtMs = 1_800_000_000_000;
  const assertUsage = (milliseconds: number, reservedChunks: number, expected: {
    billedSeconds: number; chargedCredits: number; refundedCredits: number;
  }) => {
    const result = calculateLiveFaceSwapSettlement({
      issuedAtMs, endedAtMs: issuedAtMs + milliseconds, reservedChunks,
    });
    assert.equal(result.billedSeconds, expected.billedSeconds);
    assert.equal(result.chargedCredits, expected.chargedCredits);
    assert.equal(result.refundedCredits, expected.refundedCredits);
    assert.equal(result.reservedCredits, reservedChunks * 108);
    assert.equal(result.billingBasis, 'server-token-wallclock');
  };
  assertUsage(0, 1, { billedSeconds: 0, chargedCredits: 0, refundedCredits: 108 });
  assertUsage(1, 1, { billedSeconds: 1, chargedCredits: 4, refundedCredits: 104 });
  assertUsage(9_100, 1, { billedSeconds: 10, chargedCredits: 36, refundedCredits: 72 });
  assertUsage(30_000, 1, { billedSeconds: 30, chargedCredits: 108, refundedCredits: 0 });
  assertUsage(38_000, 2, { billedSeconds: 38, chargedCredits: 137, refundedCredits: 79 });
  assertUsage(59_990, 2, { billedSeconds: 60, chargedCredits: 216, refundedCredits: 0 });
});

test('flags duration beyond prepaid credits for manual reconciliation', () => {
  const result = calculateLiveFaceSwapSettlement({
    issuedAtMs: 1_800_000_000_000,
    endedAtMs: 1_800_000_050_000,
    reservedChunks: 1,
  });
  assert.equal(result.refundedCredits, 0);
  assert.equal(result.uncoveredCredits, 72);
});

test('rejects invalid or clock-reversed settlement inputs', () => {
  for (const params of [
    { issuedAtMs: 0, endedAtMs: 10, reservedChunks: 1 },
    { issuedAtMs: 1000, endedAtMs: 999, reservedChunks: 1 },
    { issuedAtMs: 1000, endedAtMs: 1000, reservedChunks: 0 },
    { issuedAtMs: 1000, endedAtMs: 1000, reservedChunks: 121 },
  ]) {
    assert.throws(() => calculateLiveFaceSwapSettlement(params));
  }
});
