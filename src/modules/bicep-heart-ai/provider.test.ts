import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assertBicepHeartAiProviderBinding,
  BicepHeartAiProviderBindingError,
  resolveBicepHeartAiProviderTarget,
} from './provider';

test('resolveBicepHeartAiProviderTarget follows homepage objects-swap', () => {
  const target = resolveBicepHeartAiProviderTarget();
  assert.equal(typeof target.provider, 'string');
  assert.equal(typeof target.model, 'string');
  assert.ok(target.model.length > 0);
});

test('assertBicepHeartAiProviderBinding accepts current homepage target', () => {
  const expected = resolveBicepHeartAiProviderTarget();
  assert.doesNotThrow(() =>
    assertBicepHeartAiProviderBinding(expected.provider, expected.model)
  );
});

test('assertBicepHeartAiProviderBinding rejects mismatched model', () => {
  const expected = resolveBicepHeartAiProviderTarget();
  assert.throws(
    () =>
      assertBicepHeartAiProviderBinding(
        expected.provider,
        'not-the-right-model'
      ),
    BicepHeartAiProviderBindingError
  );
});
