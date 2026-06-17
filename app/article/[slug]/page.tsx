import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabaseAdmin';
import type { Article } from '@/lib/supabase';
import ScrollProgressBar from '../../ScrollProgressBar';

export const dynamic = 'force-dynamic';

const CATEGORY_COLORS: Record<string, string> = {
  비즈니스: '#FF6B6B',
  트렌드: '#4ECDC4',
  ESG: '#45B7D1',
  재테크: '#96CEB4',
  브랜드: '#FFEAA7',
};
const CATEGORY_TEXT: Record<string, string> = {
  비즈니스: '#fff',
  트렌드: '#fff',
  ESG: '#fff',
  재테크: '#2d6a4f',
  브랜드: '#7d6608',
};

// 한글 slug 는 URL 에서 percent-encoding(%EB..) 으로 들어오므로 디코드해서 DB 와 맞춘다.
// 우리 slug 에는 '%' 가 없어 이미 디코드된 값에 적용해도 무해하다.
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

// 발행된 글만 slug 로 조회 (임시저장 글은 직접 URL 로도 접근 불가)
async function getPublishedBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', decodeSlug(slug))
      .eq('is_published', true)
      .maybeSingle();
    if (error || !data) return null;
    return data as Article;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBySlug(slug);
  if (!article) return { title: '써머니' };
  return {
    title: `${article.title} | 써머니`,
    description: article.summary ?? undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedBySlug(slug);
  if (!article) notFound();

  const date = (article.published_at ?? article.created_at).slice(0, 10).replace(/-/g, '.');

  return (
    <div
      style={{
        backgroundColor: '#fff',
        minHeight: '100vh',
        fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
      }}
    >
      {/* 스크롤 진행 바 16px */}
      <ScrollProgressBar />

      {/* 상단 바 */}
      <header
        style={{
          borderBottom: '1px solid #f0f0f0',
          padding: '0 20px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: '16px',
          backgroundColor: '#fff',
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <Link
            href="/"
            style={{ color: '#111', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', textDecoration: 'none' }}
          >
            써머니
          </Link>
        </div>
      </header>

      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px 80px' }}>
        <Link
          href="/"
          style={{ color: '#888', fontSize: '14px', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}
        >
          ← 목록으로
        </Link>

        {/* 카테고리 */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: CATEGORY_COLORS[article.category] ?? '#eee',
              color: CATEGORY_TEXT[article.category] ?? '#333',
            }}
          >
            {article.category}
          </span>
        </div>

        {/* 제목 */}
        <h1
          style={{
            color: '#111',
            fontSize: '32px',
            fontWeight: 800,
            lineHeight: 1.4,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
          }}
        >
          {article.title}
        </h1>

        {/* 요약 + 날짜 */}
        {article.summary && (
          <p style={{ color: '#666', fontSize: '17px', lineHeight: 1.6, marginBottom: '12px' }}>
            {article.summary}
          </p>
        )}
        <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '32px' }}>{date}</p>

        {/* 커버 이미지 */}
        {article.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image}
            alt={article.title}
            style={{
              width: '100%',
              borderRadius: '16px',
              marginBottom: '32px',
              display: 'block',
            }}
          />
        )}

        {/* 본문 (줄바꿈 유지) */}
        <div
          style={{
            color: '#222',
            fontSize: '17px',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'keep-all',
          }}
        >
          {article.content}
        </div>
      </article>
    </div>
  );
}
