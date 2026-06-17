'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';

const COOKIE_NAME = 'admin_auth';
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

// 비밀번호를 쿠키에 그대로 담지 않으려고, 해시값을 토큰으로 쓴다.
function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHash('sha256').update(`summoney:${pw}`).digest('hex');
}

/** 현재 요청이 로그인된 상태인지 확인 (서버 컴포넌트 / 서버 액션에서 사용) */
export async function isAuthed(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === token;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(formData: FormData): Promise<LoginResult> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return {
      ok: false,
      error:
        'ADMIN_PASSWORD 가 설정되지 않았습니다. .env.local 에 추가한 뒤 dev 서버를 재시작하세요.',
    };
  }

  const input = String(formData.get('password') ?? '');
  if (input !== expected) {
    return { ok: false, error: '비밀번호가 올바르지 않습니다.' };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken()!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect('/admin');
}
