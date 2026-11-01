import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';

/**
 * English-only SEO body for /live-face-swap.
 * Localized mirrors are intentionally not advertised until translated pages exist.
 */

const FAQ_ITEMS = [
  {
    question: 'Is this a real-time face swap?',
    answer:
      'The studio above can preview a swap on your camera feed. The documented clip path edits footage you already recorded and returns a downloadable video file — not a virtual camera for calls.',
  },
  {
    question: 'Do I need a webcam, OBS or any app?',
    answer:
      'No app or OBS. The live preview uses your browser camera; the clip path is upload-only on desktop or mobile.',
  },
  {
    question: 'Can I use it on Zoom, TikTok Live or a stream?',
    answer:
      'Not as a virtual camera inside the broadcast. Record the segment, run the clip path, then play the swapped file back on stream.',
  },
  {
    question: 'How long does a clip take to process?',
    answer:
      'Usually minutes; you can close the tab and return to your creations.',
  },
  {
    question: 'How long can the clip be?',
    answer: '3 to 120 seconds. Shorter clips cost less.',
  },
  {
    question: 'How many photos do I need?',
    answer: 'One clear portrait.',
  },
  {
    question: 'How much does one 3-second clip cost?',
    answer: 'About 21 credits (≈$0.25) at 480p, roughly double at 720p.',
  },
  {
    question: 'Can it handle two people in one clip?',
    answer:
      'It may, but identity targeting in crowded or multi-person shots is not guaranteed.',
  },
  {
    question: 'Does it keep the original audio?',
    answer: 'Not guaranteed — check the output before publishing.',
  },
  {
    question: 'Can I use the result commercially?',
    answer:
      'Only with the rights and consent to the footage and likeness, and within the site terms.',
  },
  {
    question: 'Is a live face swap the same as a deepfake?',
    answer:
      'It is the same underlying technique. Use it on people who have agreed, and label synthetic content where a platform requires it.',
  },
  {
    question: 'Which is better for social video — this or a webcam swap?',
    answer:
      'For recorded short-form clips, this. For calls and live streams, a real-time tool.',
  },
] as const;

const PRICING_ROWS = [
  ['3s (minimum)', '≈21 credits (≈$0.25)', '≈42 credits (≈$0.50)'],
  ['10s', '≈68 credits (≈$0.80)', '≈136 credits (≈$1.60)'],
  ['15s', '≈102 credits (≈$1.20)', '≈204 credits (≈$2.40)'],
] as const;

const COMPARE_ROWS = [
  ['Output', 'Live feed for calls and streams', 'Downloadable MP4'],
  ['Setup', 'Webcam, desktop app, sometimes OBS', 'Browser only'],
  ['Works on mobile', 'Rarely', 'Yes'],
  ['Fast motion / quick head turns', 'Often breaks up', 'Handled per frame'],
  ['Cost model', 'Monthly subscription', 'Per clip, prepaid'],
  ['Best for', 'Calls, live streams', 'Short-form video, skits, reactions'],
] as const;

const SPECS: Array<[string, string]> = [
  ['Source video', 'MP4 / MOV / WebM, 3–120s, ≤100 MB'],
  ['Portrait', 'One JPG / PNG, ≤12 MB'],
  ['Output', '480p or 720p MP4'],
  ['Processing', 'Minutes; you can leave the page and come back'],
  ['Pricing', 'Prepaid credits by second and resolution, no subscription'],
  ['Requirements', 'Browser only — no install, no webcam, no GPU'],
];

export function getLiveFaceSwapFaqSchemaItems() {
  return FAQ_ITEMS.map((item) => ({
    question: item.question,
    answer: item.answer,
  }));
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-white/55">
        {children}
      </div>
    </section>
  );
}

