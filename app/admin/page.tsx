import Link from 'next/link';
import { getArticles } from './actions';
import DeleteButton from './DeleteButton';
import FeaturedButton from './FeaturedButton';

const CATEGORY_COLORS: Record<string, string> = {
  '다른나라 줍줍줍': '#3B82F6',
  '경제 줍줍줍': '#10B981',
  '사람 줍줍줍': '#F59E0B',
};
const CATEGORY_TEXT: Record<string, string> = {
  '다른나라 줍줍줍': '#fff',
  '경제 줍줍줍': '#fff',
  '사람 줍줍줍': '#fff',
};

function formatDate(iso: string): string {
  // YYYY.MM.DD
  return iso.slice(0, 10).replace(/-/g, '.');
}

export default async function AdminListPage() {
  const result = await getArticles();

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
        padding: '24px 20px 64px',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '24px',
            gap: '12px',
            flexWrap: 'wrap',
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
            <h1 style={{ color: '#111', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              글 목록
            </h1>
          </div>
          <Link
            href="/admin/new"
            style={{
              backgroundColor: '#FF6B6B',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              padding: '12px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            + 새 글 작성
          </Link>
        </div>

        {/* 본문 */}
        {!result.ok ? (
          <p style={{ ...cardStyle, color: '#c0392b' }}>{result.error}</p>
        ) : result.articles.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: '#888' }}>
            아직 작성한 글이 없어요. <br />
            <Link href="/admin/new" style={{ color: '#FF6B6B', fontWeight: 700 }}>
              첫 글을 작성해보세요 →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.articles.map((a) => (
              <div
                key={a.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                {/* 커버 썸네일 */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    flexShrink: 0,
                    backgroundColor: '#f4f4f4',
                    backgroundImage: a.cover_image ? `url(${a.cover_image})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        backgroundColor: CATEGORY_COLORS[a.category] ?? '#eee',
                        color: CATEGORY_TEXT[a.category] ?? '#333',
                      }}
                    >
                      {a.category}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        backgroundColor: a.is_published ? '#e8f7ee' : '#f3f3f3',
                        color: a.is_published ? '#2d6a4f' : '#999',
                      }}
                    >
                      {a.is_published ? '발행됨' : '임시저장'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#bbb' }}>{formatDate(a.created_at)}</span>
                  </div>
                  {a.is_published ? (
                    <Link
                      href={`/article/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#111',
                        margin: 0,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: 'none',
                      }}
                    >
                      {a.title} ↗
                    </Link>
                  ) : (
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#111',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.title}
                    </p>
                  )}
                </div>

                {/* 액션 */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <FeaturedButton id={a.id} isFeatured={a.is_featured ?? false} />
                  <Link
                    href={`/admin/edit/${a.id}`}
                    style={{
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#555',
                      textDecoration: 'none',
                    }}
                  >
                    수정
                  </Link>
                  <DeleteButton id={a.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '14px',
  border: '1px solid #f0f0f0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  padding: '16px 20px',
} as const;
