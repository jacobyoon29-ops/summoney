import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

const HOOOKING_PATTERN_LABELS: Record<string, string> = {
  external_observer: '외부 관찰자 시점 (예: "일본인이 한국에서 자판기를 찾는다"처럼 외부인의 눈으로 장면을 열어라)',
  number_reversal: '숫자 반전 (예: "줄었는데 매출은 늘었다"처럼 직관에 반하는 수치로 시작하라)',
  origin_story: '탄생 비화 (예: "비웃음을 받았던 햇반"처럼 잘 알려지지 않은 기원 장면으로 시작하라)',
};

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { source, category, hookingPattern } = await req.json();
  if (!source?.trim()) {
    return NextResponse.json({ error: '원본 소스를 입력해주세요.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const patternInstruction = HOOOKING_PATTERN_LABELS[hookingPattern] ?? HOOOKING_PATTERN_LABELS['external_observer'];

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

후킹 패턴 3가지:
- external_observer: 외부인 시선으로 시작 ("일본인이 한국에서 자판기를 찾는다")
- number_reversal: 숫자로 역설 ("줄었는데 매출은 늘었다")
- origin_story: 탄생 비화 ("비웃음을 받았던 햇반")

글자수: 2000-3000자
할루시네이션 금지: 원본 소스에 없는 사실 절대 추가하지 마. 모르면 모른다고 써.

출력 형식 (JSON만, 다른 텍스트 없이):
{
  "titles": ["제목1", "제목2", "제목3"],
  "body": "본문 전체 (HTML 태그 없이 줄바꿈만)"
}`;

  const userPrompt = `카테고리: ${category || '미분류'}
후킹 패턴: ${patternInstruction}

아래 원본 소스를 바탕으로 줍줍줍 스타일의 글을 써줘.

---원본 소스---
${source.slice(0, 8000)}
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
