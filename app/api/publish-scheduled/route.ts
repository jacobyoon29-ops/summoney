import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

// 예약 발행 처리 — Vercel Cron, uptime 모니터, 또는 수동 호출로 실행
// Authorization: Bearer <CRON_SECRET> 헤더 필요
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('articles')
    .update({ is_published: true, published_at: now })
    .eq('is_published', false)
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', now)
    .select('id, title, scheduled_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ published: data?.length ?? 0, articles: data });
}

// Vercel Cron 용 GET (vercel.json 에서 schedule 지정)
export async function GET(req: NextRequest) {
  return POST(req);
}
