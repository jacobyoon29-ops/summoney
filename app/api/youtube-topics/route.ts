import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

type Category = '다른나라' | '경제' | '사람';

function parseDurationSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return Infinity;
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  const s = parseInt(match[3] ?? '0', 10);
  return h * 3600 + m * 60 + s;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { category } = (await req.json()) as { category: Category };
  if (!['다른나라', '경제', '사람'].includes(category)) {
    return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY 환경변수가 없습니다.' }, { status: 500 });
  }
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 환경변수가 없습니다.' }, { status: 500 });
  }

  // 1. 한국 인기 영상 50개 가져오기 (Videos: list chart=mostPopular)
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: 'KR',
    maxResults: '50',
    videoCategoryId: '0',
    key: youtubeKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? 'YouTube API 실패' },
      { status: 500 }
    );
  }

  // 2. 쇼츠(60초 이하) + 조회수 2만 이상 필터링
  const filtered = (data.items ?? [])
    .filter((item: Record<string, unknown>) => {
      const duration = (item.contentDetails as { duration?: string })?.duration ?? '';
      const viewCount = parseInt(
        ((item.statistics as { viewCount?: string })?.viewCount) ?? '0',
        10
      );
      return parseDurationSeconds(duration) <= 60 && viewCount >= 20000;
    })
    .map((item: Record<string, unknown>) => ({
      title: (item.snippet as { title?: string })?.title ?? '',
      viewCount: parseInt(
        ((item.statistics as { viewCount?: string })?.viewCount) ?? '0',
        10
      ),
      videoId: item.id as string,
      url: `https://www.youtube.com/watch?v=${item.id}`,
    }))
    .sort((a: { viewCount: number }, b: { viewCount: number }) => b.viewCount - a.viewCount);

  if (filtered.length === 0) {
    return NextResponse.json({ topics: [] });
  }

  // 3. Claude가 줍줍줍 적합 소재 선별
  const client = new Anthropic({ apiKey: anthropicKey });

  const titlesJson = JSON.stringify(
    filtered.map((t: { title: string }, i: number) => ({ index: i, title: t.title }))
  );

  const systemPrompt =
    "너는 줍줍줍(jupjupjup.com) 콘텐츠 에디터야. 줍줍줍은 '알면 더 재밌는 것들'을 다루는 미디어야. 아래 유튜브 쇼츠 제목들 중 줍줍줍 소재로 적합한 것만 골라줘. 적합 기준: 세계문화/경제/인물/역사/과학/사회현상 등 '몰랐던 사실'이나 '신기한 각도'로 풀 수 있는 것. 제외 기준: 순수 게임/음악/먹방/연애/개인일상/유머. JSON 배열로만 응답해줘: [{\"index\": 0, \"reason\": \"선택 이유 한 줄\"}]";

  const userPrompt = `카테고리: ${category}\n\n영상 목록:\n${titlesJson}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ topics: [] });
  }

  let selected: { index: number; reason: string }[] = [];
  try {
    selected = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ topics: [] });
  }

  const topics = selected
    .filter((s) => filtered[s.index] !== undefined)
    .map((s) => ({
      ...filtered[s.index],
      reason: s.reason,
    }));

  return NextResponse.json({ topics });
}
