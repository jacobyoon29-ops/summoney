'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import ScrollProgressBar from './ScrollProgressBar';
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
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setHeaderVisible(y < lastScrollY || y < 50);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const featuredArticles = articles.filter((a) => a.isFeatured && a.slug);
  const listArticles = articles;
  const visibleArticles = listArticles.slice(0, visibleCount);
  const hasMore = visibleCount < listArticles.length;

  return (
    <div style={{ backgroundColor: '#f8f7f4', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif' }}>
      <ScrollProgressBar />

      {/* 헤더 */}
      <header style={{
        position: 'fixed', top: '16px', left: 0, right: 0,
        backgroundColor: '#1c1a17',
        borderBottom: '1px solid #2e2b26',
        padding: isMobile ? '0 20px' : '0 40px',
        height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 1000,
        transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        <Link href="/" style={{ color: '#f5f0e8', fontSize: isMobile ? '28px' : '36px', fontWeight: 800, letterSpacing: '-0.03em', textDecoration: 'none' }}>
          줍줍줍
        </Link>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '8px' }}>
            {['비즈니스', '트렌드', 'ESG', '재테크', '브랜드'].map(cat => (
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
      <div style={{
        backgroundColor: '#1c1a17',
        padding: isMobile ? '96px 20px 48px' : '100px 40px 64px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? '32px' : '60px',
        minHeight: isMobile ? 'auto' : '480px',
      }}>
        {/* 왼쪽 텍스트 */}
        <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : '420px' }}>
          <p style={{ color: '#c8a96e', fontSize: '11px', fontWeight: 700, letterSpacing: '5px', marginBottom: '20px' }}>
            JUPJUPJUP
          </p>
          <h1 style={{
            color: '#fff', fontSize: isMobile ? '28px' : '44px', fontWeight: 800,
            lineHeight: 1.25, letterSpacing: '-0.03em', marginBottom: '16px',
          }}>
            알면 더 재밌는<br />것들을 줍줍줍
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
            장르 불문, 세상 모든 이야기
          </p>
          <div style={{ width: '40px', height: '2px', backgroundColor: '#c8a96e', marginBottom: '28px' }} />
          <a
            href="#articles"
            style={{
              display: 'inline-block', padding: '10px 22px',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px',
              color: '#f5f0e8', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', transition: 'background 0.2s',
            }}
          >
            최신글 보기 →
          </a>
        </div>

        {/* 오른쪽 캐러셀 */}
        {featuredArticles.length > 0 && (
          <div style={{ flex: 1, width: isMobile ? '100%' : undefined, minWidth: 0 }}>
            <Carousel articles={featuredArticles} />
          </div>
        )}
      </div>

      {/* 글 목록 */}
      <div id="articles" style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '32px 16px 64px' : '56px 40px 80px' }}>
        {listArticles.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#bbb', padding: '60px 0' }}>아직 발행된 글이 없어요.</p>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '16px' : '24px',
            }}>
              {visibleArticles.map((article, i) => (
                <ArticleCard key={i} article={article} isMobile={isMobile} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  style={{
                    padding: '12px 32px', fontSize: '14px', fontWeight: 600,
                    color: '#1c1a17', backgroundColor: 'transparent',
                    border: '1.5px solid #1c1a17', borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  더보기
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 300);
  }, []);

  const next = useCallback(() => goTo((current + 1) % articles.length), [current, articles.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + articles.length) % articles.length), [current, articles.length, goTo]);

  useEffect(() => {
    if (articles.length <= 1) return;
    timerRef.current = setTimeout(next, 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next, articles.length]);

  const article = articles[current];

  return (
    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '360px', backgroundColor: '#2e2b26' }}>
      {/* 이미지 */}
      {article.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt={article.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.6s ease',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: CATEGORY_BG[article.category] ?? '#2e2b26',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.6s ease',
        }} />
      )}

      {/* 그라데이션 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
      }} />

      {/* 텍스트 오버레이 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px',
        opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
          backgroundColor: CATEGORY_COLORS[article.category] ?? '#eee',
          color: CATEGORY_TEXT[article.category] ?? '#333',
          display: 'inline-block', marginBottom: '8px',
        }}>
          {article.category}
        </span>
        {article.slug ? (
          <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none' }}>
            <p style={{ color: '#fff', fontSize: '17px', fontWeight: 800, lineHeight: 1.4, margin: 0, letterSpacing: '-0.02em' }}>
              {article.title}
            </p>
          </Link>
        ) : (
          <p style={{ color: '#fff', fontSize: '17px', fontWeight: 800, lineHeight: 1.4, margin: 0 }}>{article.title}</p>
        )}
      </div>

      {/* 좌우 화살표 */}
      {articles.length > 1 && (
        <>
          <button onClick={prev} style={arrowStyle('left')}>‹</button>
          <button onClick={next} style={arrowStyle('right')}>›</button>
        </>
      )}

      {/* 하단 dot */}
      {articles.length > 1 && (
        <div style={{ position: 'absolute', bottom: '12px', right: '16px', display: 'flex', gap: '6px' }}>
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? '20px' : '6px', height: '6px',
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
    color: '#fff', fontSize: '20px', cursor: 'pointer', zIndex: 2,
    lineHeight: 1,
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
        backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden',
        cursor: 'pointer',
        border: hovered ? '1px solid #ddd' : '1px solid #ece9e3',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
        transform: hovered && !isMobile ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        height: isMobile ? '120px' : '160px',
        backgroundColor: CATEGORY_BG[article.category] || '#f8f8f8',
        backgroundImage: article.coverImage ? `url(${article.coverImage})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: hovered ? 'brightness(0.95)' : 'brightness(1)',
        transition: 'filter 0.3s ease',
      }}>
        {!article.coverImage && (
          <span style={{ fontSize: '13px', color: '#bbb', letterSpacing: '0.12em', fontWeight: 600 }}>
            {article.category.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ padding: isMobile ? '16px' : '20px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
          backgroundColor: CATEGORY_COLORS[article.category],
          color: CATEGORY_TEXT[article.category],
        }}>
          {article.category}
        </span>
        <h2 style={{
          fontSize: isMobile ? '15px' : '16px', fontWeight: 700,
          margin: '10px 0 8px', lineHeight: 1.5, color: hovered ? '#c8a96e' : '#111',
          letterSpacing: '-0.02em', transition: 'color 0.2s ease',
        }}>
          {article.title}
        </h2>
        <p style={{ fontSize: '13px', color: '#777', lineHeight: 1.6, marginBottom: '16px' }}>
          {article.summary}
        </p>
        <p style={{ fontSize: '12px', color: '#bbb' }}>{article.date}</p>
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
