'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

export default function KakaoShareButton({ title, description, imageUrl }: { title: string; description?: string; imageUrl?: string }) {
  const [kakaoReady, setKakaoReady] = useState(false);

  useEffect(() => {
    // 이미 로드된 경우
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init('c06b27a2320bba7ab68559a89822f945');
      }
      setKakaoReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakaojs/latest/kakao.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init('c06b27a2320bba7ab68559a89822f945');
      }
      setKakaoReady(true);
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  const handleShare = () => {
    if (!kakaoReady || !window.Kakao?.isInitialized()) {
      alert('카카오 SDK 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: description ?? '',
        imageUrl: imageUrl ?? '',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
    });
  };

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
        padding: '6px 14px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        fontFamily: 'inherit',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 1C5.03 1 1 4.358 1 8.5c0 2.674 1.676 5.025 4.2 6.394L4.2 18l3.8-2.1c.645.09 1.31.137 1.998.137C14.97 16 19 12.642 19 8.5S14.97 1 10 1z" fill="#1E1E1E"/>
        <text x="10" y="9" textAnchor="middle" dominantBaseline="middle" fill="#FEE500" fontSize="4" fontWeight="900" fontFamily="Arial, sans-serif">TALK</text>
      </svg>
      카카오톡 공유
    </button>
  );
}
