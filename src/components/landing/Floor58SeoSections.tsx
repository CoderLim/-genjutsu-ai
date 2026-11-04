import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export const FLOOR58_FAQ_ITEMS = [
  {
    question: 'What is the 58th Floor AI video?',
    answer:
      "A photo-to-video recreation of the teal-studio duet staging from Anderson .Paak and Cordae's COLORS performance. One or two photos go in, your faces come out, lips synced to the bar.",
  },
  {
    question: 'How do I make the 58th Floor AI video?',
    answer:
      'Upload one photo per performer, put the verse-taker in the first slot, and generate. The preset already holds the studio, the mic and the performance.',
  },
  {
    question: 'Do I need two photos or one?',
    answer:
      'Either. One photo with both subjects works, or upload each performer separately. The second slot is optional.',
  },
  {
    question: 'Can I do it with one person?',
    answer:
      'Yes. Upload the first person only and your face lands on the left performer while the preset carries the pair.',
  },
  {
    question: 'Do I need to find the original clip?',
    answer:
      'No. The preset supplies the performance. Upload your own 3–15s clip only if you have footage you have the rights to use.',
  },
  {
    question: 'Can I make it vertical for TikTok, Reels and Shorts?',
    answer:
      'The preset exports landscape. Crop keeping both performers in frame, pan between them on the bar, or letterbox the wide shot; a centre crop usually cuts a performer off.',
  },
  {
    question: 'How long is the clip?',
    answer:
      'It follows the reference, 5–15 seconds. A 30-second version is two renders cut together on the beat.',
  },
  {
    question: 'Is it free?',
    answer:
      'You can load the preset and choose photos before spending credits. Generation uses your credit balance and the cost is shown first.',
  },
  {
    question: 'Why does my version look fake?',
    answer:
      'Almost always the photo pair: mismatched lighting, a turned head, different crops. Replace the weaker photo before regenerating.',
  },
  {
    question: 'Can I use the original song?',
    answer:
      "For organic posts a platform's music licence usually covers you. For ads or paid work, use a track you own. Use images of yourself, pets you own, or people who agreed to appear.",
  },
] as const;

export const FLOOR58_HOW_STEPS = [
  {
    name: 'Upload one or two photos',
    text: 'One clear photo per performer, or a single shot containing both. Waist-up or full-body carries outfits better than a tight face crop; put the person who should take the verse in the first slot.',
  },
  {
    name: 'Press generate',
    text: 'The 58th Floor performance is already loaded and the duration is taken from it. Nothing uploads until you sign in and press generate — choosing a file only creates a local preview.',
  },
  {
    name: 'Add the sound and post',
    text: 'Download the MP4, upload it to TikTok, Reels or Shorts, then pick the licensed "58th Floor" sound from the platform\'s own music library rather than bundling the track into the file. Vertical feeds need a crop step first — see below.',
  },
] as const;

const CAST_IDEAS = [
  [
    'You and your best friend',
    'The default, and the version that lands: give the verse to whoever talks more, the hook reads as a reaction.',
  ],
  [
    'A couple',
    'The answering part has the better line, so it usually goes to whoever is likelier to have the last word.',
  ],
  [
    'Two coworkers',
    'The shared microphone makes it read as a duet rather than two people in one photo — a Friday team-chat version writes itself.',
  ],
  [
    'Your parents',
    'Formal outfits inside a teal studio read funnier than expected. One photo each, same light.',
  ],
  [
    'Your pets',
    'One clear photo per pet, both facing the camera; the model needs the head angle to carry the lip movement.',
  ],
  [
    'Characters or mascots',
    'Illustrated faces work when the eyes and mouth are readable. Anime stills with a side profile usually break the sync.',
  ],
] as const;

const COMPARE_ROWS = [
  [
    'What you upload',
    '1–2 photos; preset clip included',
    '4–30s source clip + references',
  ],
  [
    'Copies source motion',
    'Yes, from the preset or your own clip',
    'Yes, via Motion Transfer',
  ],
  [
    'Find the 58th Floor clip yourself',
    'No',
    'Yes, if that is the motion you want',
  ],
  ['Prompt writing', 'Not exposed', 'Optional'],
  [
    'Default output',
    'Matches the reference framing',
    'Up to 1080p, source-driven',
  ],
] as const;

const PHOTO_TIPS = [
  'One subject per photo when possible — crop a group shot to the person you mean.',
  'Both photos in similar light and from a similar angle: a daylight selfie next to a photo shot in a dark bar is the single most common reason a duo swap looks fake.',
  'Same crop for both, hairline to chin.',
  'No sunglasses, no hats pulled low, no heavy beauty filters.',
  'If the result looks off, replace the weaker photo before regenerating.',
] as const;

