'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFeatured } from './actions';

export default function FeaturedButton({ id, isFeatured }: { id: string; isFeatured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [featured, setFeatured] = useState(isFeatured);

  async function handleClick() {
    setPending(true);
    const result = await toggleFeatured(id, featured);
    if (result.ok) {
      setFeatured((v) => !v);
      router.refresh();
    } else {
      alert(result.error);
    }
    setPending(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={featured ? 'Featured 해제' : 'Featured 설정'}
      style={{
        background: 'none',
        border: `1px solid ${featured ? '#c8a96e' : '#e5e5e5'}`,
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '15px',
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.5 : 1,
        lineHeight: 1,
      }}
    >
      <span style={{ filter: featured ? 'none' : 'grayscale(1)', transition: 'filter 0.2s' }}>⭐</span>
    </button>
  );
}
