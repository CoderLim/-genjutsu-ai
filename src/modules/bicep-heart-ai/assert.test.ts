import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assertBicepHeartAiInputs, BicepHeartAiPreflightError } from './assert';
import {
  BICEP_HEART_AI_ASPECT_RATIO,
  BICEP_HEART_AI_DEFAULT_PROMPT,
  BICEP_HEART_AI_MODE,
  BICEP_HEART_AI_PRODUCT_ID,
} from './constants';

const base = {
  product: BICEP_HEART_AI_PRODUCT_ID,
  mode: BICEP_HEART_AI_MODE,
  prompt: BICEP_HEART_AI_DEFAULT_PROMPT,
  aspectRatio: BICEP_HEART_AI_ASPECT_RATIO,
  resolution: '480p' as const,
  useDefaultTemplate: true,
  imageKeys: ['img'],
  contentTypes: ['image/jpeg'],
  contentLengths: [12_000],
};

test('default prompt keeps sleeve-roll then bicep-heart reveal timing', () => {
  assert.match(BICEP_HEART_AI_DEFAULT_PROMPT, /@Image 1/);
  assert.match(BICEP_HEART_AI_DEFAULT_PROMPT, /roll(?:s| the)? sleeve/i);
  assert.match(BICEP_HEART_AI_DEFAULT_PROMPT, /bicep/i);
  assert.match(BICEP_HEART_AI_DEFAULT_PROMPT, /heart/i);
  assert.match(
    BICEP_HEART_AI_DEFAULT_PROMPT,
    /visibly peaked|bottom of the heart/i
  );
  assert.match(
    BICEP_HEART_AI_DEFAULT_PROMPT,
    /Do not skip the sleeve-roll or the bicep reveal/i
  );
});

test('assertBicepHeartAiInputs accepts full fixed-template run', () => {
  assert.doesNotThrow(() => assertBicepHeartAiInputs(base));
});

test('assertBicepHeartAiInputs rejects wrong image count', () => {
  assert.throws(
    () =>
      assertBicepHeartAiInputs({
        ...base,
        imageKeys: ['a', 'b'],
        contentTypes: ['image/jpeg', 'image/jpeg'],
        contentLengths: [1, 2],
      }),
    BicepHeartAiPreflightError
  );
});

test('assertBicepHeartAiInputs accepts preview with trimmed video + one image', () => {
  assert.doesNotThrow(() =>
    assertBicepHeartAiInputs({
      ...base,
      preview: true,
      useDefaultTemplate: false,
      videoKey: 'vid',
      imageKeys: ['img'],
      contentTypes: ['video/mp4', 'image/jpeg'],
      contentLengths: [1000, 2000],
    })
  );
});
