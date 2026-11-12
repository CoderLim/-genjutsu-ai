import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  estimateGenjutsuCreditsForProvider,
  GENJUTSU_CREDIT_PACKS,
  getDisplayUsdPerCredit,
} from '@/modules/genjutsu/pricing';
import { HIGGSFIELD_GENJUTSU_MODELS } from '@/modules/genjutsu/model-config';

import { WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS } from './constants';
import { resolveWassupInAMinuteAiProviderTarget } from './provider';

import { getWassupInAMinuteAiSeoPriceAmounts } from './seo-pricing';

test('seo pricing returns starter pack and rounded USD strings', () => {
  const amounts = getWassupInAMinuteAiSeoPriceAmounts();
  const starter = GENJUTSU_CREDIT_PACKS[0]!;
  assert.equal(
    amounts.starterPrice,
    `$${(starter.priceCents / 100).toFixed(2)}`
  );
  assert.match(amounts.usd480, /^\$\d+$/);
  assert.match(amounts.usd720, /^\$\d+$/);
  assert.ok(amounts.credits720 > 0);
});

test('Wassup uses Standard cost for full-length 720p SEO pricing', () => {
  const target = resolveWassupInAMinuteAiProviderTarget();
  assert.deepEqual(target, {
    provider: 'higgsfield',
    model: HIGGSFIELD_GENJUTSU_MODELS.standard['objects-swap'],
  });

  const credits = estimateGenjutsuCreditsForProvider({
    ...target,
    durationSeconds: WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS,
    resolution: '720p',
  });
  const amounts = getWassupInAMinuteAiSeoPriceAmounts();
  assert.equal(amounts.credits720, credits);
  assert.equal(
    amounts.usd720,
    `${Math.round(credits * getDisplayUsdPerCredit())}`
  );
  assert.ok(
    credits >
      estimateGenjutsuCreditsForProvider({
        provider: 'higgsfield',
        model: HIGGSFIELD_GENJUTSU_MODELS.light['objects-swap'],
        durationSeconds: WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS,
        resolution: '720p',
      })
  );
});
