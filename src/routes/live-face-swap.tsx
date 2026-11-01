import { createFileRoute } from '@tanstack/react-router';
import { Clapperboard } from 'lucide-react';

import { absoluteUrl, socialMeta } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { LiveFaceSwapPanel } from '@/components/landing/LiveFaceSwapPanel';
import {
  getLiveFaceSwapFaqSchemaItems,
  LiveFaceSwapSeoSections,
} from '@/components/landing/LiveFaceSwapSeoSections';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { SiteHeader } from '@/components/landing/SiteHeader';
import { SeoJsonLd } from '@/components/seo-json-ld';

const PAGE_PATH = '/live-face-swap';
const OG_IMAGE = '/og/live-face-swap.jpg';
const PAGE_TITLE =
  'Live Face Swap Generator — Browser Studio + Clip Path | Genjutsu AI';
const PAGE_DESCRIPTION =
  'Preview a live face swap in your browser, or follow the clip path for 3–120s downloads. One portrait, 480p or 720p, no app, clip runs from ≈$0.25.';

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: getLiveFaceSwapFaqSchemaItems().map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Live Face Swap Generator',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: absoluteUrl(PAGE_PATH),
    description: PAGE_DESCRIPTION,
    image: absoluteUrl(OG_IMAGE),
    offers: {
      '@type': 'Offer',
      price: '0.25',
      priceCurrency: 'USD',
      description: 'Prepaid credits from ≈$0.25 per run',
    },
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
        name: 'Genjutsu AI',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Live Face Swap',
        item: canonical,
      },
    ],
  };
}

export const Route = createFileRoute('/live-face-swap')({
  loader: () => {
    const locale = getLocale();
    const canonical = absoluteUrl(PAGE_PATH);
    return { locale, canonical };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { canonical } = loaderData;
    return {
      meta: [
        { title: PAGE_TITLE },
        { name: 'description', content: PAGE_DESCRIPTION },
        ...socialMeta({
          title: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          url: canonical,
          image: absoluteUrl(OG_IMAGE),
        }),
        {
          property: 'og:image:alt',
          content: 'Live Face Swap Generator — clip-based face swap',
        },
      ],
      links: [
        { rel: 'canonical', href: canonical },
        // English-only for now — advertise en + x-default; do not point at
        // missing /ja /ko /es mirrors.
        { rel: 'alternate', hrefLang: 'en', href: canonical },
        { rel: 'alternate', hrefLang: 'x-default', href: canonical },
      ],
    };
  },
  component: LiveFaceSwapPage,
});

function LiveFaceSwapPage() {
  const { canonical } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[hsl(28_25%_9%)] text-[rgb(237,234,222)]">
      <SeoJsonLd value={faqJsonLd()} />
      <SeoJsonLd value={softwareApplicationJsonLd()} />
      <SeoJsonLd value={breadcrumbJsonLd(canonical)} />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(154,91,55,0.22),transparent_38%),linear-gradient(to_bottom,hsl(13,10,9,0.5),hsl(28_25%_9%)_78%)]" />
          <div className="absolute top-24 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[rgba(204,144,92,0.055)] blur-3xl" />
        </div>

        <div className="relative z-20">
          <SiteHeader />
        </div>

        <main className="relative z-10">
          <section className="mx-auto max-w-7xl px-4 pt-10 pb-8 text-center sm:pt-14 md:px-5 md:pb-10">
            <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[rgba(204,144,92,0.2)] bg-[rgba(204,144,92,0.07)] px-3 py-1.5 text-xs font-medium text-[rgb(220,155,99)]">
              <Clapperboard className="size-3.5" />
              Live Face Swap · Browser studio
            </div>

            <h1 className="mx-auto max-w-4xl text-[34px] leading-[1.08] font-bold tracking-[-1.4px] sm:text-[44px] md:text-[56px]">
              Live Face Swap Generator
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              Preview a face swap live in your browser with one reference
              portrait and your camera — then use the clip-based workflow below
              when you want a downloadable 3–120s result. No app install, no
              OBS.
            </p>
            <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/40">
              <span>One Portrait</span>
              <span aria-hidden>·</span>
              <span>Live preview</span>
              <span aria-hidden>·</span>
              <span>Clip path from ≈$0.25</span>
              <span aria-hidden>·</span>
              <span>Authorized Media Only</span>
            </div>

            <p className="mx-auto mt-8 max-w-3xl text-sm font-medium tracking-wide text-white/50 sm:mt-10">
              Live studio · Reference face · Camera preview
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-white/35">
              The studio below is a live camera preview pilot. Specs, pricing
              tables, and FAQs describe the documented clip-based path (upload a
              clip · one portrait · 480p or 720p).
            </p>

            <div id="generator" className="mt-4 scroll-mt-24 text-left sm:mt-5">
              <LiveFaceSwapPanel />
            </div>
          </section>

          <section className="border-t border-white/7 bg-white/[0.018]">
            <LiveFaceSwapSeoSections />
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
