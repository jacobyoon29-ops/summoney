import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

type Category = '다른나라' | '경제' | '사람';

const KEYWORDS: Record<Category, string> = {
  다른나라: '세계 문화 신기한 충격 몰랐던 이상한 역사 전통 여행 럭셔리 부자',
  경제: '경제 기업 브랜드 마케팅 돈 창업 비즈니스 가격 매출',
  사람: '인물 CEO 창업자 부자 성공 천재 비하인드 일화',
};

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { category, minViewCount } = (await req.json()) as { category: Category; minViewCount?: number };
  if (!KEYWORDS[category]) {
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

  // 1. YouTube Search API로 카테고리별 인기 쇼츠 30개 검색
  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoDuration: 'short',
    order: 'relevance',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    maxResults: '30',
    q: KEYWORDS[category],
    key: youtubeKey,
  });

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams}`;
  console.log(`[youtube-topics] Search URL: ${searchUrl}`);
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  console.log(`[youtube-topics] Search 응답 raw:`, JSON.stringify(searchData, null, 2));
  if (searchData.error) console.log(`[youtube-topics] Search 에러:`, JSON.stringify(searchData.error));

  if (!searchRes.ok) {
    return NextResponse.json(
      { error: searchData.error?.message ?? 'YouTube 검색 실패' },
      { status: 500 }
    );
  }

  const items: { id: { videoId: string }; snippet: { title: string } }[] =
    searchData.items ?? [];
  console.log(`[youtube-topics] 검색된 영상 개수: ${items.length}`);
  if (items.length === 0) {
    return NextResponse.json({ topics: [] });
  }

  // 2. videoId로 statistics 조회
  const videoIds = items.map((item) => item.id.videoId).join(',');
  const statsParams = new URLSearchParams({
    part: 'statistics',
    id: videoIds,
    key: youtubeKey,
  });

  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?${statsParams}`;
  console.log(`[youtube-topics] Stats URL: ${statsUrl}`);
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();
  console.log(`[youtube-topics] Stats 응답 raw:`, JSON.stringify(statsData, null, 2));
  if (statsData.error) console.log(`[youtube-topics] Stats 에러:`, JSON.stringify(statsData.error));

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
    .filter((t) => t.viewCount >= (minViewCount ?? 0))
    .sort((a, b) => b.viewCount - a.viewCount);
  console.log(`[youtube-topics] 필터링 전: ${items.length}개 → 후: ${filtered.length}개 (minViewCount: ${minViewCount ?? 0})`);

  if (filtered.length === 0) {
    return NextResponse.json({ topics: [] });
  }

  // 4. Claude가 줍줍줍 적합 소재 선별
  const client = new Anthropic({ apiKey: anthropicKey });

  const titlesJson = JSON.stringify(
    filtered.map((t, i) => ({ index: i, title: t.title }))
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
  console.log(`[youtube-topics] Claude 선별 전: ${filtered.length}개 → 후: ${topics.length}개`);

  return NextResponse.json({ topics });
}
