'use client';

import { useState, useEffect } from 'react';

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

const APP_KEY = 'c06b27a2320bba7ab68559a89822f945';

type Props = {
  title: string;
  description: string;
  imageUrl: string | null;
};

export default function KakaoShareButton({ title, description, imageUrl }: Props) {
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
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description,
            ...(imageUrl ? { imageUrl } : {}),
            link: { mobileWebUrl: url, webUrl: url },
          },
        });
        return;
      } catch (e) {
        console.warn('[Kakao] sendDefault 실패, fallback 사용:', e);
      }
    }

    // fallback: 카카오 공유 URL
    const params = encodeURIComponent(JSON.stringify({ title, description, url }));
    window.open(
      `https://sharer.kakao.com/talk/friends/picker/link?app_key=${APP_KEY}&validation_action=default&validation_params=${params}`,
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
        <circle cx="10" cy="10" r="10" fill="#FEE500"/>
        <path d="M10 4C6.686 4 4 6.239 4 9c0 1.752 1.07 3.29 2.686 4.22L6 16l2.857-1.5C9.22 14.83 9.605 14.857 10 14.857 13.314 14.857 16 12.618 16 9c0-2.761-2.686-5-6-5z" fill="#391B1B"/>
        <text x="10" y="11" textAnchor="middle" fill="#FEE500" fontSize="3.5" fontWeight="bold">talk</text>
      </svg>
      카카오톡 공유
    </button>
  );
}
