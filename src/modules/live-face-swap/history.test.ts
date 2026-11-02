import assert from 'node:assert/strict';
import test from 'node:test';

import { getLiveSessionHistory } from './history';

test('a settled live session has finalized duration and net credits', () => {
  const summary = getLiveSessionHistory({
    status: 'ended',
    taskInfo: JSON.stringify({ issuedAtMs: 1_000, endedAtMs: 39_000 }),
    taskResult: JSON.stringify({
      status: 'settled', billedSeconds: 38,
      reservedCredits: 216, chargedCredits: 137, refundedCredits: 79,
      billingBasis: 'server-token-wallclock',
    }),
  });
  assert.deepEqual(summary, {
    state: 'completed', billedSeconds: 38, finalCredits: 137,
    returnedCredits: 79, endedAtMs: 39_000,
  });
});

test('an open session cannot be claimed to be live or billed precisely', () => {
  const summary = getLiveSessionHistory({
    status: 'active',
    taskInfo: JSON.stringify({ issuedAtMs: 1_000 }),
    taskResult: null,
  });
  assert.equal(summary.state, 'unconfirmed');
  assert.equal(summary.finalCredits, null);
  assert.equal(summary.billedSeconds, null);
});

test('unfinished and uncertain session charges must not masquerade as final', () => {
  for (const status of ['charging', 'settling', 'refunding', 'paid', 'ended']) {
    const result = getLiveSessionHistory({
      status, taskInfo: null, taskResult: '{not-json',
    });
    assert.equal(result.state, 'review', status);
    assert.equal(result.finalCredits, null, status);
  }
});

test('no-token refunds or insufficient sessions show no charge', () => {
  for (const status of ['refunded', 'insufficient']) {
    const result = getLiveSessionHistory({
      status, taskInfo: null, taskResult: null,
    });
    assert.equal(result.state, 'not-started');
    assert.equal(result.finalCredits, 0);
    assert.equal(result.returnedCredits, null);
  }
});

test('a malformed final settlement never exposes incorrect charge', () => {
  for (const taskResult of [
    null,
    JSON.stringify({ status: 'settled', billedSeconds: -1, chargedCredits: 4, refundedCredits: 0 }),
    JSON.stringify({ status: 'settled', billedSeconds: 2, chargedCredits: '8', refundedCredits: 100 }),
  ]) {
    const history = getLiveSessionHistory({ status: 'ended', taskInfo: null, taskResult });
    assert.equal(history.state, 'review');
    assert.equal(history.finalCredits, null);
  }
});
