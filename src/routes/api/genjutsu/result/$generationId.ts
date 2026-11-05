import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  getGenjutsuTaskByGenerationId,
  getGenjutsuTaskById,
  parseGenjutsuTaskInfo,
} from '@/modules/genjutsu/billing';
import {
  getGenjutsuE2EUrlForStorageKey,
  isGenjutsuE2EMockEnabled,
} from '@/modules/genjutsu/e2e-mock';
import {
  assertGenjutsuResultKeyOwned,
  createGenjutsuR2ReadUrl,
} from '@/modules/genjutsu/storage';
import { hasPermission } from '@/modules/rbac/service';

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function redirectResponse(url: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}

/**
 * Safe download filename prefix from task.options.product (e.g. chipmunks-dance).
 */
export function genjutsuResultDownloadFilename(
  generationId: string,
  product?: string | null
) {
  const prefix =
    typeof product === 'string' && /^[a-z0-9-]+$/i.test(product.trim())
      ? product.trim().toLowerCase()
      : 'genjutsu';
  return `${prefix}-${generationId.slice(0, 8)}.mp4`;
}

function productFromTaskOptions(options?: string | null): string | undefined {
  if (!options) return undefined;
  try {
    const parsed = JSON.parse(options) as { product?: unknown };
    return typeof parsed.product === 'string' ? parsed.product : undefined;
  } catch {
    return undefined;
  }
}

async function attachmentResponse(params: {
  sourceUrl: string;
  filename: string;
}) {
  const upstream = await fetch(params.sourceUrl);
  if (!upstream.ok || !upstream.body) {
    return errorResponse('Failed to fetch generation result', 502);
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') || 'video/mp4',
    'Content-Disposition': `attachment; filename="${params.filename}"`,
    'Cache-Control': 'private, no-store, max-age=0',
  });
  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { generationId: string };
}) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return errorResponse('Unauthorized', 401);

  const isAdmin = await hasPermission(session.user.id, 'admin.*');
  const task = isAdmin
    ? await getGenjutsuTaskByGenerationId(params.generationId)
    : await getGenjutsuTaskById({
        generationId: params.generationId,
        userId: session.user.id,
      });
  if (!task || task.status !== 'completed') {
    return errorResponse('Generation result not found', 404);
  }

  const wantsDownload =
    new URL(request.url).searchParams.get('download') === '1';
  const filename = genjutsuResultDownloadFilename(
    params.generationId,
    productFromTaskOptions(task.options)
  );

  const parsed = parseGenjutsuTaskInfo(task);
  const videoKey =
    typeof parsed.result?.videoKey === 'string' ? parsed.result.videoKey : null;

  if (videoKey) {
    assertGenjutsuResultKeyOwned({
      userId: task.userId,
      generationId: task.id,
      videoKey,
    });

    if (isGenjutsuE2EMockEnabled()) {
      const mockUrl = getGenjutsuE2EUrlForStorageKey(videoKey);
      if (!mockUrl) return errorResponse('E2E result object not found', 404);
      return wantsDownload
        ? attachmentResponse({ sourceUrl: mockUrl, filename })
        : redirectResponse(mockUrl);
    }

    const signedUrl = await createGenjutsuR2ReadUrl(videoKey);
    return wantsDownload
      ? attachmentResponse({ sourceUrl: signedUrl, filename })
      : redirectResponse(signedUrl);
  }

  const legacyUrl =
    typeof parsed.result?.videoUrl === 'string' ? parsed.result.videoUrl : null;
  if (!legacyUrl) return errorResponse('Generation result not found', 404);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(legacyUrl, new URL(request.url).origin);
  } catch {
    return errorResponse('Invalid legacy result URL', 500);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return errorResponse('Invalid legacy result URL', 500);
  }

  const absolute = parsedUrl.toString();
  return wantsDownload
    ? attachmentResponse({ sourceUrl: absolute, filename })
    : redirectResponse(absolute);
}

export const Route = createFileRoute('/api/genjutsu/result/$generationId')({
  server: {
    handlers: { GET },
  },
});
