'use client';

import { useState } from 'react';

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: '1px solid #e5e5e5',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '13px',
        color: copied ? '#4caf50' : '#888',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'color 0.2s, border-color 0.2s',
        borderColor: copied ? '#a5d6a7' : '#e5e5e5',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ 복사됨' : '🔗 링크 복사'}
    </button>
  );
}
