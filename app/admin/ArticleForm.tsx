'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, type Article, type Category } from '@/lib/supabase';
import { createArticle, updateArticle, deleteArticle } from './actions';

export default function ArticleForm({ initial }: { initial?: Article }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [category, setCategory] = useState<Category>(
    (initial?.category as Category) ?? CATEGORIES[0]
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // 미리보기: 새로 고른 파일의 objectURL 또는 기존 이미지 URL
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.cover_image ?? null
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | 'draft' | 'publish' | 'delete'>(null);

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

  async function submit(publish: boolean) {
    setError(null);
    setPending(publish ? 'publish' : 'draft');

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('summary', summary.trim());
    fd.append('content', content.trim());
    fd.append('category', category);
    fd.append('is_published', String(publish));
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
    <div
      style={{
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
        padding: '24px 20px 64px',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '12px',
            }}
          >
            ← 목록으로
          </button>
          <h1
            style={{
              color: '#111',
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            {isEdit ? '글 수정' : '새 글 작성'}
          </h1>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* 제목 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="title">제목</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="글 제목을 입력하세요"
              style={inputStyle}
              disabled={busy}
            />
          </div>

          {/* 카테고리 */}
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

          {/* 요약 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="summary">
              요약 <span style={{ color: '#bbb', fontWeight: 400 }}>(목록·카드에 보이는 한 줄 설명)</span>
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="한 줄 요약을 입력하세요 (선택)"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              disabled={busy}
            />
          </div>

          {/* 커버 이미지 */}
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
                <img
                  src={coverPreview}
                  alt="커버 미리보기"
                  style={{
                    width: '100%',
                    maxHeight: '240px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={busy}
                  style={{
                    marginTop: '8px',
                    background: 'none',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    color: '#888',
                    cursor: 'pointer',
                  }}
                >
                  이미지 제거
                </button>
              </div>
            )}
          </div>

          {/* 내용 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="content">내용</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="글 내용을 입력하세요"
              rows={12}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              disabled={busy}
            />
          </div>

          {error && (
            <p style={{ ...messageStyle, color: '#c0392b', backgroundColor: '#fff0f0' }}>
              {error}
            </p>
          )}

          {/* 저장 버튼: 임시저장 / 발행 */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={busy}
              style={{ ...btnBase, backgroundColor: '#fff', color: '#555', border: '1px solid #ddd', flex: 1 }}
            >
              {pending === 'draft' ? '저장 중...' : '임시저장'}
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={busy}
              style={{ ...btnBase, backgroundColor: busy ? '#ffb3b3' : '#FF6B6B', color: '#fff', flex: 1 }}
            >
              {pending === 'publish' ? '발행 중...' : '발행하기'}
            </button>
          </div>

          {/* 삭제 (수정 모드에서만) */}
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              style={{
                ...btnBase,
                backgroundColor: 'transparent',
                color: '#c0392b',
                border: '1px solid #f0d0d0',
              }}
            >
              {pending === 'delete' ? '삭제 중...' : '글 삭제'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: CSSProperties = { fontSize: '14px', fontWeight: 700, color: '#333' };
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '15px',
  color: '#111',
  backgroundColor: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '10px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
const messageStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 14px',
  borderRadius: '10px',
};
const btnBase: CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};
