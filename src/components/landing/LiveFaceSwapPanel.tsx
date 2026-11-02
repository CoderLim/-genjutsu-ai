import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  CameraOff,
  Check,
  CircleAlert,
  Loader2,
  Maximize2,
  Minimize2,
  Square,
  Upload,
  WandSparkles,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import {
  LIVE_FACE_SWAP_CREDITS,
  LIVE_FACE_SWAP_CREDITS_PER_SECOND,
  LIVE_FACE_SWAP_MAX_CHUNKS,
} from '@/modules/live-face-swap/pricing';
import { ApiError, apiPost } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useCreditGate } from '@/hooks/use-credit-gate';
import { useUserCredits } from '@/hooks/use-user-credits';
import { InsufficientCreditsModal } from '@/components/credits/insufficient-credits-modal';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const LUCY_ENDPOINT = 'decart/lucy-2-5/realtime';
const LUCY_PROMPT =
  'Replace only the visible person’s face with the face of the person in the reference image. ' +
  'Maintain the original hair, hairstyle, body, clothes, head movement, expressions, camera framing, ' +
  'lighting, and background. Keep all non-face areas unchanged. Make the replacement natural and stable.';

const REFERENCE_GALLERY = [
  {
    id: 'face-animal-cat-01',
    label: 'Cat',
    url: 'https://r2.livefaceswap.ai/reference-gallery/v1/gallery-portrait-thumbnails/face-animal-cat-01.webp',
  },
  {
    id: 'custom-character-033',
    label: 'Character 33',
    url: 'https://r2.livefaceswap.ai/reference-gallery/v1/gallery-portrait-thumbnails/custom-character-033.webp',
  },
  {
    id: 'custom-character-020',
    label: 'Character 20',
    url: 'https://r2.livefaceswap.ai/reference-gallery/v1/gallery-portrait-thumbnails/custom-character-020.webp',
  },
  {
    id: 'custom-character-018',
    label: 'Character 18',
    url: 'https://r2.livefaceswap.ai/reference-gallery/v1/gallery-portrait-thumbnails/custom-character-018.webp',
  },
  {
    id: 'custom-character-075',
    label: 'Character 75',
    url: 'https://r2.livefaceswap.ai/reference-gallery/v1/gallery-portrait-thumbnails/custom-character-075.webp',
  },
] as const;

