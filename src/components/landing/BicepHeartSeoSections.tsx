import { CheckCircle2 } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

/** Visible FAQ + FAQPage JSON-LD must stay character-identical. Answers ~40–70 words. */
export const BICEP_HEART_FAQ_ITEMS = [
  {
    question: 'What is the bicep heart trend?',
    answer:
      'The bicep heart trend is a short social-video pose that took off in late October 2026. Two people flex the arms between them so the curves form a heart, or one person finishes the shape with a hand on their own bicep. Search interest jumped from nearly zero on October 29 and was still climbing into early November.',
  },
  {
    question: 'How do you do the bicep heart pose?',
    answer:
      'Stand side-on to the camera. Flex one or both near-side arms to about ninety degrees so the forearm arcs form a heart, with the notch pointing up. For the solo version, press a thumb into the flexed bicep to carve that notch. Shoot vertical for three to eight seconds with even light and no camera move.',
  },
  {
    question: 'Can I do the bicep heart trend alone?',
    answer:
      'Yes. The one-arm version uses one flexed arm as the top curve and the other hand on the bicep for the center notch. The heart reads smaller than the two-person version, but it still lands clearly when you shoot from the side and keep the notch facing the top of the frame.',
  },
  {
    question: 'Is it “bicep heart” or “biceps heart trend”?',
    answer:
      'Both spellings show up in searches and captions. “Bicep heart” is the shorter form people type first; “biceps heart trend” is currently the faster-rising variant. Treat them as the same pose when you search, caption, or title a post — platforms usually group the queries together.',
  },
  {
    question: 'Why does my bicep heart look wrong?',
    answer:
      'Four common causes: the elbow angle is too tight or too open, you faced the camera straight-on so the notch collapses, the heart’s notch is not pointing up, or the light is too flat or too harsh. Fix the side angle and the ninety-degree flex first, then check the notch and lighting before you reshoot.',
  },
  {
    question: 'Is the bicep heart trend still growing?',
    answer:
      'As of November 5, 2026, interest was still elevated and that day was not over yet. Pose trends often cool within weeks, so if you are reading this later, check current search interest before you invest in a long edit, a paid boost, or a dedicated landing page around the phrase.',
  },
  {
    question: "Can I use someone else's bicep heart video?",
    answer:
      'No. The original clip’s video and audio belong to whoever posted them. Downloading someone else’s take and reuploading it is the fastest path to a takedown complaint. Film your own pose, or restyle only a clip you filmed — or one you have written permission to use from everyone on camera.',
  },
  {
    question: 'Can I make a bicep heart video with AI?',
    answer:
      'Yes, but the motion still has to come from a real clip you filmed. Upload that reference, describe the new look, and keep the same people and arm movement. AI restyles the world around the pose; it does not invent a convincing bicep heart from a still photo alone. See credit costs on the pricing page.',
  },
] as const;

const POSE_STEPS = [
  {
    name: 'Find your second arm',
    text: 'The two-person version needs someone standing on your near side so the inside forearms can meet. You can also do it alone — the heart will be smaller, but the shape still reads.',
  },
  {
    name: 'Turn side-on to the camera',
    text: 'A straight-on shot flattens the overlapping elbows and hides the notch at the top of the heart. Shoot from the side so the forearm curves stay visible.',
  },
  {
    name: 'Flex to about 90 degrees',
    text: 'Too tight and you get a semicircle, not a heart. Too open and a forearm blocks the other person. Aim for a clear right angle at each elbow.',
  },
  {
    name: 'Lock the notch at the top',
    text: 'The dent of the heart should face the top of the frame. Lift your chin and check the silhouette before you hit record.',
  },
  {
    name: 'Shoot vertical, 3–8 seconds',
    text: 'Use 9:16, front light, and a locked phone. These clips travel as loops — you do not need a camera move.',
  },
] as const;

