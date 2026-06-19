import Link from 'next/link';
import { isAuthed, logout } from './auth';
import AdminLogin from './AdminLogin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();

  if (!authed) {
    return <AdminLogin />;
  }

  return (
    <>
      {/* 로그아웃 바 */}
      <div
        style={{
          backgroundColor: '#fafafa',
          fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 20px 0',
        }}
      >
        <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
          <Link href="/admin" style={{ fontSize: '13px', fontWeight: 600, color: '#888', padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '8px', textDecoration: 'none' }}>
            글 목록
          </Link>
          <Link href="/admin/settings" style={{ fontSize: '13px', fontWeight: 600, color: '#c8a96e', padding: '6px 12px', border: '1px solid #e5dcc8', borderRadius: '8px', textDecoration: 'none' }}>
            사이트 설정
          </Link>
          <a href="https://summoney.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', padding: '6px 12px', backgroundColor: '#c8a96e', border: '1px solid #c8a96e', borderRadius: '8px', textDecoration: 'none' }}>
            사이트 보기 ↗
          </a>
          <form action={logout}>
            <button type="submit" style={{ backgroundColor: 'transparent', color: '#888', fontSize: '13px', fontWeight: 600, padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '8px', cursor: 'pointer' }}>
              로그아웃
            </button>
          </form>
        </div>
      </div>
      {children}
    </>
  );
}
