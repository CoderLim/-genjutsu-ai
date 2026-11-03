import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { GLOW_STICK_AI_MODE } from './constants';
import {
  assertGlowStickAiProviderBinding,
  GlowStickAiProviderBindingError,
  resolveGlowStickAiProviderTarget,
} from './provider';

test('glow-stick resolves to homepage objects-swap target', () => {
  const target = resolveGlowStickAiProviderTarget();
  const homepage = resolveGenjutsuProviderTarget(GLOW_STICK_AI_MODE);
  assert.equal(target.provider, homepage.provider);
  assert.equal(target.model, homepage.model);
});

test('glow-stick provider binding accepts homepage target only', () => {
  const expected = resolveGlowStickAiProviderTarget();
  assert.doesNotThrow(() =>
    assertGlowStickAiProviderBinding(expected.provider, expected.model)
  );
  assert.throws(
    () =>
      assertGlowStickAiProviderBinding(
        'seedance-wavespeed',
        'bytedance/seedance-2.5/video-edit'
      ),
    GlowStickAiProviderBindingError
  );
});
