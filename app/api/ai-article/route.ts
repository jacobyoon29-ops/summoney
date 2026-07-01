import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

const HOOKING_PATTERN_LABELS: Record<string, string> = {
  fact_reversed: '사실은 달랐다 — 우리가 알던 것과 반대인 사실을 폭로하며 시작하라',
  reason_hidden: '이유가 있었다 — 당연해 보이는 것 뒤에 숨겨진 진짜 이유를 드러내며 시작하라',
  korea_only_missing: '한국만 모른다 — 세계는 알고 있는데 한국만 모르는 사실로 시작하라',
  external_observer: '외부 관찰자 시점 — 외국인/제3자 눈으로 본 우리 모습 장면으로 시작하라 (예: "일본인이 한국에서 자판기를 찾는다")',
  then_vs_now: '그때 vs 지금 — 과거와 현재의 극적인 대비로 시작하라',
  number_shock: '숫자가 다르다 — 통념과 다른 수치로 독자에게 충격을 주며 시작하라',
  why_fooled: '왜 우리는 속는가 — 대중이 오해하거나 착각하는 심리를 해부하며 시작하라',
  origin_story: '탄생 비화 — 유명한 것의 예상치 못한 기원 장면으로 시작하라 (예: "비웃음을 받았던 햇반")',
  nobody_told: '아무도 말 안 해줬다 — 중요하지만 아무도 언급하지 않은 진실을 폭로하며 시작하라',
};

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { youtubeLink, qSources, category, hookingPattern, direction } = await req.json();

  const hasContent = (Array.isArray(qSources) && qSources.some((qs: { source: string }) => qs.source?.trim())) || youtubeLink?.trim();
  if (!hasContent) {
    return NextResponse.json({ error: '최소 하나의 자료 또는 YouTube 링크를 입력해주세요.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const patternInstruction = HOOKING_PATTERN_LABELS[hookingPattern] ?? HOOKING_PATTERN_LABELS['fact_reversed'];

  const systemPrompt = `너는 줍줍줍(jupjupjup.com)의 콘텐츠 에디터야.
줍줍줍은 "알면 더 재밌는 것들"을 다루는 한국어 디지털 미디어야.
카테고리: 다른나라 줍줍줍 / 경제 줍줍줍 / 사람 줍줍줍
타겟: 20-40대 호기심 많은 직장인/대학생
톤: 에요/거든요/더라고요 체, 정보 나열 아닌 장면으로 이야기

글 구조:
1. 후킹 (2-3문장) - 독자를 잡아당기는 장면
2. 배경 - 왜 이게 생겨났나
3. 핵심 - 실제로 어떻게 작동하나
4. 반전/인사이트 - 몰랐던 사실
5. 클로징 라인 - 여운 남기는 한 줄

글자수: 2000-3000자
할루시네이션 금지: 제공된 자료에 없는 사실 절대 추가하지 마. 모르면 쓰지 마.

출력 형식 (JSON만, 다른 텍스트 없이):
{
  "titles": ["제목1", "제목2", "제목3"],
  "body": "본문 전체 (HTML 태그 없이 줄바꿈만)"
}`;

  const sourcesText = Array.isArray(qSources) && qSources.length > 0
    ? qSources
        .filter((qs: { question: string; source: string }) => qs.question || qs.source?.trim())
        .map((qs: { question: string; source: string }, i: number) =>
          `[질문 ${i + 1}] ${qs.question}\n자료:\n${qs.source?.trim() || '(자료 없음)'}`
        )
        .join('\n\n')
    : '';

  const userPrompt = `카테고리: ${category || '미분류'}
후킹 패턴: ${patternInstruction}${direction?.trim() ? `\n편집 방향 (반드시 반영해줘): ${direction.trim()}` : ''}${youtubeLink?.trim() ? `\nYouTube 참고 링크: ${youtubeLink.trim()}` : ''}

아래 질문별 리서치 자료를 바탕으로 줍줍줍 스타일의 글을 써줘.

---리서치 자료---
${sourcesText.slice(0, 8000)}
---

JSON만 출력해.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
