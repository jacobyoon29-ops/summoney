'use client';

import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
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
  const [viewCount, setViewCount] = useState<string>(String(initial?.view_count ?? 0));
  const [starCount, setStarCount] = useState<string>(String(initial?.star_count ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | 'draft' | 'publish' | 'delete'>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState(false);
  const draftKey = `summoney_draft_${initial?.id ?? 'new'}`;
  const titleRef = useRef(title);
  const slugRef = useRef(slug);
  const summaryRef = useRef(summary);
  const tagsRef = useRef(tags);
  const contentRef = useRef(content);
  const categoryRef = useRef(category);
  const scheduledAtRef = useRef(scheduledAt);
  titleRef.current = title;
  slugRef.current = slug;
  summaryRef.current = summary;
  tagsRef.current = tags;
  contentRef.current = content;
  categoryRef.current = category;
  scheduledAtRef.current = scheduledAt;

  const saveDraft = useCallback(() => {
    const data = {
      title: titleRef.current,
      slug: slugRef.current,
      summary: summaryRef.current,
      tags: tagsRef.current,
      content: contentRef.current,
      category: categoryRef.current,
      scheduledAt: scheduledAtRef.current,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey, JSON.stringify(data));
    const now = new Date();
    setAutoSavedAt(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  }, [draftKey]);

  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.savedAt) setDraftPrompt(true);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  function restoreDraft() {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.title !== undefined) setTitle(saved.title);
      if (saved.slug !== undefined) setSlug(saved.slug);
      if (saved.summary !== undefined) setSummary(saved.summary);
      if (Array.isArray(saved.tags)) setTags(saved.tags);
      if (saved.content !== undefined) setContent(saved.content);
      if (saved.category !== undefined) setCategory(saved.category as Category);
      if (saved.scheduledAt !== undefined) setScheduledAt(saved.scheduledAt);
    } catch { /* ignore */ }
    setDraftPrompt(false);
  }

  function discardDraft() {
    localStorage.removeItem(draftKey);
    setDraftPrompt(false);
  }

  function clearDraft() {
    localStorage.removeItem(draftKey);
    setAutoSavedAt(null);
  }

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFilled, setAiFilled] = useState(false);

  // AI 글 생성 모달
  const [aiArticleModal, setAiArticleModal] = useState(false);
  const [aiArticleTopic, setAiArticleTopic] = useState('');
  const [aiArticleQuestions, setAiArticleQuestions] = useState<string[]>([]);
  const [aiArticleQLoading, setAiArticleQLoading] = useState(false);
  const [aiArticleQError, setAiArticleQError] = useState<string | null>(null);
  const [aiArticleQCopied, setAiArticleQCopied] = useState(false);
  const [aiArticleToast, setAiArticleToast] = useState(false);
  const [aiArticleSource, setAiArticleSource] = useState('');
  const [aiArticleHooking, setAiArticleHooking] = useState<'external_observer' | 'number_reversal' | 'origin_story'>('external_observer');
  const [aiArticleDirection, setAiArticleDirection] = useState('');
  const [aiArticleLoading, setAiArticleLoading] = useState(false);
  const [aiArticleError, setAiArticleError] = useState<string | null>(null);
  const [aiArticleTitles, setAiArticleTitles] = useState<string[]>([]);
  const [aiArticleBody, setAiArticleBody] = useState('');
  const [aiArticleSelectedTitle, setAiArticleSelectedTitle] = useState<string | null>(null);

  async function handleAiQuestionsGenerate() {
    if (!aiArticleTopic.trim()) {
      setAiArticleQError('주제를 입력해주세요.');
      return;
    }
    setAiArticleQLoading(true);
    setAiArticleQError(null);
    setAiArticleQuestions([]);
    setAiArticleQCopied(false);
    try {
      const res = await fetch('/api/ai-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiArticleTopic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiArticleQError(data.error ?? '질문 생성 실패');
        return;
      }
      const questions = Array.isArray(data.questions) ? data.questions : [];
      setAiArticleQuestions(questions);
      if (questions.length > 0) {
        navigator.clipboard.writeText(questions.join('\n'));
        setAiArticleQCopied(true);
        setAiArticleToast(true);
        setTimeout(() => setAiArticleToast(false), 2000);
      }
    } catch {
      setAiArticleQError('네트워크 오류가 발생했습니다.');
    } finally {
      setAiArticleQLoading(false);
    }
  }

  async function handleAiArticleGenerate() {
    if (!aiArticleSource.trim()) {
      setAiArticleError('원본 소스를 입력해주세요.');
      return;
    }
    setAiArticleLoading(true);
    setAiArticleError(null);
    setAiArticleTitles([]);
    setAiArticleBody('');
    setAiArticleSelectedTitle(null);
    try {
      const res = await fetch('/api/ai-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: aiArticleSource, category, hookingPattern: aiArticleHooking, direction: aiArticleDirection }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiArticleError(data.error ?? 'AI 생성 실패');
        return;
      }
      setAiArticleTitles(Array.isArray(data.titles) ? data.titles : []);
      setAiArticleBody(data.body ?? '');
    } catch {
      setAiArticleError('네트워크 오류가 발생했습니다.');
    } finally {
      setAiArticleLoading(false);
    }
  }

  function applyAiArticle() {
    if (aiArticleSelectedTitle) setTitle(aiArticleSelectedTitle);
    if (aiArticleBody) setContent(aiArticleBody);
    setAiArticleModal(false);
    setAiArticleTopic('');
    setAiArticleQuestions([]);
    setAiArticleQError(null);
    setAiArticleQCopied(false);
    setAiArticleSource('');
    setAiArticleDirection('');
    setAiArticleTitles([]);
    setAiArticleBody('');
    setAiArticleSelectedTitle(null);
    setAiArticleError(null);
  }

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

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('slug', slug.trim());
      fd.append('summary', summary.trim());
      fd.append('tags', tags.join(','));
      fd.append('content', content.trim());
      fd.append('category', category);
      fd.append('is_published', String(publish));
      fd.append('scheduled_at', scheduledAt);
      if (isEdit) {
        fd.append('view_count', viewCount);
        fd.append('star_count', starCount);
      }
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
        clearDraft();
        setPending(null);
        router.push('/admin');
        router.refresh();
      } else {
        setError(result.error);
        setPending(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.');
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

  const CATEGORY_COLORS: Record<string, string> = { '다른나라 줍줍줍': '#3B82F6', '경제 줍줍줍': '#10B981', '사람 줍줍줍': '#F59E0B' };
  const CATEGORY_TEXT: Record<string, string> = { '다른나라 줍줍줍': '#fff', '경제 줍줍줍': '#fff', '사람 줍줍줍': '#fff' };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif', padding: '24px 20px 64px' }}>
      {/* 자동저장 / 임시저장 복원 팝업 */}
      {draftPrompt && (
        <div style={{ position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#333', fontWeight: 600 }}>
          <span>📝 임시저장된 글이 있습니다. 불러올까요?</span>
          <button onClick={restoreDraft} style={{ padding: '6px 14px', backgroundColor: '#c8a96e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>불러오기</button>
          <button onClick={discardDraft} style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>무시</button>
        </div>
      )}

      <div style={{ maxWidth: showPreview ? '1440px' : '720px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
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
          <div />
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 680px', minWidth: 0 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

          {/* 자동저장 상태 바 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: autoSavedAt ? '#aaa' : '#ddd', fontWeight: 500 }}>
              {autoSavedAt ? `자동저장됨 ${autoSavedAt}` : '아직 자동저장 안 됨'}
            </span>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              style={{ padding: '5px 14px', fontSize: '12px', fontWeight: 700, color: showPreview ? '#fff' : '#c8a96e', backgroundColor: showPreview ? '#c8a96e' : '#fff8f0', border: '1.5px solid #c8a96e', borderRadius: '7px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {showPreview ? '미리보기 닫기 ✕' : '👁 미리보기'}
            </button>
          </div>

          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ① 제목 */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="article-title">제목</label>
            <input
              id="article-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="독자에게 보이는 글 제목을 입력하세요"
              style={{ ...inputStyle, fontSize: '18px', fontWeight: 700 }}
              disabled={busy}
            />
          </div>

          {/* ② 본문 + AI 버튼들 */}
          <div style={fieldStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <label style={labelStyle} htmlFor="content">본문</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setAiArticleModal(true); setAiArticleTopic(''); setAiArticleQuestions([]); setAiArticleQError(null); setAiArticleQCopied(false); setAiArticleSource(''); setAiArticleDirection(''); setAiArticleTitles([]); setAiArticleBody(''); setAiArticleSelectedTitle(null); setAiArticleError(null); }}
                  disabled={busy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                    color: '#111',
                    backgroundColor: '#c8a96e',
                    border: 'none', borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(200,169,110,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  ✨ AI로 글 생성
                </button>
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

          {/* ⑨ 통계 직접 수정 (수정 모드 전용) */}
          {isEdit && (
            <div style={fieldStyle}>
              <label style={labelStyle}>통계 직접 수정</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={fieldStyle}>
                  <label style={{ ...labelStyle, fontSize: '13px', color: '#666' }} htmlFor="view_count">
                    조회수
                  </label>
                  <input
                    id="view_count"
                    type="number"
                    min="0"
                    value={viewCount}
                    onChange={(e) => setViewCount(e.target.value)}
                    style={inputStyle}
                    disabled={busy}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={{ ...labelStyle, fontSize: '13px', color: '#666' }} htmlFor="star_count">
                    ⭐ 별 수
                  </label>
                  <input
                    id="star_count"
                    type="number"
                    min="0"
                    value={starCount}
                    onChange={(e) => setStarCount(e.target.value)}
                    style={inputStyle}
                    disabled={busy}
                  />
                </div>
              </div>
            </div>
          )}

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
          </div>{/* end padding div */}
        </div>{/* end white card */}
        </div>{/* end form column */}

        {/* 미리보기 패널 */}
        {showPreview && (
          <div style={{ flex: 1, minWidth: 0, position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontSize: '12px', fontWeight: 700, color: '#c8a96e', letterSpacing: '0.08em' }}>
              PREVIEW
            </div>
            <div style={{ fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif', backgroundColor: '#fff', minHeight: '400px' }}>
              {/* 카테고리 */}
              <div style={{ padding: '24px 24px 0' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', backgroundColor: CATEGORY_COLORS[category] ?? '#eee', color: CATEGORY_TEXT[category] ?? '#333' }}>
                  {category}
                </span>
              </div>
              {/* 제목 */}
              <div style={{ padding: '16px 24px 0' }}>
                <h1 style={{ color: '#111', fontSize: '24px', fontWeight: 800, lineHeight: 1.4, letterSpacing: '-0.03em', margin: 0 }}>
                  {title || <span style={{ color: '#ccc' }}>제목 없음</span>}
                </h1>
              </div>
              {/* 요약 */}
              {summary && (
                <p style={{ padding: '12px 24px 0', color: '#666', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>{summary}</p>
              )}
              {/* 커버 이미지 */}
              {coverPreview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={coverPreview} alt="" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block', marginTop: '16px' }} />
              )}
              {/* 본문 */}
              <div style={{ padding: '16px 24px 32px' }}>
                {content && /<[a-z][\s\S]*>/i.test(content) ? (
                  <div className="article-body" dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <p style={{ color: content ? '#222' : '#ccc', fontSize: '15px', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                    {content || '본문이 없습니다.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        </div>{/* end split-view */}
      </div>
      {/* AI 글 생성 모달 */}
      {aiArticleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          {/* 토스트 */}
          {aiArticleToast && (
            <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: '#c8a96e', color: '#111', fontSize: '14px', fontWeight: 700, padding: '12px 20px', borderRadius: '12px', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              📋 질문이 복사됐어요! Liner나 유튜브에서 검색 후 소스를 붙여넣으세요
            </div>
          )}
          <div style={{ backgroundColor: '#1c1a17', border: '1px solid #333', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#c8a96e', fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>✨ AI 글 생성</h2>
              <button onClick={() => setAiArticleModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Step 1: 주제 입력 → 리서치 질문 생성 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#c8a96e', letterSpacing: '0.1em' }}>STEP 1 — 리서치 질문 생성 (선택사항)</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={aiArticleTopic}
                  onChange={(e) => setAiArticleTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiQuestionsGenerate(); } }}
                  placeholder="예: 일본 자판기"
                  style={{ flex: 1, backgroundColor: '#1c1a17', border: '1px solid #444', borderRadius: '8px', color: '#eee', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleAiQuestionsGenerate}
                  disabled={aiArticleQLoading}
                  style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, backgroundColor: aiArticleQLoading ? '#444' : '#2a2418', color: '#c8a96e', border: '1px solid #c8a96e', borderRadius: '8px', cursor: aiArticleQLoading ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                >
                  {aiArticleQLoading ? <SpinIcon /> : '질문 생성'}
                </button>
              </div>
              {aiArticleQError && (
                <p style={{ color: '#ff8080', fontSize: '13px', margin: 0 }}>{aiArticleQError}</p>
              )}
              {aiArticleQuestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>아래 질문을 검색해서 소스를 모아보세요</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(aiArticleQuestions.join('\n'));
                        setAiArticleQCopied(true);
                        setTimeout(() => setAiArticleQCopied(false), 2000);
                      }}
                      style={{ background: 'none', border: 'none', color: aiArticleQCopied ? '#c8a96e' : '#666', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {aiArticleQCopied ? '✓ 복사됨' : '전체 복사'}
                    </button>
                  </div>
                  {aiArticleQuestions.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', backgroundColor: '#1c1a17', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <span style={{ color: '#c8a96e', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                      <span style={{ color: '#ddd', fontSize: '13px', lineHeight: 1.55 }}>{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: 원본 소스 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#c8a96e', letterSpacing: '0.1em', marginBottom: '2px' }}>STEP 2 — 원본 자료 붙여넣기</div>
              <textarea
                value={aiArticleSource}
                onChange={(e) => setAiArticleSource(e.target.value)}
                placeholder="유튜브 스크립트, 기사, 메모 등 원본 자료를 붙여넣으세요"
                rows={8}
                style={{ backgroundColor: '#111', border: '1px solid #444', borderRadius: '10px', color: '#eee', fontSize: '14px', padding: '12px 14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.6 }}
              />
            </div>

            {/* Step 3: 후킹 패턴 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#c8a96e', letterSpacing: '0.1em', marginBottom: '2px' }}>STEP 3 — 후킹 패턴 선택</div>
              <label style={{ color: '#ccc', fontSize: '14px', fontWeight: 700 }}>후킹 패턴</label>
              {([
                ['external_observer', '외부 관찰자 시점', '예: 일본인이 한국에서 자판기를 찾는다'],
                ['number_reversal', '숫자 반전', '예: 줄었는데 매출은 늘었다'],
                ['origin_story', '탄생 비화', '예: 비웃음을 받았던 햇반'],
              ] as const).map(([value, label, example]) => (
                <label key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', borderRadius: '10px', backgroundColor: aiArticleHooking === value ? '#2a2418' : 'transparent', border: `1px solid ${aiArticleHooking === value ? '#c8a96e' : '#333'}`, transition: 'all 0.15s' }}>
                  <input
                    type="radio"
                    name="hooking"
                    value={value}
                    checked={aiArticleHooking === value}
                    onChange={() => setAiArticleHooking(value)}
                    style={{ marginTop: '2px', accentColor: '#c8a96e', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ color: '#eee', fontSize: '14px', fontWeight: 700 }}>{label}</div>
                    <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{example}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* 편집 방향 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#ccc', fontSize: '14px', fontWeight: 700 }}>편집 방향 메모 <span style={{ color: '#666', fontWeight: 400 }}>(선택사항)</span></label>
              <textarea
                value={aiArticleDirection}
                onChange={(e) => setAiArticleDirection(e.target.value)}
                placeholder="예) 햇반이 처음엔 실패작 취급 받았다는 걸 강조해줘 / 일본 특유의 장인정신 각도로 써줘 / 비즈니스 인사이트보다 문화적 재미에 집중해줘"
                rows={3}
                style={{ backgroundColor: '#111', border: '1px solid #444', borderRadius: '10px', color: '#eee', fontSize: '14px', padding: '12px 14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.6 }}
              />
            </div>

            {/* 생성하기 버튼 */}
            <button
              type="button"
              onClick={handleAiArticleGenerate}
              disabled={aiArticleLoading}
              style={{ padding: '14px', fontSize: '15px', fontWeight: 700, backgroundColor: aiArticleLoading ? '#555' : '#c8a96e', color: '#111', border: 'none', borderRadius: '10px', cursor: aiArticleLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              {aiArticleLoading ? <><SpinIcon /><span style={{ color: '#111' }}>생성 중...</span></> : '생성하기'}
            </button>

            {/* 오류 */}
            {aiArticleError && (
              <p style={{ backgroundColor: '#2a0a0a', border: '1px solid #c0392b', color: '#ff8080', fontSize: '14px', fontWeight: 600, padding: '12px 14px', borderRadius: '10px', margin: 0 }}>
                {aiArticleError}
              </p>
            )}

            {/* 제목 선택 */}
            {aiArticleTitles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ color: '#ccc', fontSize: '14px', fontWeight: 700 }}>제목 선택 (클릭해서 선택)</label>
                {aiArticleTitles.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAiArticleSelectedTitle(t)}
                    style={{ textAlign: 'left', padding: '14px 16px', backgroundColor: aiArticleSelectedTitle === t ? '#2a2418' : '#111', border: `1.5px solid ${aiArticleSelectedTitle === t ? '#c8a96e' : '#444'}`, borderRadius: '10px', color: aiArticleSelectedTitle === t ? '#c8a96e' : '#ddd', fontSize: '15px', fontWeight: aiArticleSelectedTitle === t ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.5 }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* 본문 미리보기 */}
            {aiArticleBody && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#ccc', fontSize: '14px', fontWeight: 700 }}>생성된 본문 미리보기</label>
                <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '14px', color: '#bbb', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: '260px', overflowY: 'auto' }}>
                  {aiArticleBody}
                </div>
              </div>
            )}

            {/* 에디터에 적용 */}
            {aiArticleBody && (
              <button
                type="button"
                onClick={applyAiArticle}
                style={{ padding: '14px', fontSize: '15px', fontWeight: 700, backgroundColor: '#FF6B6B', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                에디터에 적용{aiArticleSelectedTitle ? ` — "${aiArticleSelectedTitle.slice(0, 20)}${aiArticleSelectedTitle.length > 20 ? '…' : ''}"` : ' (제목 미선택)'}
              </button>
            )}
          </div>
        </div>
      )}

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
