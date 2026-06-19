'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScrollProgressBar from './ScrollProgressBar';

export type HomeArticle = {
  category: string;
  title: string;
  summary: string;
  date: string;
  coverImage: string | null;
  slug: string;
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

export default function HomeClient({ articles }: { articles: HomeArticle[] }) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHeaderVisible(scrollY < lastScrollY || scrollY < 50);
      setLastScrollY(scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif' }}>

      {/* 스크롤 진행 바 16px */}
      <ScrollProgressBar />

      {/* 헤더 */}
      <header style={{
        position: 'fixed', top: '16px', left: 0, right: 0,
        backgroundColor: '#1c1a17',
        borderBottom: '1px solid #2e2b26',
        padding: isMobile ? '0 20px' : '0 40px',
        height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 1000, transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease'
      }}>
        <span style={{ color: '#f5f0e8', fontSize: isMobile ? '18px' : '20px', fontWeight: '800', letterSpacing: '-0.03em' }}>
          써머니
        </span>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '8px' }}>
            {['비즈니스', '트렌드', 'ESG', '재테크', '브랜드'].map(cat => (
              <span key={cat} style={{
                backgroundColor: CATEGORY_COLORS[cat],
                color: CATEGORY_TEXT[cat],
                fontSize: '12px', fontWeight: '700',
                padding: '4px 10px', borderRadius: '20px',
                cursor: 'pointer'
              }}>{cat}</span>
            ))}
          </nav>
        )}
      </header>

      {/* 히어로 */}
      <div style={{
        backgroundColor: '#fff9f0',
        padding: isMobile ? '100px 20px 60px' : '120px 40px 80px',
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <p style={{ color: '#FF6B6B', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '16px' }}>
          SUMMONEY
        </p>
        <h1 style={{ color: '#111', fontSize: isMobile ? '26px' : '38px', fontWeight: '800', lineHeight: '1.4', marginBottom: '16px', letterSpacing: '-0.03em' }}>
          세상 모든 트렌드의<br />돈 되는 면만 골라드립니다
        </h1>
        <p style={{ color: '#888', fontSize: isMobile ? '14px' : '16px' }}>
          비즈니스 · 트렌드 · ESG · 재테크 · 브랜드
        </p>
      </div>

      {/* 모바일 카테고리 태그 */}
      {isMobile && (
        <div style={{ display: 'flex', gap: '8px', padding: '16px 20px', overflowX: 'auto' }}>
          {['비즈니스', '트렌드', 'ESG', '재테크', '브랜드'].map(cat => (
            <span key={cat} style={{
              backgroundColor: CATEGORY_COLORS[cat],
              color: CATEGORY_TEXT[cat],
              fontSize: '12px', fontWeight: '700',
              padding: '4px 12px', borderRadius: '20px',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}>{cat}</span>
          ))}
        </div>
      )}

      {/* 카드 그리드 */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '24px 16px' : '60px 40px' }}>
        {articles.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#bbb', padding: '60px 0' }}>
            아직 발행된 글이 없어요.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '16px' : '24px'
          }}>
            {articles.map((article, i) => (
              <ArticleCard key={i} article={article} isMobile={isMobile} />
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{
        backgroundColor: '#f8f8f8',
        borderTop: '1px solid #eee',
        padding: '40px',
        textAlign: 'center', color: '#aaa', fontSize: '13px'
      }}>
        <p style={{ color: '#111', marginBottom: '8px', fontWeight: '800', fontSize: '16px' }}>써머니</p>
        <p>세상 모든 트렌드의 돈 되는 면만 골라드립니다</p>
      </footer>
    </div>
  );
}

function ArticleCard({ article, isMobile }: { article: HomeArticle; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false);

  const CATEGORY_BG: Record<string, string> = {
    '비즈니스': '#fff0f0',
    '트렌드': '#f0fafa',
    'ESG': '#f0f8ff',
    '재테크': '#f0fff4',
    '브랜드': '#fffdf0',
  };

  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px', overflow: 'hidden',
        cursor: 'pointer',
        border: hovered ? '1px solid #ddd' : '1px solid #f0f0f0',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
        transform: hovered && !isMobile ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{
        height: isMobile ? '120px' : '160px',
        backgroundColor: CATEGORY_BG[article.category] || '#f8f8f8',
        backgroundImage: article.coverImage ? `url(${article.coverImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'filter 0.3s ease',
        filter: hovered ? 'brightness(0.95)' : 'brightness(1)',
      }}>
        {!article.coverImage && (
          <span style={{ fontSize: '13px', color: '#bbb', letterSpacing: '0.12em', fontWeight: '600' }}>
            {article.category.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ padding: isMobile ? '16px' : '20px' }}>
        <span style={{
          fontSize: '11px', fontWeight: '700',
          padding: '3px 8px', borderRadius: '20px',
          backgroundColor: CATEGORY_COLORS[article.category],
          color: CATEGORY_TEXT[article.category],
        }}>
          {article.category}
        </span>
        <h2 style={{
          fontSize: isMobile ? '15px' : '16px',
          fontWeight: '700', margin: '10px 0 8px', lineHeight: '1.5',
          color: hovered ? '#FF6B6B' : '#111',
          letterSpacing: '-0.02em',
          transition: 'color 0.2s ease'
        }}>
          {article.title}
        </h2>
        <p style={{ fontSize: '13px', color: '#777', lineHeight: '1.6', marginBottom: '16px' }}>
          {article.summary}
        </p>
        <p style={{ fontSize: '12px', color: '#bbb' }}>{article.date}</p>
      </div>
    </div>
  );

  // slug 가 있는 실제 글만 상세 페이지로 링크 (예시 글은 링크 없음)
  if (!article.slug) return card;
  return (
    <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {card}
    </Link>
  );
}
