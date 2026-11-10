import { createFileRoute } from '@tanstack/react-router';
import { Film, Images, Sparkles, WandSparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { absoluteUrl, localeLinks, socialMeta } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { KairoBadTimesGeneratorPanel } from '@/components/landing/KairoBadTimesGeneratorPanel';
import { SiteHeader } from '@/components/landing/SiteHeader';
import { SeoJsonLd } from '@/components/seo-json-ld';

/** Real Bad Times outputs shown in the Example results gallery + VideoObject. */
const KAIRO_EXAMPLE_CASES = [
  {
    id: 'case-01',
    src: '/videos/demos/kairo-bad-times-case-01.mp4',
    poster: '/videos/demos/kairo-bad-times-case-01-poster.jpg',
    duration: 'PT21S',
  },
  {
    id: 'case-02',
    src: '/videos/demos/kairo-bad-times-case-02.mp4',
    poster: '/videos/demos/kairo-bad-times-case-02-poster.jpg',
    duration: 'PT1M1S',
  },
  {
    id: 'case-03',
    src: '/videos/demos/kairo-bad-times-case-03.mp4',
    poster: '/videos/demos/kairo-bad-times-case-03-poster.jpg',
    duration: 'PT38S',
  },
  {
    id: 'case-04',
    src: '/videos/demos/kairo-bad-times-case-04.mp4',
    poster: '/videos/demos/kairo-bad-times-case-04-poster.jpg',
    duration: 'PT28S',
  },
] as const;

const OG_IMAGE = KAIRO_EXAMPLE_CASES[0].poster;
const DEMO_UPLOAD_DATE = '2026-10-15';

const FAQ_ITEMS = [
  { question: m['site.kairo.faq1_q'], answer: m['site.kairo.faq1_a'] },
  { question: m['site.kairo.faq2_q'], answer: m['site.kairo.faq2_a'] },
  { question: m['site.kairo.faq3_q'], answer: m['site.kairo.faq3_a'] },
  { question: m['site.kairo.faq4_q'], answer: m['site.kairo.faq4_a'] },
  { question: m['site.kairo.faq5_q'], answer: m['site.kairo.faq5_a'] },
  { question: m['site.kairo.faq6_q'], answer: m['site.kairo.faq6_a'] },
  { question: m['site.kairo.faq7_q'], answer: m['site.kairo.faq7_a'] },
  { question: m['site.kairo.faq8_q'], answer: m['site.kairo.faq8_a'] },
] as const;

const GET_ITEMS = [
  m['site.kairo.get1'],
  m['site.kairo.get2'],
  m['site.kairo.get3'],
  m['site.kairo.get4'],
  m['site.kairo.get5'],
] as const;

const BEAT_ITEMS = [
  { title: m['site.kairo.beat1_title'], desc: m['site.kairo.beat1_desc'] },
  { title: m['site.kairo.beat2_title'], desc: m['site.kairo.beat2_desc'] },
  { title: m['site.kairo.beat3_title'], desc: m['site.kairo.beat3_desc'] },
  { title: m['site.kairo.beat4_title'], desc: m['site.kairo.beat4_desc'] },
  { title: m['site.kairo.beat5_title'], desc: m['site.kairo.beat5_desc'] },
] as const;

const FILM_ITEMS = [
  { title: m['site.kairo.film1_title'], desc: m['site.kairo.film1_desc'] },
  { title: m['site.kairo.film2_title'], desc: m['site.kairo.film2_desc'] },
  { title: m['site.kairo.film3_title'], desc: m['site.kairo.film3_desc'] },
  { title: m['site.kairo.film4_title'], desc: m['site.kairo.film4_desc'] },
  { title: m['site.kairo.film5_title'], desc: m['site.kairo.film5_desc'] },
] as const;

const MISTAKE_ITEMS = [
  m['site.kairo.mistake1'],
  m['site.kairo.mistake2'],
  m['site.kairo.mistake3'],
  m['site.kairo.mistake4'],
  m['site.kairo.mistake5'],
  m['site.kairo.mistake6'],
] as const;

const LEGAL_ITEMS = [
  m['site.kairo.legal1'],
  m['site.kairo.legal2'],
  m['site.kairo.legal3'],
  m['site.kairo.legal4'],
  m['site.kairo.legal5'],
] as const;

const TREND_LINKS = [
  [m['site.kairo.related_crazy'], '/crazy-frog-ai'],
  [m['site.kairo.related_wassup'], '/wassup-in-a-minute-ai'],
  [m['site.kairo.related_zombie'], '/ai-zombie-hug'],
  [m['site.kairo.related_hotel'], '/hotel-lobby-ai'],
  [m['site.kairo.related_bulin'], '/bulin-47-ai'],
] as const;

const sectionTitle =
  'text-3xl font-semibold tracking-tight sm:text-4xl text-white/92';
const bodyText = 'text-sm leading-7 text-white/48 sm:text-base';
const panel = 'rounded-[22px] border border-white/8 bg-white/[0.03] p-5 sm:p-6';

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer(),
      },
    })),
  };
}

function howToJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: m['site.kairo.how_title'](),
    totalTime: 'PT2M',
    step: [
      {
        '@type': 'HowToStep',
        name: m['site.kairo.step1_title'](),
        text: m['site.kairo.step1_desc'](),
      },
      {
        '@type': 'HowToStep',
        name: m['site.kairo.step2_title'](),
        text: m['site.kairo.step2_desc'](),
      },
      {
        '@type': 'HowToStep',
        name: m['site.kairo.step3_title'](),
        text: m['site.kairo.step3_desc'](),
      },
    ],
  };
}

function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bad Times AI Video Maker',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to try; generation uses credits',
    },
    url: absoluteUrl('/kairo-bad-times'),
    description: m['site.kairo.page_description'](),
  };
}

function videoJsonLd() {
  const primary = KAIRO_EXAMPLE_CASES[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: m['site.kairo.example_title'](),
    description: m['site.kairo.example_caption'](),
    contentUrl: absoluteUrl(primary.src),
    thumbnailUrl: absoluteUrl(primary.poster),
    uploadDate: DEMO_UPLOAD_DATE,
    duration: primary.duration,
  };
}

function KairoBadTimesPage() {
  return (
    <div className="min-h-screen bg-[hsl(28_25%_9%)] text-[rgb(237,234,222)]">
      <SeoJsonLd value={faqJsonLd()} />
      <SeoJsonLd value={howToJsonLd()} />
      <SeoJsonLd value={softwareApplicationJsonLd()} />
      <SeoJsonLd value={videoJsonLd()} />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(154,91,55,0.22),transparent_38%),linear-gradient(to_bottom,rgba(13,10,9,0.5),hsl(28_25%_9%)_78%)]" />
          <div className="absolute top-24 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[rgba(204,144,92,0.055)] blur-3xl" />
        </div>

        <div className="relative z-20">
          <SiteHeader />
        </div>

        <main className="relative z-10">
          <section className="mx-auto max-w-7xl px-4 pt-14 pb-12 text-center sm:pt-20 md:px-5 md:pb-16">
            <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[rgba(204,144,92,0.2)] bg-[rgba(204,144,92,0.07)] px-3 py-1.5 text-xs font-medium text-[rgb(220,155,99)]">
              <WandSparkles className="size-3.5" />
              {m['site.kairo.hero_badge']()}
            </div>

            <h1 className="mx-auto max-w-4xl text-[34px] leading-[1.08] font-bold tracking-[-1.4px] sm:text-[44px] md:text-[56px]">
              {m['site.kairo.hero_title']()}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              {m['site.kairo.hero_description']()}
            </p>

            <div
              id="generator"
              className="mt-8 scroll-mt-24 text-left sm:mt-10"
            >
              <KairoBadTimesGeneratorPanel />
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 pb-14 md:px-5 md:pb-16">
            <h2 className="text-xs font-semibold tracking-[0.18em] text-[rgb(204,144,92)] uppercase">
              {m['site.kairo.example_title']()}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {KAIRO_EXAMPLE_CASES.map((clip, index) => (
                <div
                  key={clip.id}
                  className="overflow-hidden rounded-[20px] border border-white/10 bg-black/25 p-2.5"
                >
                  <video
                    src={clip.src}
                    poster={clip.poster}
                    title={`${m['site.kairo.example_title']()} ${index + 1}`}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-[9/16] w-full rounded-xl bg-black object-contain"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/34">
              {m['site.kairo.example_caption']()}
            </p>
          </section>

          <section className="border-y border-white/7 bg-white/[0.018]">
            <div className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
              <h2 className={sectionTitle}>{m['site.kairo.what_title']()}</h2>
              <div className={`mt-5 space-y-4 ${bodyText}`}>
                <p>{m['site.kairo.what_body1']()}</p>
                <p>{m['site.kairo.what_body2']()}</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 md:px-5 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className={sectionTitle}>{m['site.kairo.how_title']()}</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Images,
                  title: m['site.kairo.step1_title'],
                  desc: m['site.kairo.step1_desc'],
                },
                {
                  icon: Film,
                  title: m['site.kairo.step2_title'],
                  desc: m['site.kairo.step2_desc'],
                },
                {
                  icon: Sparkles,
                  title: m['site.kairo.step3_title'],
                  desc: m['site.kairo.step3_desc'],
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title()} className={`${panel} text-left`}>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[rgba(204,144,92,0.1)] text-[rgb(220,155,99)]">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-white/90">
                      {step.title()}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {step.desc()}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className={`mx-auto mt-8 max-w-3xl text-center ${bodyText}`}>
              {m['site.kairo.how_tip']()}
            </p>
          </section>

          <section className="border-y border-white/7 bg-white/[0.018]">
            <div className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
              <h2 className={sectionTitle}>{m['site.kairo.get_title']()}</h2>
              <ul className={`mt-6 list-disc space-y-3 pl-5 ${bodyText}`}>
                {GET_ITEMS.map((item) => (
                  <li key={item()}>{item()}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
            <h2 className={sectionTitle}>{m['site.kairo.names_title']()}</h2>
            <p className={`mt-5 ${bodyText}`}>
              {m['site.kairo.names_intro']()}
            </p>
            <div className="mt-7 overflow-x-auto rounded-2xl border border-white/8">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-white/80">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      {m['site.kairo.names_col_where']()}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {m['site.kairo.names_col_who']()}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/7 text-white/48">
                  <tr>
                    <td className="px-4 py-3 text-white/80">
                      {m['site.kairo.names_row1_where']()}
                    </td>
                    <td className="px-4 py-3">
                      {m['site.kairo.names_row1_who']()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-white/80">
                      {m['site.kairo.names_row2_where']()}
                    </td>
                    <td className="px-4 py-3">
                      {m['site.kairo.names_row2_who']()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={`mt-5 ${bodyText}`}>
              {m['site.kairo.names_outro']()}
            </p>
          </section>

          <section className="border-y border-white/7 bg-white/[0.018]">
            <div className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
              <h2 className={sectionTitle}>{m['site.kairo.beats_title']()}</h2>
              <p className={`mt-5 ${bodyText}`}>
                {m['site.kairo.beats_intro']()}
              </p>
              <ol className={`mt-6 list-decimal space-y-3 pl-5 ${bodyText}`}>
                {BEAT_ITEMS.map((item) => (
                  <li key={item.title()}>
                    <strong className="text-white/80">{item.title()}</strong>{' '}
                    {item.desc()}
                  </li>
                ))}
              </ol>
              <p className={`mt-5 ${bodyText}`}>
                {m['site.kairo.beats_outro']()}
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
            <h2 className={sectionTitle}>{m['site.kairo.film_title']()}</h2>
            <p className={`mt-5 ${bodyText}`}>{m['site.kairo.film_intro']()}</p>
            <ul className={`mt-6 list-disc space-y-3 pl-5 ${bodyText}`}>
              {FILM_ITEMS.map((item) => (
                <li key={item.title()}>
                  <strong className="text-white/80">{item.title()}</strong>{' '}
                  {item.desc()}
                </li>
              ))}
            </ul>
          </section>

          <section className="border-y border-white/7 bg-white/[0.018]">
            <div className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
              <h2 className={sectionTitle}>
                {m['site.kairo.mistakes_title']()}
              </h2>
              <ul className={`mt-6 list-disc space-y-3 pl-5 ${bodyText}`}>
                {MISTAKE_ITEMS.map((item) => (
                  <li key={item()}>{item()}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
            <h2 className={sectionTitle}>{m['site.kairo.faq_title']()}</h2>
            <div className="mt-7 divide-y divide-white/7 rounded-2xl border border-white/8 bg-white/[0.02] px-5 sm:px-7">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question()} className="group py-5">
                  <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-white/82 sm:text-base">
                    {item.question()}
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
                    {item.answer()}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="border-y border-white/7 bg-white/[0.018]">
            <div className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
              <h2 className={sectionTitle}>{m['site.kairo.legal_title']()}</h2>
              <ul className={`mt-6 list-disc space-y-3 pl-5 ${bodyText}`}>
                {LEGAL_ITEMS.map((item) => (
                  <li key={item()}>{item()}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 pb-16 md:px-5 md:pb-20">
            <div className="rounded-[26px] border border-white/8 bg-white/[0.02] p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                {m['site.kairo.related_title']()}
              </h2>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href="#generator"
                  className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-[rgb(204,144,92)] px-5 text-sm font-semibold text-[rgb(247,246,243)] transition hover:brightness-105"
                >
                  {m['site.kairo.hero_cta']()}
                </a>
                <Link
                  href="/"
                  className="text-sm text-white/70 underline-offset-2 transition hover:text-[rgb(220,155,99)] hover:underline"
                >
                  {m['site.kairo.related_photo']()}
                </Link>
              </div>
              <p className="mt-6 text-sm font-medium text-white/55">
                {m['site.kairo.related_trends']()}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {TREND_LINKS.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition hover:border-[rgba(204,144,92,0.35)] hover:text-[rgb(220,155,99)]"
                  >
                    {label()}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/kairo-bad-times')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const title = m['site.kairo.page_title']({}, { locale });
    const description = m['site.kairo.page_description']({}, { locale });
    const { canonical, alternates } = localeLinks('/kairo-bad-times', locale);
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
  component: KairoBadTimesPage,
});
