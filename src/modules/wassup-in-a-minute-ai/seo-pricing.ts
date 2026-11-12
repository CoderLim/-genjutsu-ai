/**
 * SEO / glance copy amounts derived from the same estimate helpers and
 * Creator (highlighted) pack rate the generator UI uses — never a parallel
 * price table.
 */

import {
  estimateGenjutsuCreditsForProvider,
  GENJUTSU_CREDIT_PACKS,
  getDisplayCreditPack,
  getDisplayUsdPerCredit,
} from '@/modules/genjutsu/pricing';

import {
  WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
  WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS,
} from './constants';
import { resolveWassupInAMinuteAiProviderTarget } from './provider';

export type WassupInAMinuteAiSeoPriceAmounts = {
  /** Rounded Creator-pack USD for full 480p clip, e.g. "$10". */
  usd480: string;
  /** Rounded Creator-pack USD for full 720p clip, e.g. "$20". */
  usd720: string;
  /** Approx credit count for full 720p (FAQ / glance). */
  credits720: number;
  /** Cheapest pack list price (“packs start at”), e.g. "$4.99". */
  starterPrice: string;
  /** Highlighted Creator pack list price, e.g. "$9.99". */
  creatorPrice: string;
};

/** Whole-dollar approx. USD at the Creator pack rate (matches glance / FAQ tone). */
export function getWassupInAMinuteAiSeoPriceAmounts(): WassupInAMinuteAiSeoPriceAmounts {
  const starter = GENJUTSU_CREDIT_PACKS[0]!;
  const creator = getDisplayCreditPack();
  const usdPerCredit = getDisplayUsdPerCredit();
  const { provider, model } = resolveWassupInAMinuteAiProviderTarget();

  const credits480 = estimateGenjutsuCreditsForProvider({
    provider,
    model,
    durationSeconds: WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS,
    resolution: '480p',
    aspectRatio: WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
  });
  const credits720 = estimateGenjutsuCreditsForProvider({
    provider,
    model,
    durationSeconds: WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS,
    resolution: '720p',
    aspectRatio: WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
  });

  return {
    usd480: `$${Math.round(credits480 * usdPerCredit)}`,
    usd720: `$${Math.round(credits720 * usdPerCredit)}`,
    credits720,
    starterPrice: `$${(starter.priceCents / 100).toFixed(2)}`,
    creatorPrice: `$${(creator.priceCents / 100).toFixed(2)}`,
  };
}
