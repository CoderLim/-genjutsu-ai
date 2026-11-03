import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { CHIPMUNKS_DANCE_MODE } from './constants';
import {
  assertChipmunksDanceProviderBinding,
  ChipmunksDanceProviderBindingError,
  resolveChipmunksDanceProviderTarget,
} from './provider';

test('chipmunks-dance resolves to homepage objects-swap target', () => {
  const target = resolveChipmunksDanceProviderTarget();
  const homepage = resolveGenjutsuProviderTarget(CHIPMUNKS_DANCE_MODE);
  assert.equal(target.provider, homepage.provider);
  assert.equal(target.model, homepage.model);
});

test('chipmunks-dance provider binding accepts homepage target only', () => {
  const expected = resolveChipmunksDanceProviderTarget();
  assert.doesNotThrow(() =>
    assertChipmunksDanceProviderBinding(expected.provider, expected.model)
  );
  assert.throws(
    () =>
      assertChipmunksDanceProviderBinding(
        'seedance-wavespeed',
        'bytedance/seedance-2.5/video-edit'
      ),
    ChipmunksDanceProviderBindingError
  );
});
