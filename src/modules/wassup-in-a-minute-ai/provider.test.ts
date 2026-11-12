import assert from 'node:assert/strict';
import test from 'node:test';

import { HIGGSFIELD_GENJUTSU_MODELS } from '@/modules/genjutsu/model-config';
import { WASSUP_IN_A_MINUTE_AI_MODE } from './constants';
import {
  assertWassupInAMinuteAiProviderBinding,
  WassupInAMinuteAiProviderBindingError,
  resolveWassupInAMinuteAiProviderTarget,
} from './provider';

test('wassup-in-a-minute-ai pins Genjutsu Standard independently of the homepage', () => {
  assert.deepEqual(resolveWassupInAMinuteAiProviderTarget(), {
    provider: 'higgsfield',
    model: HIGGSFIELD_GENJUTSU_MODELS.standard[WASSUP_IN_A_MINUTE_AI_MODE],
  });
});

test('wassup-in-a-minute-ai accepts current Standard and historical Light tasks', () => {
  assert.doesNotThrow(() =>
    assertWassupInAMinuteAiProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.light[WASSUP_IN_A_MINUTE_AI_MODE])
  );
  assert.doesNotThrow(() =>
    assertWassupInAMinuteAiProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.standard[WASSUP_IN_A_MINUTE_AI_MODE])
  );
});

test('wassup-in-a-minute-ai rejects unrelated providers and unknown models', () => {
  assert.throws(
    () => assertWassupInAMinuteAiProviderBinding('seedance-wavespeed', 'bytedance/seedance-2.5/video-edit'),
    WassupInAMinuteAiProviderBindingError
  );
  assert.throws(
    () => assertWassupInAMinuteAiProviderBinding('higgsfield', 'not-an-allowed-model'),
    WassupInAMinuteAiProviderBindingError
  );
});
