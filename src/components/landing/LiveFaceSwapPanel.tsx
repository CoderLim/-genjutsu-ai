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
  CircleAlert,
  Download,
  ImagePlus,
  Loader2,
  Play,
  Square,
  Video,
  WandSparkles,
  X,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { useUserCredits } from '@/hooks/use-user-credits';
import { useCreditGate } from '@/hooks/use-credit-gate';
import { InsufficientCreditsModal } from '@/components/credits/insufficient-credits-modal';
import { apiPost, ApiError } from '@/lib/api-client';
import {
  LIVE_FACE_SWAP_CREDITS,
  LIVE_FACE_SWAP_SECONDS,
  LIVE_FACE_SWAP_MAX_CHUNKS,
} from '@/modules/live-face-swap/pricing';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const RECORD_SECONDS = 10;
const LUCY_ENDPOINT = 'decart/lucy-2-5/realtime';
const LUCY_PROMPT =
  'Replace only the visible person’s face with the face of the person in the reference image. ' +
  'Maintain the original hair, hairstyle, body, clothes, head movement, expressions, camera framing, ' +
  'lighting, and background. Keep all non-face areas unchanged. Make the replacement natural and stable.';

type Phase = 'idle' | 'camera-starting' | 'camera-ready' | 'connecting' | 'live';

type PaidState = {
  issuedAtMs: number;
  paidUntilMs: number;
  sequence: number;
  chargedCredits: number;
  creditsPerChunk: number;
  balance: number;
};
type TokenResponse = PaidState & { token: string; sessionId: string };

type LiveHandle = {
  close: () => Promise<void>;
  ready: Promise<unknown>;
};

const buttonPrimary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f0b06b,#d77b42)] px-5 py-2.5 text-sm font-semibold text-[#24170f] shadow-[0_8px_20px_rgba(215,123,66,0.12)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
const buttonSecondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-35';

function getRecordMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const type of [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

function readPhoto(file: File): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the reference photo.'));
    reader.onload = () => {
      const data = reader.result;
      if (typeof data !== 'string') {
        reject(new Error('Invalid image file.'));
        return;
      }
      const image = new Image();
      image.onload = () =>
        resolve({ data, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Could not decode the reference photo.'));
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
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [billing, setBilling] = useState<PaidState | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [recordMime, setRecordMime] = useState('video/webm');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<MediaStream | null>(null);
  const outputRef = useRef<MediaStream | null>(null);
  const liveRef = useRef<LiveHandle | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordingPartsRef = useRef<Blob[]>([]);
  const recordUrlRef = useRef<string | null>(null);
  const photoUrlRef = useRef<string | null>(null);
  const photoSelectionRef = useRef(0);
  const operationRef = useRef(0);
  const paidRef = useRef<PaidState | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const renewingRef = useRef(false);
  const cameraAttemptRef = useRef(0);

  const releaseTimers = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current);
    durationTimerRef.current = null;
    recordTimerRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current);
    recordTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const stopLive = useCallback(async () => {
    operationRef.current += 1;
    const endedSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    renewingRef.current = false;
    setRenewing(false);
    if (endedSessionId) {
      void fetch('/api/live-face-swap/stop', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ sessionId: endedSessionId }),
      }).catch(() => undefined);
    }
    releaseTimers();
    stopRecording();
    const live = liveRef.current;
    liveRef.current = null;
    outputRef.current = null;
    if (outputVideoRef.current) {
      outputVideoRef.current.pause();
      outputVideoRef.current.srcObject = null;
    }
    setHasRemoteVideo(false);
    setElapsed(0);
    paidRef.current = null;
    setBilling(null);
    setPhase(cameraRef.current?.active ? 'camera-ready' : 'idle');
    if (live) {
      try {
        await live.close();
      } catch {
        // The session may already be disconnected. Local media is still released.
      }
    }
  }, [releaseTimers, stopRecording]);

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
    const onPageHide = () => stopAll();
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
      if (recordUrlRef.current) URL.revokeObjectURL(recordUrlRef.current);
    };
  }, [stopAll]);

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
      setPhotoPreview(url);
      setReferenceData(photo.data);
    } catch (cause) {
      if (selection === photoSelectionRef.current)
        setError(cause instanceof Error ? cause.message : 'Invalid reference image.');
    }
  }

  async function startCamera() {
    if (cameraRef.current || phase !== 'idle') return;
    setError('');
    setPhase('camera-starting');
    const attempt = ++cameraAttemptRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access requires an HTTPS page and a supported browser.');
      }
      const camera = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
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
    if (!camera || !camera.active || !referenceData || !consent || phase !== 'camera-ready') {
      return;
    }
    if (!authSession?.user) {
      setError('Sign in before starting a live session.');
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
          const response = await fetch('/api/live-face-swap/token', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app, sessionId }),
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok || payload?.code !== 0) {
            if (response.status === 402) {
              const data = payload?.data;
              if (
                operation === operationRef.current &&
                typeof data?.requiredCredits === 'number' &&
                typeof data?.balance === 'number'
              ) {
                creditGate.open(data);
              }
            }
            throw new Error(payload?.message || 'Live Face Swap is not available.');
          }
          const paid = payload.data as TokenResponse;
          if (
            !paid?.token ||
            !Number.isFinite(paid.paidUntilMs) ||
            !Number.isSafeInteger(paid.sequence)
          ) {
            throw new Error('Invalid live authorization response');
          }
          if (operation !== operationRef.current) {
            // Tab was closed while authorization was in flight.
            void apiPost('/api/live-face-swap/stop', { sessionId }).catch(() => undefined);
            throw new Error('Live session canceled');
          }
          paidRef.current = paid;
          setBilling(paid);
          void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
          return paid.token;
        },
        onMedia: (remoteStream) => {
          if (operation !== operationRef.current) return;
          outputRef.current = remoteStream;
          if (outputVideoRef.current) {
            outputVideoRef.current.srcObject = remoteStream;
            void outputVideoRef.current.play().catch(() => undefined);
          }
          setHasRemoteVideo(true);
        },
        onState: (state) => {
          if (operation !== operationRef.current) return;
          if (state === 'live') {
            setPhase('live');
            durationTimerRef.current = setInterval(() => {
              if (operation !== operationRef.current) return;
              const now = Date.now();
              setClockMs(now);
              const paid = paidRef.current;
              if (!paid) return;
              setElapsed(Math.max(0, Math.floor((now - paid.issuedAtMs) / 1000)));
              if (now >= paid.paidUntilMs) {
                setError('Your prepaid live time has ended. Start a new session to continue.');
                void stopLive();
                return;
              }
              if (
                !autoRenew ||
                !outputRef.current?.getVideoTracks().length ||
                now < paid.paidUntilMs - 8_000 ||
                renewingRef.current
              ) return;

              if (paid.sequence + 1 >= LIVE_FACE_SWAP_MAX_CHUNKS) {
                setError('This session has reached its safety limit. You may start another.');
                void stopLive();
                return;
              }
              renewingRef.current = true;
              setRenewing(true);
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
                  void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
                })
                .catch((cause) => {
                  if (operation !== operationRef.current) return;
                  // A timeout/503 may have charged the chunk; retry using
                  // the SAME sequence on the next tick (idempotent).
                  if (
                    cause instanceof ApiError &&
                    cause.data &&
                    typeof (cause.data as { balance?: unknown }).balance === 'number'
                  ) {
                    const data = cause.data as { balance: number; requiredCredits?: number };
                    if (typeof data.requiredCredits === 'number') {
                      creditGate.open({ balance: data.balance, requiredCredits: data.requiredCredits });
                      setError('Not enough credits to continue the live session.');
                      void stopLive();
                    }
                  }
                })
                .finally(() => {
                  if (operation !== operationRef.current) return;
                  renewingRef.current = false;
                  setRenewing(false);
                });
            }, 500);
          }
          if (state === 'failed') {
            setError('The live connection failed. Try again.');
            void stopLive();
          } else if (state === 'closed') {
            void stopLive();
          }
        },
        onError: () => {
          if (operation === operationRef.current) {
            setError('Unable to connect to the live model. Check your access and try again.');
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
        setError(cause instanceof Error ? cause.message : 'Could not start the live session.');
        void stopLive();
      }
    }
  }

  function startRecording() {
    const stream = outputRef.current;
    if (!stream || recording || phase !== 'live') return;
    const mimeType = getRecordMimeType();
    if (!mimeType) {
      setError('Video recording is not supported by this browser.');
      return;
    }
    setError('');
    if (recordUrlRef.current) URL.revokeObjectURL(recordUrlRef.current);
    recordUrlRef.current = null;
    setRecordUrl(null);
    setRecordMime(mimeType);
    recordingPartsRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingPartsRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError('Recording failed. Try again.');
        setRecording(false);
      };
      recorder.onstop = () => {
        const parts = recordingPartsRef.current;
        if (parts.length) {
          const blob = new Blob(parts, { type: mimeType });
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            recordUrlRef.current = url;
            setRecordUrl(url);
          }
        }
        recorderRef.current = null;
        setRecording(false);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setRecording(true);
      recordTimerRef.current = setTimeout(stopRecording, RECORD_SECONDS * 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Recording is not available.');
    }
  }

  const active = phase === 'live' || phase === 'connecting';
  const canStart = Boolean(referenceData && consent && authSession?.user && cameraRef.current && !active);
  const secondsLeft = billing ? Math.max(0, Math.ceil((billing.paidUntilMs - clockMs) / 1000)) : 0;
  const downloadExtension = recordMime.includes('mp4') ? 'mp4' : 'webm';

  return (
    <div className="mx-auto w-full max-w-[1120px] overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(34,26,23,0.94)] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
      <div className="grid gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-white/10 p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#dc9b63]">
              <ImagePlus className="size-4" /> Step 1
            </div>
            <h2 className="text-lg font-semibold text-white/90">Reference face</h2>
            <p className="mt-1 text-sm leading-6 text-white/45">
              Upload a clear portrait. Only use a face you have permission to edit.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void pickPhoto(event)}
          />
          {photoPreview ? (
            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/40">
              <img className="h-full w-full object-contain" src={photoPreview} alt="Reference face preview" />
              <button
                type="button"
                title="Remove reference photo"
                aria-label="Remove reference photo"
                disabled={active}
                onClick={() => {
                  photoSelectionRef.current += 1;
                  if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
                  photoUrlRef.current = null;
                  setPhotoPreview(null);
                  setReferenceData(null);
                }}
                className="absolute top-2 right-2 rounded-full bg-black/70 p-2 text-white hover:bg-black disabled:opacity-35"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={active}
              className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.025] text-white/65 hover:border-[#d79b6a]/50 hover:bg-white/[0.045] disabled:opacity-30"
            >
              <ImagePlus className="size-8 text-[#d79b6a]" />
              <span className="text-sm font-medium">Choose a face photo</span>
              <span className="text-xs text-white/35">JPG, PNG, WebP · Min 512 × 512 · Max 8 MB</span>
            </button>
          )}
          {photoPreview && !active ? (
            <button
              type="button"
              className="text-xs font-medium text-[#dc9b63] underline underline-offset-4"
              onClick={() => inputRef.current?.click()}
            >
              Change photo
            </button>
          ) : null}
          <div className="border-t border-white/10 pt-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#dc9b63]">
              <Camera className="size-4" /> Step 2
            </div>
            <h2 className="text-lg font-semibold text-white/90">Camera &amp; consent</h2>
            <p className="mt-1 text-sm leading-6 text-white/45">
              Your camera feed will be sent directly to the live AI provider while connected.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/65">
            <input
              type="checkbox"
              checked={consent}
              disabled={active}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d99a68]"
            />
            I have permission to use the reference face and agree to the real-time processing of my camera stream.
          </label>
          <div className="space-y-2">
            {phase === 'idle' || phase === 'camera-starting' ? (
              <button type="button" className={buttonSecondary + ' w-full'} disabled={phase === 'camera-starting'} onClick={() => void startCamera()}>
                {phase === 'camera-starting' ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                {phase === 'camera-starting' ? 'Opening camera...' : 'Enable camera'}
              </button>
            ) : null}
            {phase === 'camera-ready' ? (
              <button
                type="button"
                className={buttonPrimary + ' w-full'}
                disabled={!canStart || authPending}
                onClick={() => void startLive()}
              >
                <WandSparkles className="size-4" /> Start live face swap · {LIVE_FACE_SWAP_CREDITS} credits
              </button>
            ) : null}
            {active ? (
              <button type="button" className={buttonSecondary + ' w-full'} onClick={() => void stopLive()}>
                <Square className="size-4" /> Stop live swap
              </button>
            ) : null}
            {phase !== 'idle' && phase !== 'camera-starting' && !active ? (
              <button type="button" className="flex min-h-9 w-full items-center justify-center gap-2 text-xs text-white/45 hover:text-white/80" onClick={stopAll}>
                <CameraOff className="size-3.5" /> Turn camera off
              </button>
            ) : null}
          </div>
          {!authPending && !authSession?.user ? (
            <p className="text-xs text-amber-200/80">Sign in to start a live session.</p>
          ) : null}
          {error ? (
            <div role="alert" className="flex gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3 text-xs leading-5 text-red-200">
              <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
            </div>
          ) : null}
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-white/65">
            <div className="flex justify-between gap-2">
              <span>Credit balance</span>
              <span className="font-semibold text-[#edb685] tabular-nums">
                {creditsQuery.data?.balance?.toLocaleString() ?? '—'}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-2">
              <span>Live rate</span>
              <span>{LIVE_FACE_SWAP_CREDITS} credits / {LIVE_FACE_SWAP_SECONDS}s</span>
            </div>
            {billing ? (
              <>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Charged this session</span>
                  <span className="font-medium">{billing.chargedCredits} credits</span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Prepaid time left</span>
                  <span>{secondsLeft}s {renewing ? '· Renewing...' : ''}</span>
                </div>
              </>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-xs text-white/65">
            <input type="checkbox" checked={autoRenew} disabled={active}
              onChange={(event) => setAutoRenew(event.target.checked)}
              className="size-4 accent-[#d99a68]" />
            Auto-renew every {LIVE_FACE_SWAP_SECONDS}s while connected
          </label>
          <p className="text-xs leading-5 text-white/35">
            Prepaid chunks are non-refundable once the live token is issued.
            Stop anytime to avoid future renewals. Limited pilot access; provider-side
            duration enforcement is not yet available.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white/90">Live studio</h2>
              <p className="mt-1 text-sm text-white/45">Watch the camera and AI result side by side.</p>
            </div>
            <span className={'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ' +
              (phase === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-white/10 bg-white/[0.04] text-white/55')}>
              <span className={'size-1.5 rounded-full ' + (phase === 'live' ? 'animate-pulse bg-green-400' : 'bg-white/35')} />
              {phase === 'connecting' ? 'Connecting...' : phase === 'live' ? 'Live · ' + secondsLeft + 's prepaid' : phase === 'camera-ready' ? 'Camera ready' : 'Offline'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#130f0e] sm:aspect-[4/5]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              />
              {phase === 'idle' || phase === 'camera-starting' ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/35">
                  <Camera className="size-10" />
                  <span className="text-sm">Camera preview</span>
                </div>
              ) : null}
              <span className="absolute bottom-3 left-3 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-xs text-white/85">
                Original
              </span>
            </div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-[rgba(215,155,106,0.22)] bg-[#130f0e] sm:aspect-[4/5]">
              <video
                ref={outputVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              />
              {!hasRemoteVideo ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white/35">
                  {phase === 'connecting' ? <Loader2 className="size-10 animate-spin text-[#d79b6a]" /> : <WandSparkles className="size-10 text-[#d79b6a]/55" />}
                  <span className="text-sm">{phase === 'connecting' ? 'Preparing live output...' : 'AI result will appear here'}</span>
                </div>
              ) : null}
              <span className="absolute bottom-3 left-3 rounded-lg border border-[rgba(215,155,106,0.3)] bg-black/60 px-2.5 py-1 text-xs text-[#edb685]">
                AI output
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:p-4">
            <button
              type="button"
              className={recording ? buttonSecondary : buttonPrimary}
              disabled={!hasRemoteVideo || phase !== 'live'}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? <Square className="size-4" /> : <Video className="size-4" />}
              {recording ? 'Stop recording' : 'Record 10s'}
            </button>
            {recording ? (
              <span className="flex items-center gap-2 text-xs text-rose-300">
                <span className="size-2 animate-pulse rounded-full bg-rose-400" /> Recording
              </span>
            ) : null}
            {recordUrl ? (
              <a
                href={recordUrl}
                download={'genjutsu-live-face-swap.' + downloadExtension}
                className={buttonSecondary}
              >
                <Download className="size-4" /> Download
              </a>
            ) : (
              <span className="text-xs text-white/40">Record the AI output to download a short clip.</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
            <Play className="size-3.5" />
            For best results, keep one person centered with clear lighting. Lucy may alter more than just the face.
          </div>
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
