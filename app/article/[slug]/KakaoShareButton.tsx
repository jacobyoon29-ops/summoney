'use client';

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

type Props = {
  title: string;
  description: string;
  imageUrl: string | null;
};

export default function KakaoShareButton({ title, description, imageUrl }: Props) {
  function handleShare() {
    console.log('[Kakao] 버튼 클릭됨');

    const kakao = window.Kakao;
    if (!kakao) {
      console.warn('[Kakao] window.Kakao 없음 — SDK 로드 안 됨');
      return;
    }
    console.log('[Kakao] SDK 감지됨, isInitialized:', kakao.isInitialized());

    if (!kakao.isInitialized()) {
      kakao.init('c06b27a2320bba7ab68559a89822f945');
      console.log('[Kakao] init 완료');
    }

    const payload = {
      objectType: 'feed',
      content: {
        title,
        description,
        ...(imageUrl ? { imageUrl } : {}),
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
    };
    console.log('[Kakao] sendDefault 호출:', payload);
    kakao.Share.sendDefault(payload);
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1C4.582 1 1 3.79 1 7.182c0 2.153 1.376 4.047 3.456 5.148L3.5 16l4.087-2.182C7.847 13.93 8.42 14 9 14c4.418 0 8-2.79 8-6.182C17 4.29 13.418 1 9 1z" fill="#391B1B"/>
      </svg>
      카카오톡 공유
    </button>
  );
}
