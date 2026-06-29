import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/app/admin/auth';

type Category = '다른나라' | '경제' | '사람';

const KEYWORDS: Record<Category, string> = {
  다른나라:
    '일본 미국 유럽 싱가포르 북유럽 문화 신기한 외국인 충격 몰랐던 나라별 전통 축제 음식문화 법 금지 규칙 이민 생활 스포츠규칙 스포츠이변 올림픽 월드컵 이상한나라 세계기록 결혼문화 연애문화 하렘 일부다처 호화여행 럭셔리여행 호화열차 프라이빗제트 퍼스트클래스 호화크루즈 럭셔리호텔 부자여행 세계최고급 억만장자 부자들의생활',
  경제:
    '경제 비즈니스 기업 돈 창업 마케팅 브랜드 가격 다이소 명품 스타벅스 맥도날드 애플 닌텐도 레고 이케아 가격심리 매출 역대급',
  사람:
    '워런버핏 일론머스크 스티브잡스 젠슨황 샘올트먼 CEO 창업자 천재 부자 성공 인물 비하인드 일화 습관 어린시절 반전',
};

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { category } = (await req.json()) as { category: Category };
  if (!KEYWORDS[category]) {
    return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY 환경변수가 없습니다.' }, { status: 500 });
  }

  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: KEYWORDS[category],
    type: 'video',
    videoDuration: 'short',
    order: 'viewCount',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    maxResults: '20',
    key: apiKey,
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

  const videoIds = items.map((item) => item.id.videoId).join(',');
  const statsParams = new URLSearchParams({
    part: 'statistics',
    id: videoIds,
    key: apiKey,
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

  const topics = items
    .map((item) => {
      const videoId = item.id.videoId;
      const viewCount = statsMap[videoId] ?? 0;
      return {
        title: item.snippet.title,
        viewCount,
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter((t) => t.viewCount >= 20000)
    .sort((a, b) => b.viewCount - a.viewCount);

  return NextResponse.json({ topics });
}
