import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertGlowStickAiInputs,
  GlowStickAiPreflightError,
  isAllowedGlowStickAiPrompt,
} from './assert';
import {
  GLOW_STICK_AI_ASPECT_RATIO,
  GLOW_STICK_AI_DEFAULT_PROMPT,
  GLOW_STICK_AI_MODE,
  GLOW_STICK_AI_PRODUCT_ID,
} from './constants';

const baseFull = {
  product: GLOW_STICK_AI_PRODUCT_ID,
  mode: GLOW_STICK_AI_MODE,
  prompt: GLOW_STICK_AI_DEFAULT_PROMPT,
  aspectRatio: GLOW_STICK_AI_ASPECT_RATIO,
  resolution: '480p' as const,
  useDefaultTemplate: true,
  imageKeys: ['a', 'b', 'c'],
  contentTypes: ['image/jpeg', 'image/jpeg', 'image/jpeg'],
  contentLengths: [1, 1, 1],
};

test('allows the fixed glow-stick prompt', () => {
  assert.equal(isAllowedGlowStickAiPrompt(GLOW_STICK_AI_DEFAULT_PROMPT), true);
  assert.equal(isAllowedGlowStickAiPrompt('wrong'), false);
});

test('accepts full generation with three images + default template', () => {
  assert.doesNotThrow(() => assertGlowStickAiInputs(baseFull));
});

test('rejects wrong image count on full generation', () => {
  assert.throws(
    () =>
      assertGlowStickAiInputs({
        ...baseFull,
        imageKeys: ['a', 'b'],
        contentTypes: ['image/jpeg', 'image/jpeg'],
        contentLengths: [1, 1],
      }),
    GlowStickAiPreflightError
  );
});

test('accepts a 480p trimmed preview clip plus three images', () => {
  assert.doesNotThrow(() =>
    assertGlowStickAiInputs({
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
