import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthed } from '@/app/admin/auth';

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 없습니다.' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 64,
    messages: [{
      role: 'user',
      content: `아래 한글 시리즈 이름을 영문 URL 슬러그로 변환해줘. 규칙: 소문자 영문+숫자+하이픈만, 4단어 이내, 의미 전달 우선. 슬러그 문자열만 출력, 다른 텍스트 금지.\n\n시리즈 이름: ${name.trim()}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  if (!slug) {
    return NextResponse.json({ error: '슬러그 생성 실패' }, { status: 500 });
  }

  return NextResponse.json({ slug });
}
