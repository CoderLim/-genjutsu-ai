import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertChipmunksDanceInputs,
  ChipmunksDancePreflightError,
  isAllowedChipmunksDancePrompt,
} from './assert';
import {
  CHIPMUNKS_DANCE_ASPECT_RATIO,
  CHIPMUNKS_DANCE_DEFAULT_PROMPT,
  CHIPMUNKS_DANCE_MODE,
  CHIPMUNKS_DANCE_PRODUCT_ID,
} from './constants';

const baseFull = {
  product: CHIPMUNKS_DANCE_PRODUCT_ID,
  mode: CHIPMUNKS_DANCE_MODE,
  prompt: CHIPMUNKS_DANCE_DEFAULT_PROMPT,
  aspectRatio: CHIPMUNKS_DANCE_ASPECT_RATIO,
  resolution: '480p' as const,
  useDefaultTemplate: true,
  imageKeys: ['a', 'b', 'c'],
  contentTypes: ['image/jpeg', 'image/jpeg', 'image/jpeg'],
  contentLengths: [1, 1, 1],
};

test('allows the fixed chipmunks-dance prompt', () => {
  assert.equal(
    isAllowedChipmunksDancePrompt(CHIPMUNKS_DANCE_DEFAULT_PROMPT),
    true
  );
  assert.equal(isAllowedChipmunksDancePrompt('wrong'), false);
});

test('accepts full generation with three images + default template', () => {
  assert.doesNotThrow(() => assertChipmunksDanceInputs(baseFull));
});

test('rejects wrong image count on full generation', () => {
  assert.throws(
    () =>
      assertChipmunksDanceInputs({
        ...baseFull,
        imageKeys: ['a', 'b'],
        contentTypes: ['image/jpeg', 'image/jpeg'],
        contentLengths: [1, 1],
      }),
    ChipmunksDancePreflightError
  );
});

test('accepts a 480p trimmed preview clip plus three images', () => {
  assert.doesNotThrow(() =>
    assertChipmunksDanceInputs({
      ...baseFull,
      useDefaultTemplate: false,
      preview: true,
      videoKey: 'user/video.mp4',
      imageKeys: ['a', 'b', 'c'],
      contentTypes: ['video/mp4', 'image/jpeg', 'image/jpeg', 'image/jpeg'],
      contentLengths: [1, 1, 1, 1],
    })
  );
});