const AI_STEPS = [
  {
    name: 'Film the pose first',
    text: 'Record a real 5–10 second take. That clip is the motion source — AI keeps the arm movement and does not invent the pose from a still.',
  },
  {
    name: 'Upload it as a reference clip',
    text: 'Drop the file into the generator at the top of this page. Use a clean vertical take with one or two people in frame.',
  },
  {
    name: 'Describe the new look, not the pose',
    text: 'Write for “same people, new world.” Start from: Keep the same two people and the same arm movement. Restyle the scene as… — then name the style, lighting, and set.',
  },
  {
    name: 'Pick 720p for drafts, 1080p for the final',
    text: '720p is cheaper while you test styles. Switch to 1080p once the look is locked. Credit costs are listed on the pricing page before you spend.',
  },
  {
    name: 'Download and post',
    text: 'Export the vertical MP4, add audio you have the rights to, and post. Label the result as AI where the platform asks.',
  },
] as const;

const STYLES = [
  {
    name: 'Anime glow',
    prompt:
      'Keep the same two people and the bicep heart pose. Restyle as 2D anime with a soft rim light and a dark blue background.',
  },
  {
    name: 'Cinematic film',
    prompt:
      'Same subject, same arm movement. Restyle as a 35mm cinematic shot, warm key light, shallow depth of field.',
  },
  {
    name: 'Neon gym',
    prompt:
      'Keep the pose. Restyle the room as a neon-lit gym at night, magenta and cyan light, wet floor reflections.',
  },
  {
    name: 'Black and white',
    prompt: 'Same motion. Restyle as high-contrast black and white film grain.',
  },
] as const;

const COMPARE_ROWS = [
  [
    'What you need',
    'A phone and a clear side angle',
    'Your own 3–8s clip + a style prompt',
  ],
  ['Time to first version', 'A few takes', 'A few minutes after upload'],
  ['Skills', 'Posing and framing', 'None beyond writing the look'],
  [
    'Audio',
    'Add a licensed track when you post',
    'Same — use audio you have rights to',
  ],
  [
    'Control over the result',
    'Full control of take and cut',
    'Motion locked; look is editable',
  ],
  [
    'Best for',
    'Organic posts and tutorials',
    'Trying styles without reshooting the pose',
  ],
] as const;

const AUP_RULES = [
  'Only upload a clip of yourself, or a clip where everyone on camera gave you written permission. Everyone must be 18 or older.',
  'Do not download an original post and reupload it — the video and audio belong to the person who posted them. That is the fastest way to get a takedown.',
  'No nudity, sexual content, violence, or hate. Outputs carry an AI-generated watermark.',
] as const;

const RELATED = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Genjutsu prompt ideas', href: '/genjutsu-prompts' },
  { label: 'Bulin 47 AI', href: '/bulin-47-ai' },
  { label: 'Rumpelstiltskin AI', href: '/ai-rumpelstiltskin' },
] as const;

