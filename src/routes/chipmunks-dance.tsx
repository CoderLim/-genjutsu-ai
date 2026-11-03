import { createFileRoute, redirect } from '@tanstack/react-router';

import { resolveChipmunksDanceProviderTarget } from '@/modules/chipmunks-dance/provider';
import { absoluteUrl, localeLinks, socialMeta } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { ChipmunksDanceGeneratorPanel } from '@/components/landing/ChipmunksDanceGeneratorPanel';
import {
  CHIPMUNKS_FAQ_ITEMS,
  CHIPMUNKS_HOWTO_STEPS,
  ChipmunksDanceSeoSections,
} from '@/components/landing/ChipmunksDanceSeoSections';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { SiteHeader } from '@/components/landing/SiteHeader';
import { SeoJsonLd } from '@/components/seo-json-ld';

const OG_IMAGE = '/videos/chipmunks-dance-tpl-poster.jpg';
const PAGE_PATH = '/chipmunks-dance';
const DATE_PUBLISHED = '2026-11-03';
const DATE_MODIFIED = '2026-11-03';

function articleJsonLd(canonical: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: m['site.chipmunks.page_title'](),
    description: m['site.chipmunks.page_description'](),
    dateModified: DATE_MODIFIED,
    datePublished: DATE_PUBLISHED,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    image: absoluteUrl(OG_IMAGE),
    author: {
      '@type': 'Organization',
      name: 'Genjutsu',
    },
  };
}

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CHIPMUNKS_FAQ_ITEMS.map((item) => ({
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
    name: 'How to Do the Chipmunks Dance: Step by Step',
    description:
      'Line up three dancers, run four front-spot handoffs, and finish with a camera rush — the Chipmunks Dance trio routine.',
    step: CHIPMUNKS_HOWTO_STEPS.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
    })),
  };
}

function ChipmunksDancePage() {
  const { creditProvider } = Route.useLoaderData();
  const canonical = absoluteUrl(PAGE_PATH);

  return (
    <div className="min-h-screen bg-[hsl(28_25%_9%)] text-[rgb(237,234,222)]">
      <SeoJsonLd value={articleJsonLd(canonical)} />
      <SeoJsonLd value={faqJsonLd()} />
      <SeoJsonLd value={howToJsonLd()} />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(154,91,55,0.22),transparent_38%),linear-gradient(to_bottom,rgba(13,10,9,0.5),hsl(28_25%_9%)_78%)]" />
          <div className="absolute top-24 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[rgba(204,144,92,0.055)] blur-3xl" />
        </div>

        <div className="relative z-20">
          <SiteHeader />
        </div>

        <main className="relative z-10">
          <section className="mx-auto max-w-7xl px-4 pt-14 pb-10 text-center sm:pt-20 md:px-5 md:pb-12">
            <div className="mx-auto mb-4 flex w-fit flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-[rgba(204,144,92,0.2)] bg-[rgba(204,144,92,0.07)] px-3 py-1.5 text-xs font-medium text-[rgb(220,155,99)]">
                {m['site.chipmunks.hero_badge']()}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/45">
                {m['site.chipmunks.updated']()}
              </span>
            </div>

            <h1 className="mx-auto max-w-4xl text-[34px] leading-[1.08] font-bold tracking-[-1.4px] sm:text-[44px] md:text-[56px]">
              {m['site.chipmunks.hero_title']()}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              {m['site.chipmunks.hero_description']()}
            </p>

            <div id="generator" className="mt-8 text-left sm:mt-10">
              <p className="mb-3 text-center text-xs font-medium tracking-wide text-white/45 uppercase sm:text-left">
                {m['site.chipmunks.generator_badge']()}
              </p>
              <ChipmunksDanceGeneratorPanel creditProvider={creditProvider} />
              <p className="mt-3 text-sm leading-6 text-white/42">
                {m['site.chipmunks.generator_note']()}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/32">
                {m['site.chipmunks.disclaimer']()}
              </p>
            </div>
          </section>

          <ChipmunksDanceSeoSections />
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/chipmunks-dance')({
  beforeLoad: () => {
    if (getLocale() !== 'en') {
      throw redirect({
        href: '/chipmunks-dance',
        statusCode: 307,
        reloadDocument: true,
      });
    }
  },
  loader: () => {
    const locale = getLocale();
    const target = resolveChipmunksDanceProviderTarget();
    return { locale, creditProvider: target.provider };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const { canonical, alternates } = localeLinks(PAGE_PATH, locale, ['en']);
    return {
      meta: [
        { title: m['site.chipmunks.page_title']() },
        {
          name: 'description',
          content: m['site.chipmunks.page_description'](),
        },
        ...socialMeta({
          title: m['site.chipmunks.page_title'](),
          description: m['site.chipmunks.page_description'](),
          url: canonical,
          image: absoluteUrl(OG_IMAGE),
        }),
      ],
      links: [{ rel: 'canonical', href: canonical }, ...alternates],
    };
  },
  component: ChipmunksDancePage,
});
