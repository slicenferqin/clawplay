import { NextRequest, NextResponse } from 'next/server';

import { getSoulPackDownloadFileName, getSoulPackManifestBySlug } from '@/lib/soul-pack/service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const manifest = await getSoulPackManifestBySlug(slug);

  if (!manifest) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const isDownload = request.nextUrl.searchParams.get('download') === '1';
  const body = JSON.stringify(manifest, null, 2);

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': isDownload
        ? `attachment; filename="${getSoulPackDownloadFileName(slug)}"`
        : `inline; filename="${getSoulPackDownloadFileName(slug)}"`,
    },
  });
}