export function BicepHeartSeoSections() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-5">
      <section id="what-is-bicep-heart" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            What the bicep heart trend is
          </h2>
          <div className="text-muted-foreground mt-5 space-y-4 text-sm leading-7 sm:text-base">
            <p>
              Late on October 29, 2026, search interest in the bicep heart went
              from zero to a spike; by November 3 it was still climbing. What
              spread is not one video but a pose everyone can copy: two people
              turn the curves of their flexed arms into a heart shape.
            </p>
            <p>
              Two versions circulate on social platforms. Open the original
              posts before you publish a tutorial that cites them — do not treat
              second-hand descriptions as the source of truth.
            </p>
            <ul className="list-disc space-y-3 pl-5">
              <li>
                <span className="text-foreground font-medium">
                  Two-person version
                </span>{' '}
                (the cut that took off first): stand side by side and flex the
                arms that sit between you. The arcs of the two near forearms
                meet into a heart.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  One-person version
                </span>
                : one arm curves into the top half of the heart; the other
                hand&apos;s thumb presses into that bicep to carve the notch in
                the middle.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="how-to-pose" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            How to do the bicep heart pose
          </h2>
          <ol className="mt-8 space-y-8">
            {POSE_STEPS.map((step, index) => (
              <li key={step.name}>
                <h3 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                  <span className="text-muted-foreground mr-2 font-medium">
                    {index + 1}.
                  </span>
                  {step.name}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7 sm:text-base">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="how-to-ai" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            How to make an AI bicep heart video
          </h2>
          <p className="text-muted-foreground mt-5 text-sm leading-7 sm:text-base">
            The trend lives in the motion. Film the pose yourself, then restyle
            the world around it — keep the arm movement locked. Credit costs are
            on the{' '}
            <Link
              href="/pricing"
              className="text-foreground underline-offset-4 hover:underline"
            >
              pricing page
            </Link>
            .
          </p>
          <ol className="mt-8 space-y-8">
            {AI_STEPS.map((step, index) => (
              <li key={step.name}>
                <h3 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                  <span className="text-muted-foreground mr-2 font-medium">
                    {index + 1}.
                  </span>
                  {step.name}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7 sm:text-base">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="styles" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Bicep heart styles people are making
          </h2>
          <p className="text-muted-foreground mt-5 text-sm leading-7 sm:text-base">
            Copy a prompt into the generator. More restyle ideas live on the{' '}
            <Link
              href="/genjutsu-prompts"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Genjutsu prompts
            </Link>{' '}
            page.
          </p>
          <div className="mt-8 space-y-6">
            {STYLES.map((style) => (
              <div key={style.name}>
                <h3 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                  {style.name}
                </h3>
                <pre className="border-border/60 bg-card/40 text-muted-foreground mt-3 overflow-x-auto rounded-xl border p-4 text-left text-sm leading-7 whitespace-pre-wrap">
                  {style.prompt}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Filming it yourself vs. restyling it in a generator
          </h2>
          <div className="border-border/60 mt-8 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-card/50 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold"> </th>
                  <th className="px-4 py-3 font-semibold">Film it yourself</th>
                  <th className="px-4 py-3 font-semibold">
                    Restyle in a generator
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground divide-border/50 divide-y">
                {COMPARE_ROWS.map(([label, film, restyle]) => (
                  <tr key={label}>
                    <th className="text-foreground px-4 py-3 align-top font-medium">
                      {label}
                    </th>
                    <td className="px-4 py-3 align-top leading-7">{film}</td>
                    <td className="px-4 py-3 align-top leading-7">{restyle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="before-you-upload" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Before you upload
          </h2>
          <ul className="mt-6 space-y-4">
            {AUP_RULES.map((rule) => (
              <li
                key={rule}
                className="text-muted-foreground flex gap-2 text-sm leading-7 sm:text-base"
              >
                <CheckCircle2 className="text-primary mt-1 size-4 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-5 text-sm leading-7 sm:text-base">
            Uploads that break these rules are rejected. Full rules are in our{' '}
            <Link
              href="/terms-of-service"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Acceptable Use Policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Bicep heart trend FAQ
          </h2>
          <div className="mt-8 space-y-8">
            {BICEP_HEART_FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <h3 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                  {item.question}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7 sm:text-base">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="border-border/70 bg-card/60 mx-auto max-w-5xl rounded-[26px] border p-6 text-center sm:p-10">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Upload your clip, describe the new look, keep the same arm movement
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm leading-7">
            Film the bicep heart first. Then restyle the scene without changing
            the pose — see{' '}
            <Link
              href="/pricing"
              className="text-foreground underline-offset-4 hover:underline"
            >
              pricing
            </Link>{' '}
            before you generate.
          </p>
          <a
            href="#generator"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[rgb(204,144,92)] px-6 text-sm font-semibold text-[rgb(247,246,243)] transition hover:brightness-105"
          >
            Go to the generator
          </a>
          <ul className="text-muted-foreground mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {RELATED.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="underline-offset-4 transition hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
