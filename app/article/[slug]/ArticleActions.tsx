'use client';

import { useEffect, useState } from 'react';
import { incrementView, incrementStar } from '@/app/admin/actions';

const GOLD = '#c8a96e';

export default function ArticleActions({
  articleId,
  viewCount,
  starCount,
}: {
  articleId: string;
  viewCount: number;
  starCount: number;
}) {
  const [stars, setStars] = useState(starCount);
  const [starred, setStarred] = useState(false);
  const [views, setViews] = useState(viewCount);

  useEffect(() => {
    // 이미 별 눌렀는지 확인
    const key = `starred-${articleId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(key)) {
      setStarred(true);
    }
    // 조회수 증가
    incrementView(articleId).then(() => {
      setViews((v) => v + 1);
    });
  }, [articleId]);

  async function handleStar() {
    if (starred) return;
    setStarred(true);
    setStars((s) => s + 1);
    localStorage.setItem(`starred-${articleId}`, '1');
    await incrementStar(articleId);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
      }}
    >
      {/* 조회수 */}
      <span style={{ fontSize: '13px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {views.toLocaleString()}
      </span>

      {/* 별(좋아요) 버튼 */}
      <button
        type="button"
        onClick={handleStar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 14px',
          border: `1.5px solid ${starred ? GOLD : '#e0e0e0'}`,
          borderRadius: '20px',
          backgroundColor: starred ? '#fff9ee' : '#fff',
          color: starred ? GOLD : '#aaa',
          fontSize: '13px',
          fontWeight: 700,
          cursor: starred ? 'default' : 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1 }}>
          {starred ? '★' : '☆'}
        </span>
        {stars.toLocaleString()}
      </button>
    </div>
  );
}
