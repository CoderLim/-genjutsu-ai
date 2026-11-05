import { useRouterState } from '@tanstack/react-router';

function readParam(params: URLSearchParams): string | null {
  return (
    params.get('showpreview') ??
    params.get('showPreview') ??
    params.get('SHOWPREVIEW')
  );
}

function parseShowPaidPreview(search: unknown): boolean {
  let raw: string | null = null;

  if (typeof search === 'string') {
    raw = readParam(
      new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    );
  } else if (search && typeof search === 'object') {
    const record = search as Record<string, unknown>;
    const value =
      record.showpreview ?? record.showPreview ?? record.SHOWPREVIEW;
    raw = value == null ? null : String(value);
  }

  if (raw == null && typeof window !== 'undefined') {
    raw = readParam(new URLSearchParams(window.location.search));
  }

  if (raw == null) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/**
 * Paid short Preview is hidden by default. Opt in with `?showpreview=1`
 * for cheaper smoke tests without exposing Preview to normal visitors.
 */
export function useShowPaidPreview(): boolean {
  const search = useRouterState({ select: (s) => s.location.search });
  return parseShowPaidPreview(search);
}
