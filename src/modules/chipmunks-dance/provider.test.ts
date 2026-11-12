import assert from 'node:assert/strict';
import test from 'node:test';

import { HIGGSFIELD_GENJUTSU_MODELS } from '@/modules/genjutsu/model-config';
import { CHIPMUNKS_DANCE_MODE } from './constants';
import {
  assertChipmunksDanceProviderBinding,
  ChipmunksDanceProviderBindingError,
  resolveChipmunksDanceProviderTarget,
} from './provider';

test('chipmunks-dance pins Genjutsu Light independently of the homepage', () => {
  assert.deepEqual(resolveChipmunksDanceProviderTarget(), {
    provider: 'higgsfield',
    model: HIGGSFIELD_GENJUTSU_MODELS.light[CHIPMUNKS_DANCE_MODE],
  });
});

test('chipmunks-dance accepts persisted Light and historical Standard tasks', () => {
  assert.doesNotThrow(() =>
    assertChipmunksDanceProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.light[CHIPMUNKS_DANCE_MODE])
  );
  assert.doesNotThrow(() =>
    assertChipmunksDanceProviderBinding('higgsfield', HIGGSFIELD_GENJUTSU_MODELS.standard[CHIPMUNKS_DANCE_MODE])
  );
});

test('chipmunks-dance rejects unrelated providers and unknown models', () => {
  assert.throws(
    () => assertChipmunksDanceProviderBinding('seedance-wavespeed', 'bytedance/seedance-2.5/video-edit'),
    ChipmunksDanceProviderBindingError
  );
  assert.throws(
    () => assertChipmunksDanceProviderBinding('higgsfield', 'not-an-allowed-model'),
    ChipmunksDanceProviderBindingError
  );
});
