import { createFileRoute } from '@tanstack/react-router';
import { RadioTower } from 'lucide-react';

import { LiveFaceSwapPanel } from '@/components/landing/LiveFaceSwapPanel';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { SiteHeader } from '@/components/landing/SiteHeader';

export const Route = createFileRoute('/live-face-swap')({
  head: () => ({
    meta: [
      { title: 'Live Face Swap | Genjutsu AI' },
      {
        name: 'description',
        content: 'Live camera face swap studio (limited pilot).',
      },
      // Functional pilot only. SEO content, canonical, hreflang and sitemap
      // will be added in a separate release after editorial review.
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: LiveFaceSwapPage,
});

function LiveFaceSwapPage() {
  return (
    <div className="min-h-screen bg-[hsl(28_25%_9%)] text-[rgb(237,234,222)]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(154,91,55,0.22),transparent_38%),linear-gradient(to_bottom,hsl(13,10,9,0.5),hsl(28_25%_9%)_78%)]" />
          <div className="absolute top-24 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[rgba(204,144,92,0.055)] blur-3xl" />
        </div>

        <div className="relative z-20">
          <SiteHeader />
        </div>

        <main className="relative z-10">
          <section className="mx-auto max-w-7xl px-4 pt-10 pb-12 text-center sm:pt-14 md:px-5">
            <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[rgba(204,144,92,0.2)] bg-[rgba(204,144,92,0.07)] px-3 py-1.5 text-xs font-medium text-[rgb(220,155,99)]">
              <RadioTower className="size-3.5" />
              REAL-TIME AI VIDEO
            </div>
            <h1 className="mx-auto max-w-4xl text-[34px] leading-[1.08] font-bold tracking-[-1.4px] sm:text-[44px] md:text-[56px]">
              Live Face Swap
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              Add a reference face, turn on your camera, and watch an AI-generated
              swap as you move. Stop the live session whenever you are done.
            </p>
            <div id="generator" className="mt-8 scroll-mt-24 text-left sm:mt-10">
              <LiveFaceSwapPanel />
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
