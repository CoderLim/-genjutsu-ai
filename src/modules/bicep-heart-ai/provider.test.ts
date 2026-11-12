import assert from 'node:assert/strict';
import test from 'node:test';

import { HIGGSFIELD_GENJUTSU_MODELS } from '@/modules/genjutsu/model-config';
import { BICEP_HEART_AI_MODE } from './constants';
import {
  assertBicepHeartAiProviderBinding,
  BicepHeartAiProviderBindingError,
  resolveBicepHeartAiProviderTarget,
} from './provider';

test('bicep-heart-ai pins Genjutsu Light independently of the homepage', () => {
  assert.deepEqual(resolveBicepHeartAiProviderTarget(), {
    provider: 'higgsfield',
    model: HIGGSFIELD_GENJUTSU_MODELS.light[BICEP_HEART_AI_MODE],
  });
});

test('bicep-heart-ai accepts persisted Light and historical Standard tasks', () => {
  assert.doesNotThrow(() =>
    assertBicepHeartAiProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.light[BICEP_HEART_AI_MODE])
  );
  assert.doesNotThrow(() =>
    assertBicepHeartAiProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.standard[BICEP_HEART_AI_MODE])
  );
});

test('bicep-heart-ai rejects unrelated providers and unknown models', () => {
  assert.throws(
    () => assertBicepHeartAiProviderBinding('seedance-wavespeed', 'bytedance/seedance-2.5/video-edit'),
    BicepHeartAiProviderBindingError
  );
  assert.throws(
    () => assertBicepHeartAiProviderBinding('higgsfield', 'not-an-allowed-model'),
    BicepHeartAiProviderBindingError
  );
});