export function LiveFaceSwapSeoSections() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-14 px-4 pt-8 pb-20 text-left md:pt-12">
      <Section
        id="what-it-means"
        title={'What "live face swap" means on this page'}
      >
        <p>
          Most tools that advertise a live face swap run a model on your camera
          feed while you are still on it — for calls, streams, or a mirror on
          screen. This page covers both a browser live preview (above) and a
          documented clip-based path: upload footage you already recorded, swap
          the head across every frame, and download a video that plays like live
          action.
        </p>
        <p>
          The clip path exists on purpose. A recorded clip lets the model spend
          far more compute per frame than a webcam pipeline can, so short-form
          video — TikTok, Reels, Shorts — usually comes out cleaner than a
          stream capture. The downloadable result is a live-action face swap
          file, not a virtual camera for Zoom or OBS. If you need a face changed
          inside an ongoing call or stream, use a dedicated real-time
          virtual-camera tool.
        </p>
      </Section>

      <Section id="how-to" title="How to make a live face changer clip">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>Upload the clip. </strong>
            MP4, MOV or WebM, 3–120 seconds, up to 100 MB, one clearly visible
            subject. Steady, well-lit footage gives the model more to work with.
          </li>
          <li>
            <strong>Add one portrait. </strong>A single JPG or PNG up to 12 MB —
            front-facing or three-quarter view, even lighting, face
            unobstructed. You do not need multiple angles.
          </li>
          <li>
            <strong>Choose 480p or 720p. </strong>Draft at 480p, final at 720p.
            720p costs roughly twice as much per second.
          </li>
          <li>
            <strong>Check the estimate and generate. </strong>Credits are
            calculated from source duration (rounded up, 3 second minimum) and
            resolution before you confirm. Failed runs are refunded.
          </li>
        </ol>
      </Section>

      <Section id="pricing" title="What a live face swap clip costs">
        <p>
          Clip generations use prepaid credits (no subscription), charged at the
          Creator pack rate ($9.99 / 850 credits). The live studio preview above
          bills separately in renewable prepaid chunks while connected — check
          the studio estimate before you start.
        </p>
        <p>Clip path examples:</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/12 text-left text-white/70">
                <th className="py-2 pr-3 font-medium">Source length</th>
                <th className="py-2 pr-3 font-medium">480p</th>
                <th className="py-2 font-medium">720p</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map(([length, p480, p720]) => (
                <tr key={length} className="border-b border-white/8">
                  <td className="py-2 pr-3 font-medium text-white/80">
                    {length}
                  </td>
                  <td className="py-2 pr-3">{p480}</td>
                  <td className="py-2">{p720}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Credit packs start at $4.99 (400 credits). Your exact estimate appears
          after upload, before you confirm. See{' '}
          <Link href="/pricing" className="underline underline-offset-2">
            pricing
          </Link>{' '}
          for packs and how credits work across tools.
        </p>
      </Section>

      <Section id="compare" title="Real-time webcam vs. clip-based face swap">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/12 text-left text-white/70">
                <th className="py-2 pr-3 font-medium" />
                <th className="py-2 pr-3 font-medium">Real-time webcam swap</th>
                <th className="py-2 font-medium">This tool (clip-based)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([label, webcam, clip]) => (
                <tr key={label} className="border-b border-white/8">
                  <td className="py-2 pr-3 font-medium text-white/80">
                    {label}
                  </td>
                  <td className="py-2 pr-3">{webcam}</td>
                  <td className="py-2">{clip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Real-time tools trade quality for latency. When you are not on camera,
          that trade makes no sense — record the shot, swap it once, post the
          version that looks right.
        </p>
      </Section>

      <Section id="best-clips" title="Clips that take a live face swap best">
        <p>
          Dance and trend clips — fast, full-body movement where the face only
          needs to track the head; try the{' '}
          <Link
            href="/coldplay-kiss-cam"
            className="underline underline-offset-2"
          >
            Coldplay kiss cam
          </Link>{' '}
          or{' '}
          <Link href="/shan-shen-bu" className="underline underline-offset-2">
            Shan Shen Bu
          </Link>{' '}
          templates. Reaction and talking-head shots — a stable camera and one
          subject is the easiest input. Crowd and kiss-cam footage — works when
          the target face stays clear of other people. Costume and character
          bits — swap in a face that fits the bit rather than buying a mask.
          Presenter and product reads — a different face on the same read,
          without reshooting. Also see{' '}
          <Link href="/ai-zombie-hug" className="underline underline-offset-2">
            AI Zombie Hug
          </Link>{' '}
          and browse more ideas on{' '}
          <Link
            href="/genjutsu-prompts"
            className="underline underline-offset-2"
          >
            Genjutsu prompts
          </Link>
          .
        </p>
      </Section>

      <Section
        id="vs-video-face-swap"
        title="Live face swap vs. video face swap on this site"
      >
        <p>
          Both use the same head-swap model on the same kind of input.{' '}
          <Link
            href="/video-face-swap"
            className="underline underline-offset-2"
          >
            Video face swap
          </Link>{' '}
          is the general workflow and handles any clip up to two minutes. Live
          face swap is the short-clip route: 3–15 second takes, one portrait,
          generated fast and cheaply enough to try several versions. Read the{' '}
          <Link
            href="/video-face-swap"
            className="underline underline-offset-2"
          >
            video face swap guide
          </Link>{' '}
          if you need the full spec sheet, or start here if you are making short
          social clips.
        </p>
      </Section>

      <Section id="what-changes" title="What changes — and what stays">
        <p>
          <strong>Changes: </strong>
          facial features, hair and head outline, adapted to each frame&apos;s
          angle and lighting.
        </p>
        <p>
          <strong>Designed to stay: </strong>
          body pose, clothing, background and framing.
        </p>
        <p>
          <strong>Known limits: </strong>
          fast cuts, heavy motion blur, hands covering the face, profile-only
          angles and crowded scenes can reduce identity consistency. One clear
          subject per clip is the reliable case.
        </p>
      </Section>

      <Section id="consent" title="Consent, likeness and responsible use">
        <p>
          Only upload footage and portraits you have the rights to use. Do not
          create content of people who have not agreed to it, and check the
          rules of the platform you are posting to — several treat synthetic
          face content as requiring a label. The tool does not grant you any
          rights to anyone&apos;s likeness.
        </p>
      </Section>

      <Section
        id="specs"
        title={'Specs at a glance (also covers "live face swap online")'}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] border-collapse text-sm">
            <tbody>
              {SPECS.map(([label, value]) => (
                <tr key={label} className="border-b border-white/8">
                  <td className="py-2 pr-4 font-medium text-white/80">
                    {label}
                  </td>
                  <td className="py-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="faq" title="FAQ">
        <div className="space-y-5">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <h3 className="font-medium text-white/88">{item.question}</h3>
              <p className="mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
