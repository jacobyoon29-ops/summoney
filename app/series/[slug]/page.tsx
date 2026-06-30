import { getAdminClient } from '@/lib/supabaseAdmin';
import type { Article, Series } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getSeriesBySlug(slug: string): Promise<Series | null> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase.from('series').select('*').eq('slug', slug).maybeSingle();
    return (data as Series) ?? null;
  } catch {
    return null;
  }
}

async function getArticlesBySeries(seriesId: string): Promise<Article[]> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('series_id', seriesId)
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return {};
  return {
    title: `${series.name} | 줍줍줍`,
    description: series.description ?? `${series.name} 시리즈 — 줍줍줍`,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  '다른나라 줍줍줍': '#3B82F6',
  '경제 줍줍줍': '#10B981',
  '사람 줍줍줍': '#F59E0B',
};
const CATEGORY_BG: Record<string, string> = {
  '다른나라 줍줍줍': '#1a2235',
  '경제 줍줍줍': '#162a22',
  '사람 줍줍줍': '#2a2212',
};

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  const articles = await getArticlesBySeries(series.id);

  return (
    <div style={{ backgroundColor: '#1c1a17', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif' }}>

      {/* 헤더 */}
      <header style={{ backgroundColor: '#1c1a17', borderBottom: '1px solid #2a2a2a', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: '#fff', fontSize: '24px', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.03em' }}>
            줍줍줍
          </Link>
          <span style={{ color: '#444', fontSize: '16px' }}>›</span>
          <span style={{ color: '#c8a96e', fontSize: '14px', fontWeight: 600 }}>특집</span>
        </div>
      </header>

      {/* 히어로 */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {series.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={series.cover_image} alt={series.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
        )}
        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ color: '#c8a96e', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px', fontWeight: 700 }}>SERIES</p>
          <h1 style={{ color: '#fff', fontSize: '42px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-2px', margin: '0 0 16px' }}>
            {series.name}
          </h1>
          {series.description && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.7, maxWidth: '560px', margin: 0 }}>
              {series.description}
            </p>
          )}
          <p style={{ color: '#c8a96e', fontSize: '13px', marginTop: '20px', fontWeight: 600 }}>
            총 {articles.length}편
          </p>
        </div>
      </section>

      {/* 글 목록 */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {articles.length === 0 ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '60px 0' }}>아직 이 시리즈에 발행된 글이 없어요.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {articles.map((article) => (
              <SeriesArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SeriesArticleCard({ article }: { article: Article }) {
  const date = (article.published_at ?? article.created_at).slice(0, 10).replace(/-/g, '.');
  const catColor = CATEGORY_COLORS[article.category] ?? '#888';
  const catBg = CATEGORY_BG[article.category] ?? '#222';

  return (
    <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        backgroundColor: '#242118',
        border: '1px solid #333',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c8a96e'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#333'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
      >
        <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: catBg, overflow: 'hidden' }}>
          {article.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.cover_image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#444', fontSize: '12px', letterSpacing: '0.1em' }}>{article.category}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: catColor, color: '#fff', display: 'inline-block', marginBottom: '8px' }}>
            {article.category}
          </span>
          <h2 style={{ color: '#f0e8d6', fontSize: '15px', fontWeight: 700, lineHeight: 1.5, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h2>
          <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{date}</p>
        </div>
      </div>
    </Link>
  );
}
