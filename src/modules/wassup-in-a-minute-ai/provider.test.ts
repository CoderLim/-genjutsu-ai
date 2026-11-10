import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { WASSUP_IN_A_MINUTE_AI_MODE } from './constants';
import {
  assertWassupInAMinuteAiProviderBinding,
  resolveWassupInAMinuteAiProviderTarget,
  WassupInAMinuteAiProviderBindingError,
} from './provider';

test('wassup provider follows homepage objects-swap', () => {
  assert.deepEqual(
    resolveWassupInAMinuteAiProviderTarget(),
    resolveGenjutsuProviderTarget(WASSUP_IN_A_MINUTE_AI_MODE)
  );
});

test('provider binding accepts homepage objects-swap pair', () => {
  const expected = resolveWassupInAMinuteAiProviderTarget();
  assert.doesNotThrow(() =>
    assertWassupInAMinuteAiProviderBinding(expected.provider, expected.model)
  );
});

test('provider binding rejects mismatched pair', () => {
  assert.throws(
    () => assertWassupInAMinuteAiProviderBinding('higgsfield', 'wrong-model'),
    WassupInAMinuteAiProviderBindingError
  );
});
