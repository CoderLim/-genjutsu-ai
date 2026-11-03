import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertTinyDeskAiInputs,
  isAllowedTinyDeskAiPrompt,
  TinyDeskAiPreflightError,
} from './assert';
import {
  buildTinyDeskAiPrompt,
  LEGACY_TINY_DESK_AI_PROMPTS,
  TINY_DESK_AI_ASPECT_RATIO,
  TINY_DESK_AI_MODE,
  TINY_DESK_AI_PRODUCT_ID,
  TINY_DESK_AI_PROMPTS_BY_COUNT,
} from './constants';

function optionsForCount(count: number) {
  return {
    product: TINY_DESK_AI_PRODUCT_ID,
    mode: TINY_DESK_AI_MODE,
    prompt: buildTinyDeskAiPrompt(count),
    useDefaultTemplate: true,
    aspectRatio: TINY_DESK_AI_ASPECT_RATIO,
    resolution: '480p' as const,
    imageKeys: Array.from(
      { length: count },
      (_, i) => `genjutsu/u/g/reference-0${i + 1}.jpg`
    ),
    contentTypes: Array.from({ length: count }, () => 'image/jpeg'),
    contentLengths: Array.from({ length: count }, () => 1000),
  };
}

test('accepts 1–5 contiguous cast sizes with matching prompts', () => {
  for (const count of [1, 2, 3, 4, 5] as const) {
    assert.doesNotThrow(() => assertTinyDeskAiInputs(optionsForCount(count)));
  }
});

test('maps @Image1–@Image5 in upload order for each cast size', () => {
  for (const count of [1, 2, 3, 4, 5] as const) {
    const prompt = buildTinyDeskAiPrompt(count);
    for (let i = 0; i < count; i += 1) {
      assert.match(prompt, new RegExp(`→ @Image${i + 1}`));
    }
    for (let i = count; i < 5; i += 1) {
      assert.doesNotMatch(prompt, new RegExp(`@Image${i + 1}\\b`));
    }
  }
});

test('five-person Light prompt matches the homepage-safe wording', () => {
  const prompt = buildTinyDeskAiPrompt(5);
  assert.match(
    prompt,
    /Replace these performers with the reference images \(one-to-one\):/
  );
  assert.match(
    prompt,
    /Center lead at red keyboard \(brown hair, black suit, thin black tie\) → @Image1/
  );
  assert.match(
    prompt,
    /Backing left \(shaved head, navy suit, blue patterned tie\) → @Image2/
  );
  assert.match(
    prompt,
    /Backing right \(shaved head, grey pinstripe, often sunglasses\) → @Image3/
  );
  assert.match(
    prompt,
    /Silver-haired close-up vocalist \(windowpane jacket, striped tie\) → @Image4 — different from the center lead/
  );
  assert.match(prompt, /Sax player \(glasses, red-black scarf\) → @Image5/);
  assert.match(
    prompt,
    /Keep mapping across cuts\. Do not merge identities\. Keep desk, band motion, camera, and lighting\./
  );
  assert.doesNotMatch(prompt, /Leave other performers unchanged\./);
  assert.ok(prompt.length <= 2000, `prompt length ${prompt.length}`);
});

test('partial casts ask Light to leave other performers unchanged', () => {
  const solo = buildTinyDeskAiPrompt(1);
  assert.match(solo, /Leave other performers unchanged\./);
  assert.match(solo, /→ @Image1/);
  assert.doesNotMatch(solo, /@Image2\b/);
  assert.ok(solo.length <= 2000);
});

test('new prompts pass server allowlist and cast-size check', () => {
  for (const count of [1, 2, 3, 4, 5] as const) {
    const prompt = TINY_DESK_AI_PROMPTS_BY_COUNT[count];
    assert.equal(isAllowedTinyDeskAiPrompt(prompt), true);
    assert.doesNotThrow(() => assertTinyDeskAiInputs(optionsForCount(count)));
  }
});

test('existing silver-hair legacy solo prompt still validates for 1 image', () => {
  const legacy = LEGACY_TINY_DESK_AI_PROMPTS[0]!;
  assert.equal(isAllowedTinyDeskAiPrompt(legacy), true);
  assert.ok(legacy.length <= 2000);
  assert.doesNotThrow(() =>
    assertTinyDeskAiInputs({
      ...optionsForCount(1),
      prompt: legacy,
    })
  );
});

test('rejects wrong image count and mismatched prompts', () => {
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(1),
        prompt: 'custom prompt',
      }),
    TinyDeskAiPreflightError
  );
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(2),
        prompt: buildTinyDeskAiPrompt(5),
      }),
    TinyDeskAiPreflightError
  );
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(1),
        imageKeys: [],
        contentTypes: [],
        contentLengths: [],
        prompt: buildTinyDeskAiPrompt(1),
      }),
    TinyDeskAiPreflightError
  );
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(5),
        imageKeys: [
          ...optionsForCount(5).imageKeys,
          'genjutsu/u/g/reference-06.jpg',
        ],
        contentTypes: [...optionsForCount(5).contentTypes, 'image/jpeg'],
        contentLengths: [...optionsForCount(5).contentLengths, 1],
        prompt: buildTinyDeskAiPrompt(5),
      }),
    TinyDeskAiPreflightError
  );
});

test('accepts a 480p preview clip plus up to five images', () => {
  const base = optionsForCount(3);
  assert.doesNotThrow(() =>
    assertTinyDeskAiInputs({
      ...base,
      preview: true,
      useDefaultTemplate: false,
      resolution: '480p',
      videoKey: 'genjutsu/u/g/source.mp4',
      contentTypes: ['video/mp4', 'image/jpeg', 'image/jpeg', 'image/jpeg'],
      contentLengths: [400000, 1000, 1000, 1000],
    })
  );
});

test('rejects motion-transfer mode, wrong aspect, and wrong resolution', () => {
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(1),
        mode: 'motion-transfer',
      }),
    TinyDeskAiPreflightError
  );
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(1),
        aspectRatio: '16:9',
      }),
    TinyDeskAiPreflightError
  );
  assert.throws(
    () =>
      assertTinyDeskAiInputs({
        ...optionsForCount(1),
        resolution: '1080p',
      }),
    TinyDeskAiPreflightError
  );
});
