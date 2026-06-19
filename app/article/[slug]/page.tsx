import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabaseAdmin';
import type { Article } from '@/lib/supabase';
import ScrollProgressBar from '../../ScrollProgressBar';
import ArticleActions from './ArticleActions';
import HighlightObserver from './HighlightObserver';
import NumberCountup from './NumberCountup';
import ProgressBarObserver from './ProgressBarObserver';

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

function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

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

async function getRelatedArticles(ids: string[]): Promise<Article[]> {
  if (!ids.length) return [];
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .in('id', ids)
      .eq('is_published', true);
    if (!data) return [];
    // related_ids 순서 유지
    return ids
      .map((id) => data.find((a) => a.id === id))
      .filter((a): a is Article => !!a);
  } catch {
    return [];
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

  const related = await getRelatedArticles(article.related_ids ?? []);
  const date = (article.published_at ?? article.created_at).slice(0, 10).replace(/-/g, '.');

  return (
    <div
      style={{
        backgroundColor: '#fff',
        minHeight: '100vh',
        fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
      }}
    >
      <ScrollProgressBar />

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

      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px 0' }}>
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
        <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '16px' }}>{date}</p>

        <ArticleActions
          articleId={article.id}
          viewCount={article.view_count ?? 0}
          starCount={article.star_count ?? 0}
        />

        {/* 커버 이미지 */}
        {article.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image}
            alt={article.title}
            style={{ width: '100%', borderRadius: '16px', marginBottom: '32px', display: 'block' }}
          />
        )}

        {/* 본문 — TipTap HTML 또는 레거시 plain text 모두 지원 */}
        {isHtml(article.content) ? (
          <>
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.content }}
              style={{ paddingBottom: '64px' }}
            />
            <HighlightObserver />
            <NumberCountup />
            <ProgressBarObserver />
          </>
        ) : (
          <div
            style={{
              color: '#222', fontSize: '17px', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', wordBreak: 'keep-all', paddingBottom: '64px',
            }}
          >
            {article.content}
          </div>
        )}
      </article>

      {/* 관련 글 섹션 */}
      {related.length > 0 && (
        <section
          style={{
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa',
            padding: '48px 20px 64px',
          }}
        >
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#111',
                letterSpacing: '-0.02em',
                marginBottom: '24px',
              }}
            >
              관련 글
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${related.length}, 1fr)`,
                gap: '16px',
              }}
            >
              {related.map((rel) => {
                const relDate = (rel.published_at ?? rel.created_at).slice(0, 10).replace(/-/g, '.');
                return (
                  <Link
                    key={rel.id}
                    href={`/article/${rel.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '14px',
                        border: '1px solid #f0f0f0',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.2s ease',
                        height: '100%',
                      }}
                    >
                      {rel.cover_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rel.cover_image}
                          alt={rel.title}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      <div style={{ padding: '16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            backgroundColor: CATEGORY_COLORS[rel.category] ?? '#eee',
                            color: CATEGORY_TEXT[rel.category] ?? '#333',
                          }}
                        >
                          {rel.category}
                        </span>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#111',
                            lineHeight: 1.5,
                            margin: '8px 0 6px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {rel.title}
                        </p>
                        {rel.summary && (
                          <p
                            style={{
                              fontSize: '12px',
                              color: '#888',
                              lineHeight: 1.5,
                              margin: '0 0 10px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {rel.summary}
                          </p>
                        )}
                        <p style={{ fontSize: '11px', color: '#ccc', margin: 0 }}>{relDate}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
