import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { topic } = await req.json();
  if (!topic?.trim()) {
    return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `너는 줍줍줍(jupjupjup.com) 콘텐츠 에디터의 리서치 어시스턴트야.
줍줍줍은 "알면 더 재밌는 것들"을 다루는 한국어 디지털 미디어야.
타겟: 20-40대 호기심 많은 직장인/대학생

주제: "${topic.trim()}"

이 주제로 흥미로운 기사를 쓰기 위해 에디터가 리서치해야 할 질문 5개를 생성해줘.
- 숫자/통계/역사/기원/구조/반전이 나올 수 있는 각도로 질문을 만들어
- 구글, 유튜브, 나무위키, Liner 등에서 검색하기 좋은 형태로
- 독자가 "몰랐던 사실"을 발견할 수 있는 방향으로

출력 형식 (JSON만, 다른 텍스트 없이):
{"questions": ["질문1", "질문2", "질문3", "질문4", "질문5"]}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
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
