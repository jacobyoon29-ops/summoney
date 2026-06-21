import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { content, category } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: '내용을 먼저 입력해주세요.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `당신은 "줍줍줍(Summoney)"의 SEO 전문 에디터입니다.
줍줍줍는 다른나라·경제·사람 줍줍줍 분야의 한국어 미디어입니다.

아래 기사 본문을 분석해 다음 4가지를 JSON으로만 응답하세요. JSON 외 다른 텍스트는 절대 출력하지 마세요.

1. seoTitle: 검색 클릭률을 극대화하는 SEO 제목 (한국어, 30~40자, 핵심 키워드 포함, 숫자/구체적 사실 강조)
2. metaDescription: 검색 결과에 표시될 메타 디스크립션 (한국어, 130~150자, 한다체·짧고 단정한 문장, 핵심 수치나 사실을 앞에 배치, 마지막 문장은 인사이트나 결론으로 마무리. 예: "영업이익 130% 증가했다. HBM 수요가 견인했다. 반도체 업황 회복의 변곡점이다.")
3. slug: URL에 사용할 영문 슬러그 (소문자 영문+숫자+하이픈만, 3~6단어, 기사 주제를 정확히 반영)
4. hashtags: SNS·검색용 해시태그 배열 (한국어, # 없이 단어만, 5~8개, 카테고리·키워드·관련 트렌드 포함)

카테고리: ${category || '미분류'}

---본문---
${content.slice(0, 4000)}
---

JSON 형식 (이것만 출력):
{"seoTitle":"...","metaDescription":"...","slug":"...","hashtags":["태그1","태그2","태그3","태그4","태그5"]}`;

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
