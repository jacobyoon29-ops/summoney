import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

type Category = '다른나라' | '경제' | '사람';

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

  // 1. YouTube 인기 쇼츠 30개 검색 (키워드 없이)
  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoDuration: 'short',
    order: 'viewCount',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    maxResults: '30',
    key: youtubeKey,
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`
  );
  const searchData = await searchRes.json();

  if (!searchRes.ok) {
    return NextResponse.json(
      { error: searchData.error?.message ?? 'YouTube 검색 실패' },
      { status: 500 }
    );
  }

  const items: { id: { videoId: string }; snippet: { title: string } }[] =
    searchData.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ topics: [] });
  }

  // 2. 조회수 일괄 조회
  const videoIds = items.map((item) => item.id.videoId).join(',');
  const statsParams = new URLSearchParams({
    part: 'statistics',
    id: videoIds,
    key: youtubeKey,
  });

  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${statsParams}`
  );
  const statsData = await statsRes.json();

  if (!statsRes.ok) {
    return NextResponse.json(
      { error: statsData.error?.message ?? '조회수 조회 실패' },
      { status: 500 }
    );
  }

  const statsMap: Record<string, number> = {};
  for (const video of statsData.items ?? []) {
    statsMap[video.id] = parseInt(video.statistics?.viewCount ?? '0', 10);
  }

  // 3. 조회수 2만 이상 필터링
  const filtered = items
    .map((item) => ({
      title: item.snippet.title,
      viewCount: statsMap[item.id.videoId] ?? 0,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }))
    .filter((t) => t.viewCount >= 20000)
    .sort((a, b) => b.viewCount - a.viewCount);

  if (filtered.length === 0) {
    return NextResponse.json({ topics: [] });
  }

  // 4. Claude가 줍줍줍 적합 소재 선별
  const client = new Anthropic({ apiKey: anthropicKey });

  const titlesJson = JSON.stringify(
    filtered.map((t, i) => ({ index: i, title: t.title }))
  );

  const systemPrompt =
    '너는 줍줍줍(jupjupjup.com) 콘텐츠 에디터야. 줍줍줍은 \'알면 더 재밌는 것들\'을 다루는 미디어야. 아래 유튜브 쇼츠 제목들 중 줍줍줍 소재로 적합한 것만 골라줘. 적합 기준: 세계문화/경제/인물/역사/과학/사회현상 등 \'몰랐던 사실\'이나 \'신기한 각도\'로 풀 수 있는 것. 제외 기준: 순수 게임/음악/먹방/연애/개인일상/유머. JSON 배열로만 응답해줘: [{"index": 0, "reason": "선택 이유 한 줄"}]';

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
