import assert from 'node:assert/strict';
import test from 'node:test';

import { HIGGSFIELD_GENJUTSU_MODELS } from './model-config';

import {
  calculateGenjutsuCredits,
  canSeeSmokeCreditPack,
  estimateGenjutsuCredits,
  estimateGenjutsuCreditsForProvider,
  estimateGenjutsuListCost,
  estimateSeedanceCredits,
  GENJUTSU_CREDIT_PACKS,
  GENJUTSU_SMOKE_CREDIT_PACK,
  getSmallestSufficientCreditPack,
  listVisibleCreditPacks,
} from './pricing';

test('V1 public credit packs keep launch USD prices with reduced credits', () => {
  assert.deepEqual(
    GENJUTSU_CREDIT_PACKS.map((pack) => [
      pack.id,
      pack.priceCents,
      pack.credits,
    ]),
    [
      ['starter', 499, 400],
      ['creator', 999, 850],
      ['pro', 1999, 1750],
      ['studio', 3999, 3600],
    ]
  );
});

test('reduced V1 packs keep a decreasing $/credit ladder near the V2 margin band', () => {
  const [starter, creator, pro, studio] = GENJUTSU_CREDIT_PACKS;
  const modelCostUsd = (credits: number) => credits / 170;
  for (const pack of GENJUTSU_CREDIT_PACKS) {
    const margin = 1 - modelCostUsd(pack.credits) / (pack.priceCents / 100);
    assert.ok(
      margin >= 0.47 && margin < 0.57,
      `unexpected ${pack.id} model-cost margin ${margin}`
    );
  }
  assert.ok(
    starter.priceCents / starter.credits > creator.priceCents / creator.credits
  );
  assert.ok(
    creator.priceCents / creator.credits > pro.priceCents / pro.credits
  );
  assert.ok(pro.priceCents / pro.credits > studio.priceCents / studio.credits);
});

test('smoke pack is only visible to gengliming emails', () => {
  assert.equal(GENJUTSU_SMOKE_CREDIT_PACK.priceCents, 100);
  assert.equal(GENJUTSU_SMOKE_CREDIT_PACK.currency, 'cny');
  assert.equal(GENJUTSU_SMOKE_CREDIT_PACK.credits, 50);
  assert.equal(canSeeSmokeCreditPack('alice@example.com'), false);
  assert.equal(canSeeSmokeCreditPack('gengliming110@gmail.com'), true);
  assert.equal(canSeeSmokeCreditPack('dev+GENGLIMING@x.com'), true);
  assert.deepEqual(
    listVisibleCreditPacks('alice@example.com').map((p) => p.id),
    ['starter', 'creator', 'pro', 'studio']
  );
  assert.deepEqual(
    listVisibleCreditPacks('gengliming110@gmail.com').map((p) => p.id),
    ['starter', 'creator', 'pro', 'studio', 'smoke']
  );
});

test('provider USD cost is converted with the 1.7x credit multiplier', () => {
  assert.equal(calculateGenjutsuCredits(3.405), 579);
});

test('fallback estimates round input duration up to a whole second', () => {
  assert.equal(
    estimateGenjutsuListCost({
      durationSeconds: 3.1,
      resolution: '480p',
    }),
    4 * 0.318
  );
  assert.equal(
    estimateGenjutsuCredits({
      durationSeconds: 3.1,
      resolution: '480p',
    }),
    217
  );
});

test('fallback estimate caps source billing at 30 seconds and supports 1080p', () => {
  assert.equal(
    estimateGenjutsuListCost({
      durationSeconds: 45,
      resolution: '1080p',
    }),
    30 * 1.632
  );
});

test('list-rate fallback for 720p max clip reserves known credits', () => {
  // Used when /estimate returns pricing_description or fails.
  assert.equal(
    calculateGenjutsuCredits(
      estimateGenjutsuListCost({
        durationSeconds: 30,
        resolution: '720p',
      })
    ),
    3474
  );
});

test('credit gate chooses the smallest pack that covers the deficit', () => {
  assert.equal(
    getSmallestSufficientCreditPack({
      balance: 310,
      requiredCredits: 820,
      email: 'alice@example.com',
    })?.id,
    'creator'
  );
  assert.equal(
    getSmallestSufficientCreditPack({
      balance: 320,
      requiredCredits: 700,
      email: 'alice@example.com',
    })?.id,
    'starter'
  );
});

