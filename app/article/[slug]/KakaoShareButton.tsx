'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
        sendScrap: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const APP_KEY = 'c06b27a2320bba7ab68559a89822f945';

export default function KakaoShareButton() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // SDK가 이미 로드됐을 수도 있고, 아직 로드 중일 수도 있어서 폴링
    let tries = 0;
    const id = setInterval(() => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(APP_KEY);
        }
        setReady(true);
        clearInterval(id);
      }
      if (++tries > 20) clearInterval(id); // 10초 후 포기
    }, 500);
    return () => clearInterval(id);
  }, []);

  function handleShare() {
    const url = window.location.href;

    if (ready && window.Kakao?.Share) {
      try {
        window.Kakao.Share.sendScrap({ requestUrl: url });
        return;
      } catch (e) {
        console.warn('[Kakao] sendScrap 실패, fallback 사용:', e);
      }
    }

    // fallback
    window.open(
      `https://sharer.kakao.com/talk/friends/picker/easylink?app_key=${APP_KEY}&shimmed_url=${encodeURIComponent(url)}`,
      '_blank',
      'width=500,height=600'
    );
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#FEE500',
        border: 'none',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '13px',
        color: '#000',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 1C5.03 1 1 4.358 1 8.5c0 2.674 1.676 5.025 4.2 6.394L4.2 18l3.8-2.1c.645.09 1.31.137 1.998.137C14.97 16 19 12.642 19 8.5S14.97 1 10 1z" fill="#1E1E1E"/>
        <text x="10" y="9" textAnchor="middle" dominantBaseline="central" fill="#FEE500" fontSize="4" fontWeight="900" fontFamily="Arial, sans-serif">TALK</text>
      </svg>
      카카오톡 공유
    </button>
  );
}
