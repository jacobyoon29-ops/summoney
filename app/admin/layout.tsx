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
        <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', textAlign: 'right' }}>
          <form action={logout}>
            <button
              type="submit"
              style={{
                backgroundColor: 'transparent',
                color: '#888',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
      {children}
    </>
  );
}
