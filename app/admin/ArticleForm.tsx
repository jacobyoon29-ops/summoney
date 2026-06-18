'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CATEGORIES, type Article, type Category } from '@/lib/supabase';
import { createArticle, updateArticle, deleteArticle } from './actions';

const ContentEditor = dynamic(() => import('./ContentEditor'), { ssr: false });

export default function ArticleForm({ initial }: { initial?: Article }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(
    initial?.slug
      ? initial.slug.replace(/-[a-z0-9]{6,}$/, '') // 접미사 제거해서 보여줌
      : ''
  );
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [content, setContent] = useState(initial?.content ?? '');
  const [category, setCategory] = useState<Category>(
    (initial?.category as Category) ?? CATEGORIES[0]
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.cover_image ?? null
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>(
    initial?.scheduled_at
      ? new Date(initial.scheduled_at).toISOString().slice(0, 16)
      : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | 'draft' | 'publish' | 'delete'>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFilled, setAiFilled] = useState(false);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    setRemoveCover(false);
    setCoverPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : initial?.cover_image ?? null;
    });
  }

  function handleRemoveCover() {
    setCoverFile(null);
    setRemoveCover(true);
    setCoverPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function addTagFromInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
      (e.target as HTMLInputElement).value = '';
    }
  }

  async function handleAiGenerate() {
    if (!content.trim()) {
      setAiError('본문을 먼저 입력해주세요.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiFilled(false);
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? 'AI 생성 실패');
        return;
      }
      if (data.seoTitle) setTitle(data.seoTitle);
      if (data.metaDescription) setSummary(data.metaDescription);
      if (data.slug) setSlug(data.slug);
      if (Array.isArray(data.hashtags)) setTags(data.hashtags);
      setAiFilled(true);
    } catch {
      setAiError('네트워크 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(publish: boolean) {
    setError(null);
    setPending(publish ? 'publish' : 'draft');

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('slug', slug.trim());
    fd.append('summary', summary.trim());
    fd.append('tags', tags.join(','));
    fd.append('content', content.trim());
    fd.append('category', category);
    fd.append('is_published', String(publish));
    fd.append('scheduled_at', scheduledAt);
    if (coverFile) fd.append('cover', coverFile);

    let result;
    if (isEdit) {
      fd.append('id', initial!.id);
      fd.append('existing_cover', initial!.cover_image ?? '');
      fd.append('remove_cover', String(removeCover));
      result = await updateArticle(fd);
    } else {
      result = await createArticle(fd);
    }

    if (result.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError(result.error);
      setPending(null);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm('이 글을 삭제할까요? 되돌릴 수 없습니다.')) return;
    setError(null);
    setPending('delete');
    const result = await deleteArticle(initial.id);
    if (result.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError(result.error);
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif', padding: '24px 20px 64px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}
          >
            ← 목록으로
          </button>
          <h1 style={{ color: '#111', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {isEdit ? '글 수정' : '새 글 작성'}
          </h1>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ① 본문 + AI 자동생성 버튼 */}
          <div style={fieldStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <label style={labelStyle} htmlFor="content">본문</label>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={busy || aiLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                  color: '#fff',
                  background: aiLoading
                    ? 'linear-gradient(90deg,#a78bfa,#818cf8)'
                    : 'linear-gradient(90deg,#7c3aed,#4f46e5)',
                  border: 'none', borderRadius: '8px',
                  cursor: aiLoading ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: aiLoading ? 'none' : '0 2px 8px rgba(124,58,237,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {aiLoading
                  ? <><SpinIcon /> AI 분석 중...</>
                  : <>✦ AI 자동완성</>}
              </button>
            </div>
            <ContentEditor
              value={content}
              onChange={setContent}
              disabled={busy}
            />
          </div>

          {/* AI 오류 */}
          {aiError && (
            <p style={{ ...messageStyle, color: '#c0392b', backgroundColor: '#fff0f0' }}>
              {aiError}
            </p>
          )}

          {/* AI 완료 배너 */}
          {aiFilled && !aiError && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#166534', fontWeight: 600 }}>
              ✓ SEO 제목·메타 디스크립션·슬러그·해시태그가 자동으로 채워졌습니다. 내용을 검토하고 수정하세요.
            </div>
          )}

          {/* ② SEO 제목 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="title">
              SEO 제목
              <CharCount value={title} max={60} />
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="검색 결과에 표시될 제목 (30~60자 권장)"
              style={inputStyle}
              disabled={busy}
            />
          </div>

          {/* ③ 슬러그 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="slug">
              URL 슬러그
              <span style={{ color: '#bbb', fontWeight: 400, fontSize: '12px', marginLeft: '6px' }}>영문 소문자·숫자·하이픈만</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <span style={{ padding: '12px 10px 12px 14px', fontSize: '13px', color: '#999', backgroundColor: '#f8f8f8', border: '1px solid #e5e5e5', borderRight: 'none', borderRadius: '10px 0 0 10px', whiteSpace: 'nowrap' }}>
                /article/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                placeholder="my-article-slug"
                style={{ ...inputStyle, borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                disabled={busy}
              />
            </div>
          </div>

          {/* ④ 메타 디스크립션 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="summary">
              메타 디스크립션
              <CharCount value={summary} max={160} />
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="검색 결과 스니펫·카드 설명 (130~150자 권장)"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              disabled={busy}
            />
          </div>

          {/* ⑤ 해시태그 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              해시태그
              <span style={{ color: '#bbb', fontWeight: 400, fontSize: '12px', marginLeft: '6px' }}>Enter 또는 쉼표로 추가</span>
            </label>
            <div style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '8px 12px', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '46px', alignItems: 'center' }}>
              {tags.map((tag) => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f0ff', color: '#4f46e5', fontSize: '13px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={busy}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: '14px', lineHeight: 1, padding: '0 0 0 2px' }}
                  >×</button>
                </span>
              ))}
              <input
                type="text"
                onKeyDown={addTagFromInput}
                placeholder={tags.length === 0 ? '태그 입력 후 Enter...' : ''}
                disabled={busy}
                style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#111', minWidth: '120px', flex: 1, fontFamily: 'inherit', backgroundColor: 'transparent' }}
              />
            </div>
          </div>

          {/* ⑥ 카테고리 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="category">카테고리</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              style={inputStyle}
              disabled={busy}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* ⑦ 커버 이미지 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="cover">커버 이미지</label>
            <input
              id="cover"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              style={{ fontSize: '14px', color: '#555' }}
              disabled={busy}
            />
            {coverPreview && (
              <div style={{ marginTop: '12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="커버 미리보기" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #f0f0f0' }} />
                <button type="button" onClick={handleRemoveCover} disabled={busy}
                  style={{ marginTop: '8px', background: 'none', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
                  이미지 제거
                </button>
              </div>
            )}
          </div>

          {/* ⑧ 예약 발행 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="scheduled_at">
              예약 발행
              <span style={{ color: '#bbb', fontWeight: 400, fontSize: '12px', marginLeft: '6px' }}>비워두면 즉시 발행</span>
            </label>
            <input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={inputStyle}
              disabled={busy}
            />
            {scheduledAt && (
              <p style={{ fontSize: '13px', color: '#7c3aed', margin: 0 }}>
                ⏰ {new Date(scheduledAt).toLocaleString('ko-KR')}에 자동 발행됩니다.
                <button type="button" onClick={() => setScheduledAt('')}
                  style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                  취소
                </button>
              </p>
            )}
          </div>

          {error && (
            <p style={{ ...messageStyle, color: '#c0392b', backgroundColor: '#fff0f0' }}>
              {error}
            </p>
          )}

          {/* 저장/발행 버튼 */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => submit(false)} disabled={busy}
              style={{ ...btnBase, backgroundColor: '#fff', color: '#555', border: '1px solid #ddd', flex: 1 }}>
              {pending === 'draft' ? '저장 중...' : '임시저장'}
            </button>
            <button type="button" onClick={() => submit(true)} disabled={busy}
              style={{ ...btnBase, backgroundColor: busy ? '#ffb3b3' : '#FF6B6B', color: '#fff', flex: 1 }}>
              {pending === 'publish' ? '발행 중...' : scheduledAt ? '예약 저장' : '발행하기'}
            </button>
          </div>

          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={busy}
              style={{ ...btnBase, backgroundColor: 'transparent', color: '#c0392b', border: '1px solid #f0d0d0' }}>
              {pending === 'delete' ? '삭제 중...' : '글 삭제'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SpinIcon() {
  return <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>✦</span>;
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: over ? '#e53e3e' : '#bbb' }}>
      {len}/{max}
    </span>
  );
}

const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: CSSProperties = { fontSize: '14px', fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center' };
const inputStyle: CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: '15px', color: '#111',
  backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};
const messageStyle: CSSProperties = { fontSize: '14px', fontWeight: 600, padding: '12px 14px', borderRadius: '10px' };
const btnBase: CSSProperties = {
  fontSize: '16px', fontWeight: 700, padding: '14px', border: 'none',
  borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.2s ease',
};
