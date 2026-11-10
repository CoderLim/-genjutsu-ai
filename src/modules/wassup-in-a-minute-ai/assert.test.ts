import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assertWassupInAMinuteAiInputs,
  isAllowedWassupInAMinuteAiPrompt,
  WassupInAMinuteAiPreflightError,
} from './assert';
import {
  buildWassupInAMinuteAiPrompt,
  WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
  WASSUP_IN_A_MINUTE_AI_MODE,
  WASSUP_IN_A_MINUTE_AI_PRODUCT_ID,
} from './constants';

test('center-only prompt is allowed and matches one image', () => {
  const prompt = buildWassupInAMinuteAiPrompt(['center']);
  assert.equal(isAllowedWassupInAMinuteAiPrompt(prompt), true);
  assert.doesNotThrow(() =>
    assertWassupInAMinuteAiInputs({
      product: WASSUP_IN_A_MINUTE_AI_PRODUCT_ID,
      mode: WASSUP_IN_A_MINUTE_AI_MODE,
      prompt,
      aspectRatio: WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
      resolution: '480p',
      useDefaultTemplate: true,
      imageKeys: ['img1'],
      contentTypes: ['image/jpeg'],
      contentLengths: [100],
    })
  );
});

test('left+right sparse prompt matches two images', () => {
  const prompt = buildWassupInAMinuteAiPrompt(['left', 'right']);
  assert.match(prompt, /@Image1/);
  assert.match(prompt, /@Image2/);
  assert.match(prompt, /multiple camera cuts/i);
  assert.match(prompt, /Person A → @Image1/);
  assert.match(prompt, /Person C → @Image2/);
  assert.match(prompt, /Keep the original Person B unchanged/);
  assert.doesNotThrow(() =>
    assertWassupInAMinuteAiInputs({
      product: WASSUP_IN_A_MINUTE_AI_PRODUCT_ID,
      mode: WASSUP_IN_A_MINUTE_AI_MODE,
      prompt,
      aspectRatio: WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
      resolution: '720p',
      useDefaultTemplate: true,
      imageKeys: ['a', 'b'],
      contentTypes: ['image/png', 'image/png'],
      contentLengths: [10, 20],
    })
  );
});

test('full cast prompt stays under Genjutsu Light char cap', () => {
  const prompt = buildWassupInAMinuteAiPrompt(['left', 'center', 'right']);
  assert.ok(prompt.length <= 2000);
  assert.match(prompt, /do NOT identify people by left\/center\/right/i);
});

test('prompt/image count mismatch is rejected', () => {
  const prompt = buildWassupInAMinuteAiPrompt(['left', 'center', 'right']);
  assert.throws(
    () =>
      assertWassupInAMinuteAiInputs({
        product: WASSUP_IN_A_MINUTE_AI_PRODUCT_ID,
        mode: WASSUP_IN_A_MINUTE_AI_MODE,
        prompt,
        aspectRatio: WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
        resolution: '480p',
        useDefaultTemplate: true,
        imageKeys: ['only-one'],
        contentTypes: ['image/jpeg'],
        contentLengths: [1],
      }),
    WassupInAMinuteAiPreflightError
  );
});

test('wrong aspect ratio is rejected', () => {
  const prompt = buildWassupInAMinuteAiPrompt(['center']);
  assert.throws(
    () =>
      assertWassupInAMinuteAiInputs({
        product: WASSUP_IN_A_MINUTE_AI_PRODUCT_ID,
        mode: WASSUP_IN_A_MINUTE_AI_MODE,
        prompt,
        aspectRatio: '9:16',
        resolution: '480p',
        useDefaultTemplate: true,
        imageKeys: ['img1'],
        contentTypes: ['image/jpeg'],
        contentLengths: [100],
      }),
    WassupInAMinuteAiPreflightError
  );
});
