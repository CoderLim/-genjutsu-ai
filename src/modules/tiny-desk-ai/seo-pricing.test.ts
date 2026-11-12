import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GENJUTSU_CREDIT_PACKS,
  getDisplayCreditPack,
  getDisplayUsdPerCredit,
  getUsdPerCredit,
} from '@/modules/genjutsu/pricing';

import { getTinyDeskAiSeoPriceAmounts } from './seo-pricing';

test('Tiny Desk SEO glance prices use Creator pack rate and whole dollars', () => {
  const starter = GENJUTSU_CREDIT_PACKS[0]!;
  const creator = getDisplayCreditPack();
  assert.equal(starter.priceCents, 499);
  assert.equal(starter.credits, 400);
  assert.equal(creator.id, 'creator');
  assert.equal(creator.priceCents, 999);
  assert.equal(creator.credits, 850);
  assert.equal(getUsdPerCredit(creator), 9.99 / 850);
  assert.equal(getDisplayUsdPerCredit(), 9.99 / 850);

  const amounts = getTinyDeskAiSeoPriceAmounts();
  assert.equal(amounts.starterPrice, '$4.99');
  assert.equal(amounts.creatorPrice, '$9.99');
  // Light 15s uses 30 billable seconds (input + output): $1.50 / $3.
  // At the Creator pack rate this displays about $3 / $6.
  assert.equal(amounts.usd480, '$3');
  assert.equal(amounts.usd720, '$6');
});
