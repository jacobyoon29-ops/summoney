'use client';

export default function KakaoShareButton() {
  function handleShare() {
    const url = window.location.href;
    window.open(
      `https://story.kakao.com/share?url=${encodeURIComponent(url)}`,
      '_blank'
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
