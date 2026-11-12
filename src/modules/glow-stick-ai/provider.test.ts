import assert from 'node:assert/strict';
import test from 'node:test';

import { HIGGSFIELD_GENJUTSU_MODELS } from '@/modules/genjutsu/model-config';
import { GLOW_STICK_AI_MODE } from './constants';
import {
  assertGlowStickAiProviderBinding,
  GlowStickAiProviderBindingError,
  resolveGlowStickAiProviderTarget,
} from './provider';

test('glow-stick-ai pins Genjutsu Light independently of the homepage', () => {
  assert.deepEqual(resolveGlowStickAiProviderTarget(), {
    provider: 'higgsfield',
    model: HIGGSFIELD_GENJUTSU_MODELS.light[GLOW_STICK_AI_MODE],
  });
});

test('glow-stick-ai accepts persisted Light and historical Standard tasks', () => {
  assert.doesNotThrow(() =>
    assertGlowStickAiProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.light[GLOW_STICK_AI_MODE])
  );
  assert.doesNotThrow(() =>
    assertGlowStickAiProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.standard[GLOW_STICK_AI_MODE])
  );
});

test('glow-stick-ai rejects unrelated providers and unknown models', () => {
  assert.throws(
    () => assertGlowStickAiProviderBinding('seedance-wavespeed', 'bytedance/seedance-2.5/video-edit'),
    GlowStickAiProviderBindingError
  );
  assert.throws(
    () => assertGlowStickAiProviderBinding('higgsfield', 'not-an-allowed-model'),
    GlowStickAiProviderBindingError
  );
});
