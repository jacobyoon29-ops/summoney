'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/supabase';

const CATEGORY_COLORS: Record<string, string> = {
  '다른나라 줍줍줍': '#3B82F6',
  '경제 줍줍줍': '#10B981',
  '사람 줍줍줍': '#F59E0B',
};

function SeriesCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false);
  const date = (article.published_at ?? article.created_at).slice(0, 10).replace(/-/g, '.');

  return (
    <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: hovered ? '#2a2418' : '#242118',
          border: `1px solid ${hovered ? '#c8a96e' : '#333'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'background-color 0.2s, border-color 0.2s, transform 0.2s',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          height: '100%',
        }}
      >
        {article.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image}
            alt={article.title}
            style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div style={{ padding: '14px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              backgroundColor: CATEGORY_COLORS[article.category] ?? '#eee',
              color: '#fff',
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            {article.category}
          </span>
          <p
            style={{
              color: '#f0e8d6',
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: 1.5,
              margin: '0 0 6px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.title}
          </p>
          <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{date}</p>
        </div>
      </div>
    </Link>
  );
}

export default function SeriesSection({
  seriesName,
  seriesSlug,
  articles,
}: {
  seriesName: string;
  seriesSlug: string;
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  return (
    <section style={{ backgroundColor: '#1c1a17', padding: '48px 20px 56px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ color: '#c8a96e', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>
          SERIES
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#f0e8d6',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            이 주제의 다른 글도 읽어보세요
          </h2>
          <Link
            href={`/series/${seriesSlug}`}
            style={{ color: '#c8a96e', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: '16px' }}
          >
            {seriesName} 전체 보기 →
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(articles.length, 3)}, 1fr)`,
            gap: '16px',
          }}
        >
          {articles.map((article) => (
            <SeriesCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
