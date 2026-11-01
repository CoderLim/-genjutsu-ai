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
