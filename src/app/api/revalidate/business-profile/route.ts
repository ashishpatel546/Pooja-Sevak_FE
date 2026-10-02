import { revalidateTag } from 'next/cache';
import { serverApiBase } from '@/lib/api';
import { BUSINESS_PROFILE_TAG } from '@/lib/business-profile';

/**
 * Called by the admin settings page right after saving business details, so the
 * public pages show the change at once instead of after the 5-minute revalidate.
 * Only an admin token is accepted: the API itself checks it.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return Response.json({ revalidated: false }, { status: 401 });

  try {
    const res = await fetch(`${serverApiBase()}/admin/business-profile`, {
      headers: { Authorization: auth },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return Response.json({ revalidated: false }, { status: res.status === 403 ? 403 : 401 });
  } catch {
    return Response.json({ revalidated: false }, { status: 502 });
  }

  // Expire immediately: the admin expects to see the saved values on the next visit.
  revalidateTag(BUSINESS_PROFILE_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
