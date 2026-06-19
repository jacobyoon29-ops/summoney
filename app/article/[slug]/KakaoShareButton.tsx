'use client';
import { useEffect, useRef } from 'react';

const APP_KEY = 'c06b27a2320bba7ab68559a89822f945';
const SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
const SDK_INTEGRITY = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';

export default function KakaoShareButton({
  title,
  description,
  imageUrl,
}: {
  title: string;
  description?: string;
  imageUrl?: string;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).Kakao;

    const init = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const k = (window as any).Kakao;
      if (k && !k.isInitialized()) {
        k.init(APP_KEY);
      }
      initialized.current = true;
    };

    if (kakao) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = SDK_SRC;
      script.integrity = SDK_INTEGRITY;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, []);

  const handleShare = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).Kakao;
    if (!kakao) return;
    if (!kakao.isInitialized()) kakao.init(APP_KEY);

    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: description ?? '',
        imageUrl: imageUrl || 'https://summoney.vercel.app/og-image.png',
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
        color: '#391B1B',
        fontFamily: 'inherit',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 1C5.03 1 1 4.358 1 8.5c0 2.674 1.676 5.025 4.2 6.394L4.2 18l3.8-2.1c.645.09 1.31.137 1.998.137C14.97 16 19 12.642 19 8.5S14.97 1 10 1z" fill="#391B1B"/>
        <text x="10" y="9" textAnchor="middle" dominantBaseline="middle" fill="#FEE500" fontSize="4" fontWeight="900" fontFamily="Arial Black, sans-serif">TALK</text>
      </svg>
      카카오톡 공유
    </button>
  );
}
