'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { login } from './auth';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData();
    formData.append('password', password);
    const result = await login(formData);

    if (result.ok) {
      // 쿠키가 설정됐으니 레이아웃을 다시 렌더해 관리자 화면을 보여준다.
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          padding: '36px',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>
          <p
            style={{
              color: '#FF6B6B',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            줍줍줍 ADMIN
          </p>
          <h1
            style={{
              color: '#111',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            관리자 로그인
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            htmlFor="password"
            style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoFocus
            disabled={pending}
            style={inputStyle}
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#c0392b',
              backgroundColor: '#fff0f0',
              padding: '12px 14px',
              borderRadius: '10px',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            backgroundColor: pending ? '#ffb3b3' : '#FF6B6B',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            padding: '14px',
            border: 'none',
            borderRadius: '12px',
            cursor: pending ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {pending ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '15px',
  color: '#111',
  backgroundColor: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '10px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