test('V1 deficit boundaries select the smallest sufficient public pack', () => {
  const cases: Array<[number, string | null]> = [
    [399, 'starter'],
    [400, 'starter'],
    [401, 'creator'],
    [850, 'creator'],
    [851, 'pro'],
    [1750, 'pro'],
    [1751, 'studio'],
    [3600, 'studio'],
    [3601, null],
  ];
  for (const [deficit, expected] of cases) {
    assert.equal(
      getSmallestSufficientCreditPack({
        balance: 250,
        requiredCredits: 250 + deficit,
        email: 'alice@example.com',
      })?.id ?? null,
      expected,
      `deficit ${deficit}`
    );
  }
});

test('credit gate supports the internal smoke pack and does not under-sell large deficits', () => {
  assert.equal(
    getSmallestSufficientCreditPack({
      balance: 100,
      requiredCredits: 140,
      email: 'gengliming110@gmail.com',
    })?.id,
    'smoke'
  );
  assert.equal(
    getSmallestSufficientCreditPack({
      balance: 0,
      requiredCredits: 9000,
      email: 'alice@example.com',
    }),
    null
  );
});

test('display estimator tracks selected server provider', () => {
  const input = { durationSeconds: 4.1, resolution: '720p' as const };
  assert.equal(
    estimateGenjutsuCreditsForProvider({ ...input, provider: 'higgsfield' }),
    estimateGenjutsuCredits(input)
  );
  assert.equal(
    estimateGenjutsuCreditsForProvider({ ...input, provider: 'seedance' }),
    estimateSeedanceCredits(input)
  );
  assert.equal(
    estimateGenjutsuCreditsForProvider({
      ...input,
      provider: 'seedance-volcengine',
    }),
    estimateSeedanceCredits(input)
  );
  assert.equal(
    estimateGenjutsuCreditsForProvider({
      ...input,
      provider: 'seedance-seeapi',
    }),
    estimateSeedanceCredits(input)
  );
  assert.equal(
    estimateGenjutsuCreditsForProvider({
      ...input,
      provider: 'seedance-wavespeed',
    }),
    estimateSeedanceCredits(input)
  );
  assert.notEqual(
    estimateGenjutsuCreditsForProvider({
      ...input,
      provider: 'seedance-higgsfield',
      aspectRatio: '3:4',
    }),
    estimateSeedanceCredits(input)
  );
  assert.notEqual(
    estimateGenjutsuCredits(input),
    estimateSeedanceCredits(input)
  );
});

test('Seedance early-gate estimate matches the server customer quote without whole-second rounding', () => {
  assert.equal(
    estimateSeedanceCredits({
      durationSeconds: 4.1,
      resolution: '720p',
    }),
    475
  );
  assert.equal(
    estimateSeedanceCredits({
      durationSeconds: 30,
      resolution: '1080p',
    }),
    8546
  );
});


test('Light fallback bills input and output with a 15-second source cap', () => {
  const model = HIGGSFIELD_GENJUTSU_MODELS.light['objects-swap'];
  assert.equal(
    estimateGenjutsuListCost({ durationSeconds: 4, resolution: '480p', model }),
    0.4
  );
  assert.equal(
    estimateGenjutsuListCost({ durationSeconds: 15, resolution: '720p', model }),
    3
  );
  assert.equal(
    estimateGenjutsuListCost({ durationSeconds: 19, resolution: '1080p', model }),
    6
  );
  assert.equal(
    estimateGenjutsuListCost({
      durationSeconds: 15,
      resolution: '720p',
      model: HIGGSFIELD_GENJUTSU_MODELS.standard['objects-swap'],
    }),
    15 * 0.681
  );
});

test('browser credit quote distinguishes Light from Standard for same provider', () => {
  const input = { provider: 'higgsfield' as const, durationSeconds: 15, resolution: '720p' as const };
  const light = estimateGenjutsuCreditsForProvider({
    ...input,
    model: HIGGSFIELD_GENJUTSU_MODELS.light['objects-swap'],
  });
  const standard = estimateGenjutsuCreditsForProvider({
    ...input,
    model: HIGGSFIELD_GENJUTSU_MODELS.standard['objects-swap'],
  });
  assert.equal(light, calculateGenjutsuCredits(3));
  assert.ok(light < standard);
});
