import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabaseAdmin';
import type { Article } from '@/lib/supabase';
import ScrollProgressBar from '../../ScrollProgressBar';
import ArticleActions from './ArticleActions';
import CopyLinkButton from './CopyLinkButton';
import KakaoShareButton from './KakaoShareButton';
import HighlightObserver from './HighlightObserver';
import NumberCountup from './NumberCountup';
import ProgressBarObserver from './ProgressBarObserver';
import SeriesSection from './SeriesSection';

export const dynamic = 'force-dynamic';


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

function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function calcReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.ceil(text.length / 200));
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

async function getArticlesBySeries(seriesId: string, excludeId: string): Promise<Article[]> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('series_id', seriesId)
      .eq('is_published', true)
      .neq('id', excludeId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('published_at', { ascending: true })
      .limit(3);
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

async function getSeriesById(seriesId: string): Promise<{ name: string; slug: string } | null> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase.from('series').select('name, slug').eq('id', seriesId).maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

async function getTagBasedRelated(article: Article): Promise<Article[]> {
  try {
    const supabase = getAdminClient();
    const tags: string[] = article.tags ?? [];
    let candidates: Article[] = [];

    // 1) 태그가 있으면 overlapping 글 우선 조회
    if (tags.length > 0) {
      const { data: tagMatches } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .neq('id', article.id)
        .overlaps('tags', tags);
      if (tagMatches && tagMatches.length > 0) {
        // 겹치는 태그 수 내림차순 정렬
        candidates = (tagMatches as Article[]).sort((a, b) => {
          const aTags: string[] = a.tags ?? [];
          const bTags: string[] = b.tags ?? [];
          const aCount = aTags.filter((t) => tags.includes(t)).length;
          const bCount = bTags.filter((t) => tags.includes(t)).length;
          return bCount - aCount;
        });
      }
    }

    // 2) 3개 미만이면 같은 카테고리 글로 보조
    if (candidates.length < 3) {
      const excludeIds = [article.id, ...candidates.map((a) => a.id)];
      const { data: catMatches } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .eq('category', article.category)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('published_at', { ascending: false })
        .limit(3 - candidates.length);
      if (catMatches) candidates = [...candidates, ...(catMatches as Article[])];
    }

    return candidates.slice(0, 3);
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
  if (!article) return { title: '줍줍줍' };
  return {
    title: `${article.title} | 줍줍줍`,
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

  const [tagRelated, seriesArticles, seriesInfo] = await Promise.all([
    getTagBasedRelated(article),
    article.series_id ? getArticlesBySeries(article.series_id, article.id) : Promise.resolve([]),
    article.series_id ? getSeriesById(article.series_id) : Promise.resolve(null),
  ]);
  const date = (article.published_at ?? article.created_at).slice(0, 10).replace(/-/g, '.');
  const readingTime = calcReadingTime(article.content);

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
            style={{ color: '#111', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', textDecoration: 'none' }}
          >
            줍줍줍
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
        <div style={{ marginBottom: '8px' }}>
          <p style={{ color: '#bbb', fontSize: '13px', margin: '0 0 10px' }}>
            {date}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <CopyLinkButton />
            <KakaoShareButton
              title={article.title}
              description={article.summary ?? ''}
              imageUrl={article.cover_image ?? ''}
            />
          </div>
        </div>

        <ArticleActions
          articleId={article.id}
          viewCount={article.view_count ?? 0}
          starCount={article.star_count ?? 0}
          readingTime={readingTime}
        />

        {/* 커버 이미지 */}
        {article.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image}
            alt={article.title}
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '16px', marginBottom: '32px', display: 'block' }}
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

      {/* 시리즈 섹션 */}
      {seriesInfo && seriesArticles.length > 0 && (
        <SeriesSection
          seriesName={seriesInfo.name}
          seriesSlug={seriesInfo.slug}
          articles={seriesArticles}
        />
      )}

      {/* 태그 기반 연관 글 섹션 */}
      {tagRelated.length > 0 && (
        <section style={{ backgroundColor: '#1c1a17', padding: '48px 20px 64px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <p style={{ color: '#c8a96e', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>MORE</p>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0e8d6', letterSpacing: '-0.02em', margin: '0 0 24px' }}>
              이런 글도 읽어보세요
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tagRelated.length}, 1fr)`, gap: '16px' }}>
              {tagRelated.map((rel) => (
                <Link key={rel.id} href={`/article/${rel.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ backgroundColor: '#2a2825', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden', height: '100%' }}>
                    {rel.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rel.cover_image}
                        alt={rel.title}
                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    <div style={{ padding: '14px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                        backgroundColor: CATEGORY_COLORS[rel.category] ?? '#555',
                        color: CATEGORY_TEXT[rel.category] ?? '#fff',
                        display: 'inline-block', marginBottom: '8px',
                      }}>
                        {rel.category}
                      </span>
                      <p style={{
                        fontSize: '14px', fontWeight: 700, color: '#f0e8d6',
                        lineHeight: 1.5, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {rel.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
