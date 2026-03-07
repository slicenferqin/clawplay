import { notFound } from 'next/navigation';

import { getSoulBySlug } from '@/lib/souls';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const soul = await getSoulBySlug(slug);

  if (!soul) {
    notFound();
  }

  const { searchParams } = new URL(request.url);
  const isDownload = searchParams.get('download') === '1';

  return new Response(soul.rawSoul, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': isDownload ? 'attachment; filename="SOUL.md"' : `inline; filename="${soul.slug}.md"`,
    },
  });
}