const EXPLORE_LINKS = [
  { label: '58th Floor AI video generator', href: '/58th-floor-ai-video' },
  { label: 'Hotel Lobby AI video generator', href: '/hotel-lobby-ai' },
  { label: 'A2O LITE AI video generator', href: '/a2o-lite-ai' },
  { label: 'Genjutsu motion transfer', href: '/' },
  { label: 'Genjutsu prompt guide', href: '/genjutsu-prompts' },
  { label: 'Credit pricing', href: '/pricing' },
] as const;

const CROP_ALT =
  'Wide 16:9 studio framing next to a 9:16 crop that keeps both performers';

function Section({
  id,
  title,
  children,
  tone = 'plain',
}: {
  id?: string;
  title: string;
  children: ReactNode;
  tone?: 'plain' | 'band';
}) {
  const inner = (
    <div className="mx-auto max-w-5xl px-4 py-14 md:px-5 md:py-20">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-sm leading-7 text-white/48 sm:text-base">
        {children}
      </div>
    </div>
  );

  if (tone === 'band') {
    return (
      <section
        id={id}
        className="scroll-mt-24 border-y border-white/7 bg-white/[0.018]"
      >
        {inner}
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-24">
      {inner}
    </section>
  );
}

export function Floor58SeoSections() {
  return (
    <>
      <Section title="What the 58th Floor AI video gives you">
        <p>
          The preset keeps the staging everyone recognises: a teal-lit studio,
          one microphone hanging between two performers, a wide two-shot with no
          cuts. Your photos control who is standing in it — identities, hair,
          outfits — while the room, the light, the mic and the blocking stay in
          place.
        </p>
        <p>
          Output is landscape and follows the reference clip&apos;s length, 5–15
          seconds. Faces are replaced on top of real performance motion, which
          is why the result moves like a performance instead of a photo pasted
          on a body.
        </p>
        <p>
          The second photo is optional. Upload only the first person and the
          preset carries the pair, with your face on the left performer.
        </p>
      </Section>

      <Section tone="band" title="What is the 58th Floor AI trend?">
        <p>
          &quot;58th Floor&quot; is the Anderson .Paak and Cordae track,
          performed as a duet on COLORS: a small teal-green room, one hanging
          microphone shared between two people, a wide shot with nowhere to
          hide. Both performances are genuinely different — one carries the
          verse, one answers on the hook — and both are moving the whole time,
          which is exactly what a face swap needs.
        </p>
        <p>
          In late October 2026, AI versions of that staging spread across
          TikTok, Reels and X. Creators kept the room, the mic and the blocking,
          and replaced the two performers with friends, couples, coworkers, pets
          and fictional characters.
        </p>
        <p>
          What this page generates is a recreation of the staging, not a
          re-upload of the original footage: the preset supplies the
          performance, your photos supply the people.
        </p>
      </Section>

      <section
        id="how-to"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-5 md:py-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[rgb(204,144,92)] uppercase">
            Three steps
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            How to make the 58th Floor AI video
          </h2>
        </div>
        <ol className="mt-9 grid gap-4 md:grid-cols-3">
          {FLOOR58_HOW_STEPS.map((step, index) => (
            <li
              key={step.name}
              className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
            >
              <p className="text-xs font-semibold tracking-[0.14em] text-[rgb(204,144,92)] uppercase">
                Step {index + 1}
              </p>
              <h3 className="mt-3 text-lg font-semibold">{step.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/42">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-5 md:pb-20">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Who people cast in the 58th Floor video
        </h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAST_IDEAS.map(([title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
            >
              <h3 className="font-semibold text-white/86">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/42">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <Section tone="band" title="The wide shot problem: getting it into 9:16">
        <p>
          The staging is a wide composition — two performers sitting toward the
          left and right thirds with the microphone hanging between them — which
          is the worst possible layout for a centre crop. Pull a straight 9:16
          window out of the middle and you keep the mic and lose both people.
          Three ways to handle it, best-looking first:
        </p>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="font-medium text-white/72">
              Crop with both performers in mind.
            </strong>{' '}
            Take a tall window that still holds both heads and the mic, even if
            side wall goes. Better than a dead-centre crop that halves both
            faces.
          </li>
          <li>
            <strong className="font-medium text-white/72">
              Pan between them on the bar.
            </strong>{' '}
            Keep the wide frame and cut a moving tall window that follows
            whoever is rapping. Hides the crop, but needs a cut per line.
          </li>
          <li>
            <strong className="font-medium text-white/72">
              Letterbox the wide export.
            </strong>{' '}
            Blur a copy behind a centred wide video, stacked into a tall canvas.
            Fast and safe, and clearly reads as a recycled wide clip.
          </li>
        </ul>
        <p>
          Word-by-word captions belong in the empty space above the
          performers&apos; heads — the one area a tall crop can safely cover.
        </p>
        <figure className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-end justify-center gap-6"
            role="img"
            aria-label={CROP_ALT}
          >
            <div className="w-full max-w-[280px]">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-teal-400/30 bg-gradient-to-br from-teal-900/80 via-teal-800/60 to-slate-900">
                <div className="absolute inset-x-[12%] top-[28%] bottom-[18%] flex justify-between">
                  <span className="w-[28%] rounded-md bg-white/25" />
                  <span className="w-[8%] rounded-full bg-white/40" />
                  <span className="w-[28%] rounded-md bg-white/25" />
                </div>
              </div>
              <figcaption className="mt-2 text-center text-xs text-white/40">
                16:9 wide two-shot
              </figcaption>
            </div>
            <div className="w-[112px]">
              <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-teal-400/30 bg-gradient-to-br from-teal-900/80 via-teal-800/60 to-slate-900">
                <div className="absolute inset-x-[8%] top-[22%] bottom-[28%] flex justify-between gap-1">
                  <span className="w-[42%] rounded-md bg-white/25" />
                  <span className="w-[10%] rounded-full bg-white/40" />
                  <span className="w-[42%] rounded-md bg-white/25" />
                </div>
              </div>
              <figcaption className="mt-2 text-center text-xs text-white/40">
                9:16 both in frame
              </figcaption>
            </div>
          </div>
          <p className="sr-only">{CROP_ALT}</p>
        </figure>
      </Section>

      <Section title="15 seconds vs the 30-second extended cut">
        <p>
          One render follows the reference you give it, 5–15 seconds. The
          standard version is a single 15-second pass that ends on the hook, so
          the last frame flows back into the first and viewers watch twice.
        </p>
        <p>
          The 30-second cut going around is two renders cut together, not one
          long generation: run the verse from your photos, run the hook from the
          same photos, join them on the beat. Keep the left/right assignment
          identical across both — the lip sync is baked into each render, so a
          swapped assignment puts the wrong mouth on the join.
        </p>
      </Section>

      <section className="border-y border-white/7 bg-white/[0.018]">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-5 md:py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            58th Floor AI vs Genjutsu
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/48 sm:text-base">
            Both workflows can take motion from a source performance. The
            difference is scope: this page preloads the 58th Floor template and
            fixes the prompt, while the Genjutsu homepage is the general
            motion-transfer and object-swap workflow.
          </p>
          <div className="mt-7 overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.035] text-white/72">
                <tr>
                  <th className="px-4 py-3 font-semibold"> </th>
                  <th className="px-4 py-3 font-semibold">This page</th>
                  <th className="px-4 py-3 font-semibold">Genjutsu (home)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/7 text-white/46">
                {COMPARE_ROWS.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${index}`}
                        className={
                          index === 0
                            ? 'px-4 py-3 font-medium text-white/72'
                            : 'px-4 py-3'
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:px-5 md:py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Photo tips for a better swap
          </h2>
          <ul className="mt-6 space-y-4">
            {PHOTO_TIPS.map((tip) => (
              <li
                key={tip}
                className="flex gap-3 text-sm leading-6 text-white/46"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[rgb(204,144,92)]" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[26px] border border-white/8 bg-white/[0.025] p-6 sm:p-7">
          <h2 className="text-3xl font-semibold tracking-tight">
            The audio question
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/46">
            Every version of this trend runs on the original commercial
            recording. For organic posts, the platform&apos;s music licence
            usually covers you — which is exactly why it is better to add the
            licensed sound inside TikTok or Instagram than to bake the track
            into the file. For ads, brand work or anything you are paid for,
            swap in a track you own: the mouth movement is generated against
            whatever audio you supply, so the format survives without the
            recording.
          </p>
        </div>
      </section>

      <Section tone="band" title="Free to set up, private by default">
        <p>
          Load the preset and choose photos before spending anything; choosing a
          file only creates a local browser preview, and your images are not
          uploaded until you sign in and press generate. Generation uses your
          credit balance and the cost is shown before you run the clip; provider
          failures refund reserved credits automatically. Use images of
          yourself, pets you own, or people who agreed to appear.
        </p>
      </Section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-5 md:pb-24">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          58th Floor AI FAQ
        </h2>
        <div className="mt-7 divide-y divide-white/7 rounded-2xl border border-white/8 bg-white/[0.02] px-5 sm:px-7">
          {FLOOR58_FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-white/82 sm:text-base">
                {item.question}
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-5">
        <div className="rounded-[26px] border border-white/8 bg-white/[0.02] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Explore more
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {EXPLORE_LINKS.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/58 transition hover:border-[rgba(204,144,92,0.35)] hover:text-[rgb(220,155,99)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
