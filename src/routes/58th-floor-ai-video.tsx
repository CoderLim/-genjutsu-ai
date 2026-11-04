import { createFileRoute } from '@tanstack/react-router';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { FIFTY_EIGHTH_FLOOR_PRESET_ID } from '@/modules/hotel-lobby/presets';
import { absoluteUrl, localeLinks, socialMeta } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import {
  FLOOR58_FAQ_ITEMS,
  FLOOR58_HOW_STEPS,
  Floor58SeoSections,
} from '@/components/landing/Floor58SeoSections';
import { HotelLobbyGeneratorPanel } from '@/components/landing/HotelLobbyGeneratorPanel';
import { SiteHeader } from '@/components/landing/SiteHeader';
import { SeoJsonLd } from '@/components/seo-json-ld';

const PAGE_PATH = '/58th-floor-ai-video';
const OG_IMAGE = '/videos/58th-floor-tpl-poster.jpg';
/** English editorial first — do not advertise locale mirrors yet. */
const SEO_LOCALES = ['en'] as const;

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FLOOR58_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function howToJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to make the 58th Floor AI video',
    totalTime: 'PT2M',
    step: FLOOR58_HOW_STEPS.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

function breadcrumbJsonLd(canonical: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Scenes',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '58th Floor AI Video',
        item: canonical,
      },
    ],
  };
}

function FiftyEighthFloorAiVideoPage() {
  const canonical = absoluteUrl(PAGE_PATH);

  return (
    <div className="flex min-h-screen flex-col">
      <SeoJsonLd value={faqJsonLd()} />
      <SeoJsonLd value={howToJsonLd()} />
      <SeoJsonLd value={breadcrumbJsonLd(canonical)} />

      <div className="relative flex-1 overflow-hidden bg-[hsl(28_25%_9%)] text-[rgb(237,234,222)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(45,120,120,0.18),transparent_38%),linear-gradient(to_bottom,rgba(13,10,9,0.5),hsl(28_25%_9%)_78%)]" />
          <div className="absolute top-24 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[rgba(64,160,160,0.06)] blur-3xl" />
        </div>

        <div className="relative z-20">
          <SiteHeader />
        </div>

        <main className="relative z-10">
          <section className="mx-auto max-w-7xl px-4 pt-14 pb-6 text-center sm:pt-20 md:px-5">
            <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[rgba(64,160,160,0.28)] bg-[rgba(64,160,160,0.08)] px-3 py-1.5 text-xs font-medium text-[rgb(120,200,190)]">
              {m['site.floor58.hero_badge']()}
            </div>

            <h1 className="mx-auto max-w-4xl text-[34px] leading-[1.08] font-bold tracking-[-1.4px] sm:text-[44px] md:text-[56px]">
              {m['site.floor58.hero_title']()}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              {m['site.floor58.hero_description']()}
            </p>

            <div
              id="generator"
              className="mt-8 scroll-mt-24 text-left sm:mt-10"
            >
              <HotelLobbyGeneratorPanel
                presetId={FIFTY_EIGHTH_FLOOR_PRESET_ID}
              />
            </div>
          </section>

          <Floor58SeoSections />
        </main>
      </div>

      <footer className="border-t border-white/7 bg-[hsl(28_25%_9%)] py-8 text-[rgb(237,234,222)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-white/32 sm:flex-row sm:text-left md:px-5">
          <p>
            © 2026 {envConfigs.app_name}. {m['site.floor58.copyright']()}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/privacy-policy"
              className="transition hover:text-white/65"
            >
              {m['site.hotel.footer_privacy']()}
            </Link>
            <Link
              href="/terms-of-service"
              className="transition hover:text-white/65"
            >
              {m['site.hotel.footer_terms']()}
            </Link>
            <Link
              href="/refund-policy"
              className="transition hover:text-white/65"
            >
              {m['site.hotel.footer_refunds']()}
            </Link>
            <a
              href={`mailto:${envConfigs.app_support_email}`}
              className="transition hover:text-white/65"
            >
              {m['site.hotel.footer_support']()}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute('/58th-floor-ai-video')({
  loader: () => {
    const locale = getLocale();
    return { locale };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const title = m['site.floor58.page_title']({}, { locale });
    const description = m['site.floor58.page_description']({}, { locale });
    const { canonical, alternates } = localeLinks(PAGE_PATH, locale, [
      ...SEO_LOCALES,
    ]);
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        ...socialMeta({
          title,
          description,
          url: canonical,
          image: absoluteUrl(OG_IMAGE),
        }),
      ],
      links: [{ rel: 'canonical', href: canonical }, ...alternates],
    };
  },
  component: FiftyEighthFloorAiVideoPage,
});
