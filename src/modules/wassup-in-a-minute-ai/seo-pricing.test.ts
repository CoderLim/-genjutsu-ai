import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GENJUTSU_CREDIT_PACKS } from '@/modules/genjutsu/pricing';

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
