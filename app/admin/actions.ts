'use server';

import { CATEGORIES, COVER_BUCKET, type Article } from '@/lib/supabase';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { isAuthed } from './auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

// 커버 이미지를 Storage 에 업로드하고 public URL 을 돌려준다. (없으면 null)
async function uploadCover(
  supabase: ReturnType<typeof getAdminClient>,
  cover: File
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  // covers 버킷이 없으면 자동 생성 (public)
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) return { ok: false, error: '버킷 조회 실패: ' + listError.message };
  if (!buckets?.some((b) => b.name === COVER_BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(COVER_BUCKET, {
      public: true,
    });
    if (createError) return { ok: false, error: '버킷 생성 실패: ' + createError.message };
  }

  const ext = cover.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, cover, { contentType: cover.type || undefined, upsert: false });
  if (uploadError) return { ok: false, error: '이미지 업로드 실패: ' + uploadError.message };

  return { ok: true, url: supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl };
}

// 제목으로 URL 친화적인 slug 생성 (한글 유지 + 충돌 방지용 접미사)
function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'post'}-${Date.now().toString(36)}`;
}

function validate(
  title: string,
  content: string,
  category: string
): string | null {
  if (!title) return '제목을 입력해주세요.';
  if (!content) return '내용을 입력해주세요.';
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number]))
    return '올바른 카테고리를 선택해주세요.';
  return null;
}

/** 글 목록 조회 (최신순) */
export async function getArticles(): Promise<
  { ok: true; articles: Article[] } | { ok: false; error: string }
> {
  if (!(await isAuthed())) return { ok: false, error: '로그인이 필요합니다.' };
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, articles: (data ?? []) as Article[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '목록을 불러오지 못했습니다.' };
  }
}

/** 글 1개 조회 (수정 화면용) */
export async function getArticle(id: string): Promise<Article | null> {
  if (!(await isAuthed())) return null;
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Article;
  } catch {
    return null;
  }
}

/** 새 글 작성 */
export async function createArticle(formData: FormData): Promise<ActionResult> {
  if (!(await isAuthed())) return { ok: false, error: '로그인이 필요합니다.' };

  let supabase: ReturnType<typeof getAdminClient>;
  try {
    supabase = getAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '설정 오류' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const summaryRaw = String(formData.get('summary') ?? '').trim();
  const isPublished = formData.get('is_published') === 'true';
  const cover = formData.get('cover');

  const invalid = validate(title, content, category);
  if (invalid) return { ok: false, error: invalid };

  let coverImage: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    const up = await uploadCover(supabase, cover);
    if (!up.ok) return up;
    coverImage = up.url;
  }

  const { error } = await supabase.from('articles').insert({
    title,
    content,
    category,
    summary: summaryRaw || null,
    slug: makeSlug(title),
    cover_image: coverImage,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
  });
  if (error) return { ok: false, error: '저장 실패: ' + error.message };

  return { ok: true };
}

/** 글 수정 */
export async function updateArticle(formData: FormData): Promise<ActionResult> {
  if (!(await isAuthed())) return { ok: false, error: '로그인이 필요합니다.' };

  let supabase: ReturnType<typeof getAdminClient>;
  try {
    supabase = getAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '설정 오류' };
  }

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: '잘못된 요청입니다 (id 없음).' };

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const summaryRaw = String(formData.get('summary') ?? '').trim();
  const isPublished = formData.get('is_published') === 'true';
  const removeCover = formData.get('remove_cover') === 'true';
  const existingCover = String(formData.get('existing_cover') ?? '') || null;
  const cover = formData.get('cover');

  const invalid = validate(title, content, category);
  if (invalid) return { ok: false, error: invalid };

  // 커버 이미지: 새 파일 → 교체 / 제거 선택 → null / 그 외 → 기존 유지
  let coverImage: string | null = existingCover;
  if (cover instanceof File && cover.size > 0) {
    const up = await uploadCover(supabase, cover);
    if (!up.ok) return up;
    coverImage = up.url;
  } else if (removeCover) {
    coverImage = null;
  }

  // published_at: 발행 상태로 바꿀 때만 새로 찍고, 이미 발행돼 있으면 기존 값 유지
  const { data: current } = await supabase
    .from('articles')
    .select('published_at, is_published')
    .eq('id', id)
    .maybeSingle();

  let publishedAt: string | null = null;
  if (isPublished) {
    publishedAt = current?.is_published && current?.published_at
      ? current.published_at
      : new Date().toISOString();
  }

  const { error } = await supabase
    .from('articles')
    .update({
      title,
      content,
      category,
      summary: summaryRaw || null,
      cover_image: coverImage,
      is_published: isPublished,
      published_at: publishedAt,
    })
    .eq('id', id);
  if (error) return { ok: false, error: '수정 실패: ' + error.message };

  return { ok: true };
}

/** 글 삭제 */
export async function deleteArticle(id: string): Promise<ActionResult> {
  if (!(await isAuthed())) return { ok: false, error: '로그인이 필요합니다.' };
  if (!id) return { ok: false, error: '잘못된 요청입니다 (id 없음).' };

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) return { ok: false, error: '삭제 실패: ' + error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '삭제 중 오류' };
  }
}
