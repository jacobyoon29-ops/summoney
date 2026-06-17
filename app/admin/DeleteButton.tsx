'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteArticle } from './actions';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm('이 글을 삭제할까요? 되돌릴 수 없습니다.')) return;
    setPending(true);
    const result = await deleteArticle(id);
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        background: 'none',
        border: '1px solid #f0d0d0',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#c0392b',
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? '삭제 중...' : '삭제'}
    </button>
  );
}
