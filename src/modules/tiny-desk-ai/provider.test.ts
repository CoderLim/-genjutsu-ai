import assert from 'node:assert/strict';
import test from 'node:test';

import { envConfigs } from '@/config';
import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { TINY_DESK_AI_MODE } from './constants';
import {
  assertTinyDeskAiProviderBinding,
  resolveTinyDeskAiProviderTarget,
  TinyDeskAiProviderBindingError,
} from './provider';

const originalProduct = envConfigs.genjutsu_product_provider;
const originalObjectSwap = envConfigs.genjutsu_object_swap_provider;

function restore() {
  envConfigs.genjutsu_product_provider = originalProduct;
  envConfigs.genjutsu_object_swap_provider = originalObjectSwap;
}

test('Tiny Desk resolves to homepage objects-swap target', () => {
  envConfigs.genjutsu_object_swap_provider = 'higgsfield';
  envConfigs.genjutsu_product_provider = 'seedance-wavespeed';
  try {
    const target = resolveTinyDeskAiProviderTarget();
    const homepage = resolveGenjutsuProviderTarget(TINY_DESK_AI_MODE);
    assert.deepEqual(target, homepage);
    assert.equal(target.provider, 'higgsfield');
  } finally {
    restore();
  }
});

test('GENJUTSU_PRODUCT_PROVIDER does not override Tiny Desk', () => {
  envConfigs.genjutsu_object_swap_provider = 'higgsfield';
  envConfigs.genjutsu_product_provider = 'seedance-higgsfield';
  try {
    assert.deepEqual(
      resolveTinyDeskAiProviderTarget(),
      resolveGenjutsuProviderTarget(TINY_DESK_AI_MODE)
    );
    assert.notEqual(
      resolveTinyDeskAiProviderTarget().provider,
      'seedance-higgsfield'
    );
  } finally {
    restore();
  }
});

test('Tiny Desk provider binding accepts homepage target only', () => {
  envConfigs.genjutsu_object_swap_provider = 'higgsfield';
  envConfigs.genjutsu_product_provider = '';
  try {
    const expected = resolveTinyDeskAiProviderTarget();
    assert.doesNotThrow(() =>
      assertTinyDeskAiProviderBinding(expected.provider, expected.model)
    );
    assert.throws(
      () =>
        assertTinyDeskAiProviderBinding(
          'seedance-wavespeed',
          'bytedance/seedance-2.5/video-edit'
        ),
      TinyDeskAiProviderBindingError
    );
    assert.throws(
      () =>
        assertTinyDeskAiProviderBinding(
          'seedance-higgsfield',
          'bytedance/seedance-2.5/reference-to-video'
        ),
      TinyDeskAiProviderBindingError
    );
  } finally {
    restore();
  }
});