/** Diagnostics are local-only; scrub references and credentials before logging. */
function safeRealtimeDiagnostic(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/data:[^\s"']+/gi, '[image-data]')
    .replace(/Bearer\s+[^\s"'<>]+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[jwt]')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .slice(0, 320);
}

type Phase =
  | 'idle'
  | 'camera-starting'
  | 'camera-ready'
  | 'connecting'
  | 'live';
type ReferenceSource = 'upload' | 'gallery' | null;

type PaidState = {
  issuedAtMs: number;
  paidUntilMs: number;
  sequence: number;
  chargedCredits: number;
  creditsPerChunk: number;
  balance: number;
};
type TokenResponse = PaidState & { token: string; sessionId: string };
type SettlementResponse = {
  status: 'settled' | 'pending' | 'not-started';
  billedSeconds: number;
  reservedCredits: number;
  chargedCredits: number;
  refundedCredits: number;
  uncoveredCredits: number;
  billingBasis: 'server-token-wallclock';
};

type LiveHandle = {
  close: () => Promise<void>;
  ready: Promise<unknown>;
};

/** Visual-only clock, independent of server-side credit settlement. */
function formatLiveDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

const buttonPrimary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f0b06b,#d77b42)] px-5 py-2.5 text-sm font-semibold text-[#24170f] shadow-[0_8px_20px_rgba(215,123,66,0.12)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
const buttonSecondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-35';
const buttonStart =
  'inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-[linear-gradient(135deg,#8fd48a,#4faf5a)] px-8 py-3.5 text-base font-semibold text-[#102214] shadow-[0_14px_36px_rgba(79,175,90,0.28)] transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40';

function readPhoto(
  file: File
): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error('Could not read the reference photo.'));
    reader.onload = () => {
      const data = reader.result;
      if (typeof data !== 'string') {
        reject(new Error('Invalid image file.'));
        return;
      }
      const image = new Image();
      image.onload = () =>
        resolve({
          data,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      image.onerror = () =>
        reject(new Error('Could not decode the reference photo.'));
      image.src = data;
    };
    reader.readAsDataURL(file);
  });
}

export function LiveFaceSwapPanel() {
  const { data: authSession, isPending: authPending } = useSession();
  const queryClient = useQueryClient();
  const creditsQuery = useUserCredits(Boolean(authSession?.user));
  const creditGate = useCreditGate({
    balance: creditsQuery.data?.balance,
    email: authSession?.user?.email,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [referenceData, setReferenceData] = useState<string | null>(null);
  const [referenceSource, setReferenceSource] = useState<ReferenceSource>(null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [billing, setBilling] = useState<PaidState | null>(null);
  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [settling, setSettling] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const outputStageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<MediaStream | null>(null);
  const outputRef = useRef<MediaStream | null>(null);
  const liveRef = useRef<LiveHandle | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const photoUrlRef = useRef<string | null>(null);
  const photoSelectionRef = useRef(0);
  const operationRef = useRef(0);
  const paidRef = useRef<PaidState | null>(null);
  const liveStartedAtRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const renewingRef = useRef(false);
  const cameraAttemptRef = useRef(0);

  const releaseTimers = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = null;
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      const stage = outputStageRef.current;
      setIsFullscreen(Boolean(stage && document.fullscreenElement === stage));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () =>
      document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const stage = outputStageRef.current;
    if (!stage) return;
    try {
      if (document.fullscreenElement === stage) {
        await document.exitFullscreen();
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      await stage.requestFullscreen();
    } catch {
      setError((current) => current || 'Fullscreen is not available here.');
    }
  }, []);

  const stopLive = useCallback(async () => {
    operationRef.current += 1;
    const endedSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    renewingRef.current = false;
    if (endedSessionId) setSettling(true);
    releaseTimers();
    const live = liveRef.current;
    liveRef.current = null;
    outputRef.current = null;
    if (outputVideoRef.current) {
      outputVideoRef.current.pause();
      outputVideoRef.current.srcObject = null;
    }
    setHasRemoteVideo(false);
    setElapsed(0);
    liveStartedAtRef.current = null;
    paidRef.current = null;
    setBilling(null);
    setPhase(cameraRef.current?.active ? 'camera-ready' : 'idle');
    if (live) {
      try {
        // Close the actual WebRTC handle BEFORE requesting server-side settlement.
        await live.close();
      } catch {
        // The session may already be disconnected. Request reconciliation anyway.
      }
    }
    if (endedSessionId) {
      try {
        const result = await apiPost<SettlementResponse>(
          '/api/live-face-swap/stop',
          {
            sessionId: endedSessionId,
          }
        );
        if (result.status !== 'not-started') {
          setSettlement(result);
        }
        if (result.status === 'pending') {
          setError(
            'Your session needs a billing review. Reserved credits are held.'
          );
        }
        void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      } catch {
        // A failed token request may never have created a billable session.
        // Preserve the original authorization/connection error instead of
        // replacing it with a misleading billing-only message.
        setError(
          (current) =>
            current ||
            'Live billing is awaiting reconciliation. Please contact support if your credits do not return.'
        );
      } finally {
        setSettling(false);
      }
    }
  }, [queryClient, releaseTimers]);

  const stopAll = useCallback(() => {
    cameraAttemptRef.current += 1;
    void stopLive();
    const camera = cameraRef.current;
    cameraRef.current = null;
    camera?.getTracks().forEach((track) => track.stop());
    if (localVideoRef.current) {
      localVideoRef.current.pause();
      localVideoRef.current.srcObject = null;
    }
    setPhase('idle');
  }, [stopLive]);

  useEffect(() => {
    const onPageHide = () => {
      // Navigation can cancel normal promises. Send one idempotent best-effort
      // settlement beacon before tearing down; the normal close may retry.
      const sessionId = sessionIdRef.current;
      if (sessionId && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/live-face-swap/stop',
          new Blob([JSON.stringify({ sessionId })], {
            type: 'application/json',
          })
        );
      }
      stopAll();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopAll();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopAll();
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, [stopAll]);

  function clearReference() {
    photoSelectionRef.current += 1;
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhotoPreview(null);
    setReferenceData(null);
    setReferenceSource(null);
    setGalleryId(null);
  }

  function selectGalleryReference(item: (typeof REFERENCE_GALLERY)[number]) {
    if (phase === 'connecting' || phase === 'live') return;
    setError('');
    photoSelectionRef.current += 1;
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setGalleryId(item.id);
    setReferenceSource('gallery');
    setPhotoPreview(item.url);
    setReferenceData(item.url);
  }

  async function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || phase === 'connecting' || phase === 'live') return;
    setError('');
    const selection = ++photoSelectionRef.current;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG or WebP portrait.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('The reference photo must be under 8 MB.');
      return;
    }
    try {
      const photo = await readPhoto(file);
      if (selection !== photoSelectionRef.current) return;
      if (photo.width < 512 || photo.height < 512) {
        setError('Use a reference photo at least 512 × 512 pixels.');
        return;
      }
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      const url = URL.createObjectURL(file);
      photoUrlRef.current = url;
      setGalleryId(null);
      setReferenceSource('upload');
      setPhotoPreview(url);
      setReferenceData(photo.data);
    } catch (cause) {
      if (selection === photoSelectionRef.current)
        setError(
          cause instanceof Error ? cause.message : 'Invalid reference image.'
        );
    }
  }

  async function startCamera() {
    if (cameraRef.current || phase !== 'idle') return;
    setError('');
    setPhase('camera-starting');
    const attempt = ++cameraAttemptRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera access requires an HTTPS page and a supported browser.'
        );
      }
      const camera = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      if (attempt !== cameraAttemptRef.current) {
        camera.getTracks().forEach((track) => track.stop());
        return;
      }
      cameraRef.current = camera;
      const track = camera.getVideoTracks()[0];
      if (track) track.onended = stopAll;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = camera;
        await localVideoRef.current.play().catch(() => undefined);
      }
      setPhase('camera-ready');
    } catch (cause) {
      if (attempt !== cameraAttemptRef.current) return;
      setPhase('idle');
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not open the camera. Check your browser permissions.'
      );
    }
  }

  async function startLive() {
    const camera = cameraRef.current;
    if (
      !camera ||
      !camera.active ||
      !referenceData ||
      !consent ||
      settling ||
      phase !== 'camera-ready'
    ) {
      return;
    }
    if (!authSession?.user) {
      // No #hash: better-auth social callbackURL rejects fragments.
      window.location.href = `/sign-in?callbackUrl=${encodeURIComponent('/live-face-swap')}`;
      return;
    }
    const balance = creditsQuery.data?.balance;
    if (typeof balance === 'number' && balance < LIVE_FACE_SWAP_CREDITS) {
      creditGate.open({ requiredCredits: LIVE_FACE_SWAP_CREDITS, balance });
      return;
    }
    setError('');
    setElapsed(0);
    setClockMs(Date.now());
    setHasRemoteVideo(false);
    setBilling(null);
    setSettlement(null);
    liveStartedAtRef.current = null;
    paidRef.current = null;
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    setPhase('connecting');
    const operation = ++operationRef.current;

    try {
      // Load on interaction only: no WebRTC work occurs during SSR.
      const [{ fal }, { lucyRealtime }] = await Promise.all([
        import('@fal-ai/client'),
        import('@fal-ai/client/realtime'),
      ]);
      if (operation !== operationRef.current) return;
      const handle = fal.realtime.open(lucyRealtime(), {
        endpointId: LUCY_ENDPOINT,
        input: {
          prompt: LUCY_PROMPT,
          reference_image_url: referenceData,
          enable_prompt_expansion: false,
        },
        localStream: camera,
        tokenExpirationSeconds: 120,
        tokenProvider: async (app) => {
          let paid: TokenResponse;
          try {
            paid = await apiPost<TokenResponse>('/api/live-face-swap/token', {
              app,
              sessionId,
            });
          } catch (cause) {
            // Show the real token endpoint failure before async stop cleanup.
            // Provider errors remain sanitized by the server API envelope.
            if (
              operation === operationRef.current &&
              cause instanceof ApiError
            ) {
              setError(cause.message);
            }
            // api-client unwraps the same { code, message, data } envelope
            // for success and credit-insufficient error responses.
            if (cause instanceof ApiError) {
              const data = cause.data as
                | { requiredCredits?: unknown; balance?: unknown }
                | undefined;
              if (
                operation === operationRef.current &&
                typeof data?.requiredCredits === 'number' &&
                typeof data.balance === 'number'
              ) {
                queryClient.setQueryData(['user-credits'], {
                  balance: data.balance,
                });
                creditGate.open({
                  requiredCredits: data.requiredCredits,
                  balance: data.balance,
                });
              }
            }
            throw cause;
          }
          if (
            !paid?.token ||
            !Number.isFinite(paid.paidUntilMs) ||
            !Number.isSafeInteger(paid.sequence)
          ) {
            throw new Error('Invalid live authorization response');
          }
          if (operation !== operationRef.current) {
            // Tab was closed while authorization was in flight.
            void apiPost('/api/live-face-swap/stop', { sessionId }).catch(
              () => undefined
            );
            throw new Error('Live session canceled');
          }
          paidRef.current = paid;
          setBilling(paid);
          void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
          return paid.token;
        },
        onMedia: (remoteStream) => {
          if (operation !== operationRef.current) return;
          // Visual timer starts at first received AI video track, not token
          // issuance. Repeated media callbacks and renewals cannot reset it.
          if (
            liveStartedAtRef.current === null &&
            remoteStream.getVideoTracks().length > 0
          ) {
            liveStartedAtRef.current = Date.now();
            setElapsed(0);
          }
          outputRef.current = remoteStream;
          if (outputVideoRef.current) {
            outputVideoRef.current.srcObject = remoteStream;
            void outputVideoRef.current.play().catch(() => undefined);
          }
          setHasRemoteVideo(true);
        },
        onDiagnostic: (event) => {
          // Fal's experimental realtime SDK emits protocol-level information
          // that distinguishes token, SDP/ICE and transport failures.
          // Logs are in the tester's browser only; never send raw inputs,
          // photos, JWTs or network URLs to our server or customer UI.
          if (operation !== operationRef.current) return;
          if (event.kind === 'progress') {
            console.debug('[live-face-swap] negotiation phase:', event.phase);
          } else if (event.kind === 'failure') {
            console.warn(
              '[live-face-swap] protocol failure:',
              safeRealtimeDiagnostic(event.message)
            );
          }
        },
        onState: (state) => {
          if (operation !== operationRef.current) return;
          if (state === 'live') {
            setPhase('live');
            // A duplicate SDK 'live' event must not create extra renewal loops.
            if (durationTimerRef.current) return;
            durationTimerRef.current = setInterval(() => {
              if (operation !== operationRef.current) return;
              const now = Date.now();
              setClockMs(now);
              const paid = paidRef.current;
              if (!paid) return;
              const liveStartedAt = liveStartedAtRef.current;
              if (liveStartedAt !== null) {
                setElapsed(
                  Math.max(0, Math.floor((now - liveStartedAt) / 1000))
                );
              }
              if (now >= paid.paidUntilMs) {
                setError(
                  'Your live session ended. Start a new session to continue.'
                );
                void stopLive();
                return;
              }
              if (
                !outputRef.current?.getVideoTracks().length ||
                now < paid.paidUntilMs - 8_000 ||
                renewingRef.current
              )
                return;

              if (paid.sequence + 1 >= LIVE_FACE_SWAP_MAX_CHUNKS) {
                setError(
                  'This session has reached its safety limit. You may start another.'
                );
                void stopLive();
                return;
              }
              renewingRef.current = true;
              const expectedSequence = paid.sequence + 1;
              void apiPost<PaidState>('/api/live-face-swap/renew', {
                sessionId,
                sequence: expectedSequence,
              })
                .then((next) => {
                  if (operation !== operationRef.current) return;
                  if (
                    next.sequence < expectedSequence ||
                    next.paidUntilMs <= paid.paidUntilMs
                  ) {
                    throw new Error('Unexpected renewal response');
                  }
                  paidRef.current = next;
                  setBilling(next);
                  void queryClient.invalidateQueries({
                    queryKey: ['user-credits'],
                  });
                })
                .catch((cause) => {
                  if (operation !== operationRef.current) return;
                  // A timeout/503 may have charged the chunk; retry using
                  // the SAME sequence on the next tick (idempotent).
                  if (
                    cause instanceof ApiError &&
                    cause.data &&
                    typeof (cause.data as { balance?: unknown }).balance ===
                      'number'
                  ) {
                    const data = cause.data as {
                      balance: number;
                      requiredCredits?: number;
                    };
                    if (typeof data.requiredCredits === 'number') {
                      queryClient.setQueryData(['user-credits'], {
                        balance: data.balance,
                      });
                      creditGate.open({
                        balance: data.balance,
                        requiredCredits: data.requiredCredits,
                      });
                      setError(
                        'Not enough credits to continue the live session.'
                      );
                      void stopLive();
                    }
                  }
                })
                .finally(() => {
                  if (operation !== operationRef.current) return;
                  renewingRef.current = false;
                });
            }, 500);
          }
          if (state === 'failed') {
            // The SDK reports onState('failed') AND onError for the same
            // terminal failure. Do not stop here: stopLive increments
            // operationRef and used to discard the later diagnostic callback.
            // onError will close the handle and settle the reservation.
            setError(
              (current) => current || 'The live connection failed. Try again.'
            );
          } else if (state === 'closed') {
            void stopLive();
          }
        },
        onError: (cause) => {
          if (operation === operationRef.current) {
            // Keep enough detail to identify a negotiation failure without
            // leaking ephemeral tokens, uploaded images or personal URLs.
            console.error('[live-face-swap] realtime SDK error:', {
              name: cause instanceof Error ? cause.name : typeof cause,
              message: safeRealtimeDiagnostic(
                cause instanceof Error ? cause.message : String(cause)
              ),
            });
            setError(
              (current) =>
                current ||
                'Unable to connect to the live service. Check your access and try again.'
            );
            void stopLive();
          }
        },
      });
      liveRef.current = handle;
      // Signaling failures are also delivered through onError. Observe ready to
      // avoid an unhandled rejection if the component closes during negotiation.
      void handle.ready.catch(() => undefined);
    } catch (cause) {
      if (operation === operationRef.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Could not start the live session.'
        );
        void stopLive();
      }
    }
  }

  const active = phase === 'live' || phase === 'connecting';
  const canStart = Boolean(
    referenceData && consent && cameraRef.current && !active && !settling
  );
  // The provider session clock starts at token issuance. Keep the customer
  // estimate separate from the visible Live timer (which starts on video).
  const estimatedCredits = billing
    ? Math.ceil(
        Math.max(0, Math.ceil((clockMs - billing.issuedAtMs) / 1000)) *
          LIVE_FACE_SWAP_CREDITS_PER_SECOND
      )
    : 0;
  const cameraOn = phase !== 'idle' && phase !== 'camera-starting';
  const statusLabel =
    phase === 'connecting'
      ? 'Connecting'
      : phase === 'live'
        ? hasRemoteVideo
          ? `Live · ${formatLiveDuration(elapsed)}`
          : 'Live · Waiting for AI output'
        : settling
          ? 'Settling'
          : phase === 'camera-ready'
            ? 'Ready'
            : phase === 'camera-starting'
              ? 'Opening camera'
              : 'Idle';

  return (
    <div className="mx-auto w-full max-w-[1180px] overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(34,26,23,0.94)] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
      <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-white/10 p-4 sm:p-5 lg:border-r lg:border-b-0">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5">
              <p className="text-sm font-semibold text-white/88">
                Camera input
              </p>
              <span className="text-xs text-white/40">
                {cameraOn ? 'Preview on' : 'Preview off'}
              </span>
            </div>
            <div className="relative aspect-[4/3] bg-[#130f0e]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'absolute inset-0 h-full w-full -scale-x-100 object-cover',
                  !cameraOn && 'opacity-0'
                )}
              />
              {!cameraOn ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                  <button
                    type="button"
                    className={cn(
                      buttonSecondary,
                      'min-h-12 rounded-full bg-white px-5 text-[#1a1410] hover:bg-white/92'
                    )}
                    disabled={phase === 'camera-starting' || settling}
                    onClick={() => void startCamera()}
                  >
                    {phase === 'camera-starting' ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    {phase === 'camera-starting' ? 'Opening…' : 'Open camera'}
                  </button>
                </div>
              ) : null}
            </div>
            {cameraOn && !active ? (
              <div className="border-t border-white/10 px-3.5 py-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white/80"
                  onClick={stopAll}
                  disabled={settling}
                >
                  <CameraOff className="size-3.5" /> Turn camera off
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white/88">Reference</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void pickPhoto(event)}
            />
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={active || settling}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed text-white/55 transition',
                  referenceSource === 'upload'
                    ? 'border-[#d79b6a]/70 bg-[rgba(215,155,106,0.12)] text-[#edb685]'
                    : 'border-white/18 bg-white/[0.03] hover:border-[#d79b6a]/45 hover:bg-white/[0.05]',
                  (active || settling) && 'opacity-40'
                )}
              >
                {referenceSource === 'upload' && photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Uploaded reference"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#d79b6a] text-[#24170f] shadow">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    <span className="text-[11px] font-medium">Upload</span>
                  </>
                )}
              </button>
              {REFERENCE_GALLERY.map((item) => {
                const selected = galleryId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={active || settling}
                    title={item.label}
                    aria-pressed={selected}
                    onClick={() => selectGalleryReference(item)}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-xl border transition',
                      selected
                        ? 'border-[#7ec87a] ring-2 ring-[#7ec87a]/35'
                        : 'border-white/10 hover:border-white/25',
                      (active || settling) && 'opacity-40'
                    )}
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    {selected ? (
                      <span className="absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#4faf5a] text-white shadow">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {photoPreview ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-[11px] text-white/40">
                  {referenceSource === 'gallery'
                    ? 'Gallery reference selected'
                    : 'Custom upload selected'}
                </p>
                {!active && !settling ? (
                  <button
                    type="button"
                    className="shrink-0 text-[11px] font-medium text-[#dc9b63] underline underline-offset-2"
                    onClick={clearReference}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-[11px] leading-4 text-white/35">
                Upload a portrait or pick a preset. Uploads: JPG/PNG/WebP · min
                512×512 · max 8 MB.
              </p>
            )}
          </section>

          <label className="flex cursor-pointer items-start gap-2.5 px-0.5 text-[11px] leading-4 text-white/55">
            <input
              type="checkbox"
              checked={consent}
              disabled={active || settling}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-3.5 accent-[#d99a68]"
            />
            I have permission to use this reference face and agree to live
            processing of my camera stream.
          </label>

          <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5 text-[11px] leading-4 text-white/60">
            <div className="flex justify-between gap-2">
              <span>Balance</span>
              <span className="font-semibold text-[#edb685] tabular-nums">
                {creditsQuery.data?.balance?.toLocaleString() ?? '—'}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-2">
              <span>Live rate</span>
              <span>{LIVE_FACE_SWAP_CREDITS_PER_SECOND} credits/s</span>
            </div>
            {billing && active ? (
              <div className="mt-1 flex justify-between gap-2">
                <span>Estimated charge</span>
                <span className="tabular-nums">{estimatedCredits} credits</span>
              </div>
            ) : null}
            {settling ? (
              <div className="mt-2 text-amber-200/80">
                Calculating final charge and unused-credit refund…
              </div>
            ) : null}
            {settlement ? (
              <div className="mt-2 rounded-lg border border-white/10 p-2 text-white/80">
                <div className="flex justify-between gap-2">
                  <span>
                    {settlement.status === 'settled'
                      ? 'Final charge'
                      : 'Estimated usage (not finalized)'}
                  </span>
                  <span className="font-semibold">
                    {settlement.chargedCredits} credits ·{' '}
                    {settlement.billedSeconds}s
                  </span>
                </div>
                {settlement.status === 'settled' ? (
                  <div className="flex justify-between gap-2">
                    <span>Credits returned</span>
                    <span>{settlement.refundedCredits} credits</span>
                  </div>
                ) : (
                  <p className="mt-1 text-amber-200/80">
                    Final billing is pending review.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <p className="px-0.5 text-[11px] leading-4 text-white/35">
            Live usage includes connection setup. Final credits are calculated
            when you stop. Preview-only pilot.
          </p>

          {error ? (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3 text-[11px] leading-4 text-red-200"
            >
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" /> {error}
            </div>
          ) : null}
        </div>

        <div
          ref={outputStageRef}
          className={cn(
            'flex min-h-[520px] flex-col p-4 sm:p-5',
            isFullscreen && 'h-screen min-h-0 w-screen bg-[rgba(34,26,23,0.98)]'
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white/88">
              Live AI output
            </p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tabular-nums',
                  phase === 'live'
                    ? 'border-green-500/30 bg-green-500/10 text-green-300'
                    : 'border-white/10 bg-white/[0.04] text-white/55'
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    phase === 'live'
                      ? 'animate-pulse bg-green-400'
                      : 'bg-white/35'
                  )}
                />
                {statusLabel}
              </span>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.09] hover:text-white"
                aria-label={
                  isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                }
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0c0b]">
            <video
              ref={outputVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-contain"
            />

            {!hasRemoteVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                {phase === 'connecting' || settling ? (
                  <>
                    <Loader2 className="size-10 animate-spin text-[#d79b6a]" />
                    <p className="text-sm text-white/45">
                      {settling
                        ? 'Settling credits…'
                        : 'Preparing live output…'}
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={buttonStart}
                      disabled={!canStart || authPending}
                      onClick={() => void startLive()}
                    >
                      <WandSparkles className="size-5" />
                      Start Face Swap
                    </button>
                    <p className="max-w-sm text-xs leading-5 text-white/40">
                      {!cameraOn
                        ? 'Open your camera, pick a reference, then start.'
                        : !referenceData
                          ? 'Choose a reference face to continue.'
                          : !consent
                            ? 'Confirm consent before starting.'
                            : `${LIVE_FACE_SWAP_CREDITS_PER_SECOND} credits/s · usage includes connection setup`}
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {active ? (
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => void stopLive()}
                >
                  <Square className="size-4" /> Stop
                </button>
              </div>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-white/35">
            Keep one person centered with clear lighting for best results.
            Real-time preview only.
          </p>
        </div>
      </div>
      <InsufficientCreditsModal
        gate={creditGate.gate}
        pack={creditGate.recommendedPack}
        checkoutLoading={creditGate.checkoutLoading}
        onClose={creditGate.clear}
        onBuy={() => void creditGate.buy()}
      />
    </div>
  );
}
