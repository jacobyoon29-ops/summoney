'use client';

import { useEffect, useState } from 'react';

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

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
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
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrollY / docHeight) * 100);
      setHeaderVisible(scrollY < lastScrollY || scrollY < 50);
      setLastScrollY(scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const articles = [
    { category: '비즈니스', title: '다이소가 1000원짜리로 1조를 버는 방법', summary: '가격이 아니라 구조가 다르다. 다이소 비즈니스 모델의 핵심을 파헤친다.', date: '2025.06.01' },
    { category: '트렌드', title: '올리브영이 드럭스토어를 넘어선 이유', summary: 'H&B 스토어의 진화, 올리브영이 만든 새로운 카테고리의 정체.', date: '2025.05.28' },
    { category: 'ESG', title: 'ESG가 돈이 되는 진짜 이유', summary: '규제 대응이 아니다. ESG를 수익 모델로 바꾼 기업들의 전략.', date: '2025.05.20' },
    { category: '재테크', title: '월급쟁이가 ETF로 돈 모으는 법', summary: '복잡한 주식 분석 없이, 직장인이 실천할 수 있는 ETF 전략.', date: '2025.05.15' },
    { category: '브랜드', title: '무신사는 어떻게 패션 플랫폼 1위가 됐나', summary: '커뮤니티에서 커머스로. 무신사의 성장 공식을 분석한다.', date: '2025.05.10' },
    { category: '비즈니스', title: '배달의민족이 수수료를 올릴 수밖에 없는 이유', summary: '플랫폼 경제의 딜레마. 성장과 수익 사이에서 배민이 선택한 것.', date: '2025.05.05' },
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif' }}>

      {/* 스크롤 진행 바 10px */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '10px',
        width: `${scrollProgress}%`, backgroundColor: '#FF6B6B',
        zIndex: 9999, transition: 'width 0.1s ease'
      }} />

      {/* 헤더 */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        padding: isMobile ? '0 20px' : '0 40px',
        height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 1000, transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease'
      }}>
        <span style={{ color: '#111', fontSize: isMobile ? '18px' : '20px', fontWeight: '800', letterSpacing: '-0.03em' }}>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '24px'
        }}>
          {articles.map((article, i) => (
            <ArticleCard key={i} article={article} isMobile={isMobile} />
          ))}
        </div>
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

function ArticleCard({ article, isMobile }: { article: { category: string; title: string; summary: string; date: string }; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false);

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

  return (
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
        backgroundColor: hovered ? (CATEGORY_BG[article.category] || '#f0f0f0') : (CATEGORY_BG[article.category] || '#f8f8f8'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'filter 0.3s ease',
        filter: hovered ? 'brightness(0.95)' : 'brightness(1)',
      }}>
        <span style={{ fontSize: '13px', color: '#bbb', letterSpacing: '0.12em', fontWeight: '600' }}>
          {article.category.toUpperCase()}
        </span>
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
}