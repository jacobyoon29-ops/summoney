'use client';

import { useState, useEffect } from 'react';
import { getSeries, createSeries, updateSeries, deleteSeries } from '../actions';
import type { Series } from '@/lib/supabase';

const dark = '#1c1a17';
const gold = '#c8a96e';
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '14px', color: '#eee',
  backgroundColor: '#111', border: '1px solid #444', borderRadius: '8px',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

export default function SeriesPage() {
  const [list, setList] = useState<Series[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Series | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [slugLoading, setSlugLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await getSeries();
    setList(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setName(''); setSlug(''); setDescription(''); setCoverImage(''); setError(null);
    setShowForm(true);
  }

  function openEdit(s: Series) {
    setEditTarget(s);
    setName(s.name); setSlug(s.slug); setDescription(s.description ?? ''); setCoverImage(s.cover_image ?? '');
    setError(null);
    setShowForm(true);
  }

  async function generateSlug() {
    if (!name.trim()) return;
    setSlugLoading(true);
    try {
      const res = await fetch('/api/generate-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.slug) setSlug(data.slug);
    } catch { /* ignore */ } finally {
      setSlugLoading(false);
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const fd = new FormData();
    fd.append('name', name);
    fd.append('slug', slug);
    fd.append('description', description);
    fd.append('cover_image', coverImage);
    if (editTarget) fd.append('id', editTarget.id);
    const result = editTarget ? await updateSeries(fd) : await createSeries(fd);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string, seriesName: string) {
    if (!confirm(`"${seriesName}" 시리즈를 삭제할까요? 소속 글의 시리즈 배정은 해제됩니다.`)) return;
    await deleteSeries(id);
    load();
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: dark, fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h1 style={{ color: gold, fontSize: '22px', fontWeight: 800, margin: 0 }}>시리즈 / 특집</h1>
          <button onClick={openCreate} style={{ padding: '8px 20px', backgroundColor: gold, color: dark, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            + 새 시리즈
          </button>
        </div>

        {loading && <p style={{ color: '#888' }}>불러오는 중...</p>}

        {!loading && list.length === 0 && (
          <p style={{ color: '#888', fontSize: '15px' }}>시리즈가 없어요. 새 시리즈를 만들어보세요.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.map((s) => (
            <div key={s.id} style={{ border: '1px solid #333', borderRadius: '10px', padding: '16px 20px', backgroundColor: '#242118', display: 'flex', alignItems: 'center', gap: '16px' }}>
              {s.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover_image} alt={s.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#f0e8d6', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>{s.name}</p>
                <p style={{ color: '#666', fontSize: '12px', margin: '0 0 2px' }}>/{s.slug}</p>
                {s.description && <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{s.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a href={`/series/${s.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', border: '1px solid #333', borderRadius: '7px', color: gold, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                  보기 ↗
                </a>
                <button onClick={() => openEdit(s)} style={{ padding: '6px 12px', border: `1px solid ${gold}`, borderRadius: '7px', color: gold, fontSize: '12px', fontWeight: 600, backgroundColor: 'transparent', cursor: 'pointer' }}>
                  수정
                </button>
                <button onClick={() => handleDelete(s.id, s.name)} style={{ padding: '6px 12px', border: '1px solid #555', borderRadius: '7px', color: '#888', fontSize: '12px', fontWeight: 600, backgroundColor: 'transparent', cursor: 'pointer' }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 폼 모달 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: dark, border: '1px solid #333', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: gold, fontSize: '18px', fontWeight: 800, margin: 0 }}>{editTarget ? '시리즈 수정' : '새 시리즈'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontSize: '13px', fontWeight: 700 }}>시리즈 이름 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 우리가 몰랐던 독재국가" style={inp} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontSize: '13px', fontWeight: 700 }}>URL 슬러그 *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                  placeholder="dictatorship-we-never-knew"
                  style={{ ...inp, flex: 1 }}
                />
                <button
                  onClick={generateSlug}
                  disabled={slugLoading || !name.trim()}
                  style={{ padding: '10px 14px', backgroundColor: slugLoading ? '#333' : '#2a2418', color: gold, border: `1px solid ${gold}`, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {slugLoading ? '...' : 'AI 생성'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontSize: '13px', fontWeight: 700 }}>설명 <span style={{ color: '#555', fontWeight: 400 }}>(선택)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="독자에게 보여줄 시리즈 소개" style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#ccc', fontSize: '13px', fontWeight: 700 }}>커버 이미지 URL <span style={{ color: '#555', fontWeight: 400 }}>(선택)</span></label>
              <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://images.unsplash.com/..." style={inp} />
            </div>

            {error && <p style={{ color: '#ff8080', fontSize: '13px', margin: 0 }}>{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '12px', backgroundColor: saving ? '#555' : gold, color: dark, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
