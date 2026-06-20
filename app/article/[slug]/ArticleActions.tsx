'use client';

import { useEffect, useState } from 'react';
import { incrementView, incrementStar } from '@/app/admin/actions';

const GOLD = '#c8a96e';

export default function ArticleActions({
  articleId,
  viewCount,
  starCount,
  readingTime,
}: {
  articleId: string;
  viewCount: number;
  starCount: number;
  readingTime: number;
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
        padding: '12px 0',
        borderTop: '1px solid #eee',
        marginTop: '16px',
        marginBottom: '24px',
      }}
    >
      {/* 읽기시간 */}
      <span style={{ fontSize: '14px', color: '#555', fontWeight: 500 }}>
        약 {readingTime}분 읽기
      </span>

      {/* 조회수 */}
      <span style={{ fontSize: '15px', color: '#555', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          gap: '4px',
          padding: 0,
          border: 'none',
          background: 'none',
          color: starred ? GOLD : '#bbb',
          fontSize: '15px',
          fontWeight: 500,
          cursor: starred ? 'default' : 'pointer',
          transition: 'color 0.2s',
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
