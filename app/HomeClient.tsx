'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { SiteSettings } from '@/lib/supabase';

export type HomeArticle = {
  category: string;
  title: string;
  summary: string;
  date: string;
  coverImage: string | null;
  slug: string;
  isFeatured?: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  '비즈니스': '#FF6B6B',
  '트렌드': '#4ECDC4',
  'ESG': '#45B7D1',
  '재테크': '#96CEB4',
  '브랜드': '#FFEAA7',
};
const CATEGORY_TEXT: Record<string, string> = {
  '비즈니스': '#fff',
  '트렌드': '#fff',
  'ESG': '#fff',
  '재테크': '#2d6a4f',
  '브랜드': '#7d6608',
};
const CATEGORY_BG: Record<string, string> = {
  '비즈니스': '#fff0f0',
  '트렌드': '#f0fafa',
  'ESG': '#f0f8ff',
  '재테크': '#f0fff4',
  '브랜드': '#fffdf0',
};

const PAGE_SIZE = 9;

export default function HomeClient({ articles, siteSettings }: { articles: HomeArticle[]; siteSettings: SiteSettings }) {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 어드민 숨김 접근
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSecretClick = useCallback(() => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      window.location.href = '/admin';
      return;
    }
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 3000);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const featuredArticles = articles.filter((a) => a.isFeatured && a.slug);
  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <div style={{ backgroundColor: '#f8f7f4', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif' }}>

      {/* 헤더 */}
      <header style={{
        background: '#1c1a17',
        padding: isMobile ? '0 20px' : '0 40px',
        height: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ color: '#fff', fontSize: isMobile ? '32px' : '36px', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.03em' }}>
          줍줍줍
        </Link>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '8px' }}>
            {['비즈니스', '트렌드', 'ESG', '재테크', '브랜드'].map((cat) => (
              <span key={cat} style={{
                backgroundColor: CATEGORY_COLORS[cat],
                color: CATEGORY_TEXT[cat],
                fontSize: '12px', fontWeight: 700,
                padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
              }}>{cat}</span>
            ))}
          </nav>
        )}
      </header>

      {/* 히어로 */}
      <section style={{ background: '#1c1a17' }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '48px 20px' : '64px 40px 64px 40px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '48px',
          alignItems: 'center',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          {/* 왼쪽 텍스트 */}
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <p style={{ color: '#c8a96e', fontSize: '11px', letterSpacing: '5px', marginBottom: '20px' }}>JUPJUPJUP</p>
            <h1 style={{ color: '#fff', fontSize: isMobile ? '48px' : '68px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-2px', marginBottom: '14px' }}>
              알면 더 재밌는<br />것들을 줍줍줍
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', marginBottom: '32px' }}>
              장르 불문, 세상 모든 이야기
            </p>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#c8a96e', margin: isMobile ? '0 auto 28px' : '0 0 28px' }} />
            <button
              onClick={() => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 20px', color: 'rgba(255,255,255,0.7)', background: 'transparent', fontSize: '13px', cursor: 'pointer' }}
            >
              최신글 보기 →
            </button>
          </div>

          {/* 오른쪽 캐러셀 */}
          {!isMobile && featuredArticles.length > 0 && (
            <div style={{ width: '100%', maxWidth: '520px', height: '320px', borderRadius: '14px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              <Carousel articles={featuredArticles} />
            </div>
          )}
        </div>
      </section>

      {/* 글 목록 */}
      <section id="articles" style={{ background: '#f8f7f4' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '32px 16px 64px' : '48px 40px' }}>
          {articles.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#bbb', padding: '60px 0' }}>아직 발행된 글이 없어요.</p>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '20px',
              }}>
                {visibleArticles.map((article, i) => (
                  <ArticleCard key={i} article={article} isMobile={isMobile} />
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                    style={{
                      border: '1px solid #1c1a17', borderRadius: '8px',
                      padding: '12px 32px', background: 'transparent',
                      color: '#1c1a17', fontSize: '14px', cursor: 'pointer',
                    }}
                  >
                    더보기
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{ borderTop: '1px solid #ece9e3', padding: '32px 20px 40px', backgroundColor: '#f0ede8' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#999', fontSize: '12px', lineHeight: 1.9 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#bbb' }}>
            <span onClick={handleSecretClick} style={{ cursor: 'default', userSelect: 'none', padding: '8px 0', display: 'inline-block' }}>
              {siteSettings.company_name}
            </span>
          </p>
          <p style={{ margin: 0 }}>
            대표 {siteSettings.owner_name} | 사업자등록번호 {siteSettings.business_number}
            {siteSettings.customer_service ? ` | 고객센터 ${siteSettings.customer_service}` : ''}
          </p>
          <p style={{ margin: 0 }}>{siteSettings.address}</p>
          <p style={{ marginTop: '12px', color: '#ccc', fontSize: '11px' }}>{siteSettings.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

/* ── 캐러셀 컴포넌트 ── */
function Carousel({ articles }: { articles: HomeArticle[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % articles.length), [articles.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + articles.length) % articles.length), [articles.length]);

  useEffect(() => {
    if (articles.length <= 1) return;
    timerRef.current = setTimeout(next, 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next, articles.length]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {articles.map((article, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: CATEGORY_BG[article.category] ?? '#2e2b26' }} />
          )}
          {/* 오버레이 */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              backgroundColor: CATEGORY_COLORS[article.category] ?? '#eee',
              color: CATEGORY_TEXT[article.category] ?? '#333',
              display: 'inline-block', marginBottom: '6px',
            }}>
              {article.category}
            </span>
            <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none' }}>
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: 800, lineHeight: 1.4, margin: 0, letterSpacing: '-0.02em' }}>
                {article.title}
              </p>
            </Link>
          </div>
        </div>
      ))}

      {/* 화살표 */}
      {articles.length > 1 && (
        <>
          <button onClick={prev} style={arrowStyle('left')}>‹</button>
          <button onClick={next} style={arrowStyle('right')}>›</button>
        </>
      )}

      {/* dot */}
      {articles.length > 1 && (
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 3 }}>
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? '16px' : '6px', height: '6px',
                borderRadius: '3px', border: 'none', padding: 0, cursor: 'pointer',
                backgroundColor: i === current ? '#c8a96e' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: '10px',
    background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '20px', cursor: 'pointer', zIndex: 2, lineHeight: 1,
  };
}

/* ── 카드 컴포넌트 ── */
function ArticleCard({ article, isMobile }: { article: HomeArticle; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false);

  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '0.5px solid #e8e4de',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* 이미지 */}
      <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: CATEGORY_BG[article.category] ?? '#f8f8f8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: '13px', color: '#bbb', letterSpacing: '0.12em', fontWeight: 600 }}>
            {article.category.toUpperCase()}
          </span>
        )}
      </div>

      {/* 카드 바디 */}
      <div style={{ padding: '14px 16px 16px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
          backgroundColor: CATEGORY_COLORS[article.category],
          color: CATEGORY_TEXT[article.category],
        }}>
          {article.category}
        </span>
        <h2 style={{
          fontSize: '15px', fontWeight: 700,
          margin: '10px 0 6px', lineHeight: 1.5, color: hovered ? '#c8a96e' : '#111',
          letterSpacing: '-0.02em', transition: 'color 0.2s ease',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </h2>
        <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{article.date}</p>
      </div>
    </div>
  );

  if (!article.slug) return card;
  return (
    <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {card}
    </Link>
  );
}
