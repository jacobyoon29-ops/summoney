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
    const kakao = window.Kakao;
    if (!kakao) return;
    if (!kakao.isInitialized()) {
      kakao.init('c06b27a2320bba7ab68559a89822f945');
    }
    kakao.Share.sendDefault({
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
    });
  }

  return (
    <button
      onClick={handleShare}
      style={{
        backgroundColor: '#FEE500',
        border: 'none',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '13px',
        color: '#3C1E1E',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      💬 카카오 공유
    </button>
  );
}
