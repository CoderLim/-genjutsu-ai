/** A replayable effect run: cancelled work cannot commit, and settles once. */
export function createTemplateApplication(
  onSettled: (ok: boolean) => void,
  wasReplayed: () => boolean
) {
  const controller = new AbortController();
  let settled = false;
  const settle = (ok: boolean) => {
    if (settled) return;
    settled = true;
    onSettled(ok);
  };
  return {
    signal: controller.signal,
    finish(ok: boolean) {
      if (!controller.signal.aborted) settle(ok);
    },
    cancel() {
      controller.abort();
      // Strict Mode runs cleanup/setup synchronously. Let its replacement own
      // the outcome instead of clearing the parent's request during replay.
      queueMicrotask(() => {
        if (!wasReplayed()) settle(false);
      });
    },
  };
}
