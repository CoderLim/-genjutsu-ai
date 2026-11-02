/**
 * User-visible metadata for a Live Face Swap session.
 *
 * A live session is a preview, not a saved video. Never expose the provider
 * JWT, reference image, WebRTC details, or aiTask.options in My Creations.
 * Only the root aiTask (options.kind = 'live-session') is listable; per-chunk
 * 'live-topup' credit rows must never become separate creations.
 */
export type LiveSessionHistory = {
  state: 'completed' | 'starting' | 'unconfirmed' | 'review' | 'not-started';
  billedSeconds: number | null;
  finalCredits: number | null;
  returnedCredits: number | null;
  endedAtMs: number | null;
};

function objectJson(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const result: unknown = JSON.parse(raw);
    return result !== null && typeof result === 'object' && !Array.isArray(result)
      ? (result as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function wholeNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function getLiveSessionHistory(task: {
  status: string;
  taskInfo: string | null;
  taskResult: string | null;
}): LiveSessionHistory {
  const result = objectJson(task.taskResult);
  const info = objectJson(task.taskInfo);
  if (task.status === 'ended') {
    if (
      result?.status === 'settled' &&
      wholeNonnegative(result.billedSeconds) &&
      wholeNonnegative(result.chargedCredits) &&
      wholeNonnegative(result.refundedCredits)
    ) {
      return {
        state: 'completed',
        billedSeconds: result.billedSeconds,
        finalCredits: result.chargedCredits,
        returnedCredits: result.refundedCredits,
        endedAtMs:
          typeof info?.endedAtMs === 'number' &&
          Number.isSafeInteger(info.endedAtMs) &&
          info.endedAtMs > 0
            ? info.endedAtMs
            : null,
      };
    }
    // An "ended" record with no valid signed-off settlement is not completed.
    return {
      state: 'review', billedSeconds: null, finalCredits: null,
      returnedCredits: null, endedAtMs: null,
    };
  }
  if (task.status === 'refunded' || task.status === 'insufficient') {
    return {
      state: 'not-started', billedSeconds: null, finalCredits: 0,
      returnedCredits: null, endedAtMs: null,
    };
  }
  return {
    state:
      task.status === 'active'
        ? 'unconfirmed'
        : task.status === 'reserved'
          ? 'starting'
          : 'review',
    billedSeconds: null,
    finalCredits: null,
    returnedCredits: null,
    endedAtMs: null,
  };
}
