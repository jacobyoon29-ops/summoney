'use server';

import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, COVER_BUCKET, DEFAULT_SETTINGS, type Article, type SiteSettings } from '@/lib/supabase';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { isAuthed } from './auth';

// 발행 시 기존 글 목록과 비교해 관련 글 ID 3개를 선택한다.
// AI 호출 실패 시 빈 배열을 반환해 발행 자체를 막지 않는다.
async function pickRelatedIds(
  supabase: ReturnType<typeof getAdminClient>,
  currentId: string | null,
  title: string,
  content: string
): Promise<string[]> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return [];

    // 발행된 글 목록 (현재 글 제외, 최대 50개)
    let query = supabase
      .from('articles')
      .select('id, title, summary, category')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(50);
    if (currentId) query = query.neq('id', currentId);
    const { data: candidates } = await query;
    if (!candidates || candidates.length === 0) return [];

    const list = candidates
      .map((a, i) => `[${i}] id=${a.id} | ${a.category} | ${a.title}${a.summary ? ' — ' + a.summary : ''}`)
      .join('\n');

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [{
        role: 'user',
        content: `줍줍줍(다른나라/경제/사람 줍줍줍 미디어)의 편집자입니다.
아래 [현재 글]과 가장 관련성 높은 글 3개를 [후보 목록]에서 골라 id만 JSON 배열로 반환하세요.
관련성 기준: 동일 주제, 연관 키워드, 독자가 이어서 읽을 만한 흐름.
후보가 3개 미만이면 있는 것만 반환. JSON 외 텍스트 금지.

[현재 글]
제목: ${title}
본문(앞 500자): ${content.slice(0, 500)}

[후보 목록]
${list}

JSON: {"ids":["uuid1","uuid2","uuid3"]}`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed.ids) ? parsed.ids.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** 조회수 +1 (인증 불필요) */
export async function incrementView(id: string): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.rpc('increment_view', { row_id: id });
  } catch { /* 무시 */ }
}

/** 별(좋아요) +1 (인증 불필요) */
export async function incrementStar(id: string): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.rpc('increment_star', { row_id: id });
  } catch { /* 무시 */ }
}

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
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const isPublished = formData.get('is_published') === 'true';
  const scheduledAtRaw = String(formData.get('scheduled_at') ?? '').trim();
  const cover = formData.get('cover');

  const invalid = validate(title, content, category);
  if (invalid) return { ok: false, error: invalid };

  let coverImage: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    const up = await uploadCover(supabase, cover);
    if (!up.ok) return up;
    coverImage = up.url;
  }

  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : null;
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null;
  const finalPublished = scheduledAt ? false : isPublished;
  const slug = slugRaw ? `${slugRaw}-${Date.now().toString(36)}` : makeSlug(title);

  const relatedIds = finalPublished
    ? await pickRelatedIds(supabase, null, title, content)
    : null;

  const { error } = await supabase.from('articles').insert({
    title,
    content,
    category,
    summary: summaryRaw || null,
    slug,
    cover_image: coverImage,
    is_published: finalPublished,
    published_at: finalPublished ? new Date().toISOString() : null,
    scheduled_at: scheduledAt,
    tags,
    related_ids: relatedIds?.length ? relatedIds : null,
    view_count: 0,
    star_count: 0,
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
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const isPublished = formData.get('is_published') === 'true';
  const scheduledAtRaw = String(formData.get('scheduled_at') ?? '').trim();
  const removeCover = formData.get('remove_cover') === 'true';
  const viewCountRaw = formData.get('view_count');
  const starCountRaw = formData.get('star_count');
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

  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : null;
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null;
  const finalPublished = scheduledAt ? false : isPublished;

  let publishedAt: string | null = null;
  if (finalPublished) {
    publishedAt = current?.is_published && current?.published_at
      ? current.published_at
      : new Date().toISOString();
  }

  // 발행할 때만 관련 글 추천 갱신 (임시저장·예약 시에는 건드리지 않음)
  const relatedIds = finalPublished
    ? await pickRelatedIds(supabase, id, title, content)
    : undefined;

  const { error } = await supabase
    .from('articles')
    .update({
      title,
      content,
      category,
      summary: summaryRaw || null,
      cover_image: coverImage,
      is_published: finalPublished,
      published_at: publishedAt,
      scheduled_at: scheduledAt,
      tags,
      ...(relatedIds !== undefined
        ? { related_ids: relatedIds.length ? relatedIds : null }
        : {}),
      ...(viewCountRaw !== null ? { view_count: Math.max(0, parseInt(String(viewCountRaw), 10) || 0) } : {}),
      ...(starCountRaw !== null ? { star_count: Math.max(0, parseInt(String(starCountRaw), 10) || 0) } : {}),
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

/** 사이트 설정 조회 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    return (data as SiteSettings) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** 사이트 설정 저장 */
export async function saveSiteSettings(formData: FormData): Promise<ActionResult> {
  if (!(await isAuthed())) return { ok: false, error: '로그인이 필요합니다.' };
  const settings = {
    id: 1,
    site_name: String(formData.get('site_name') ?? '').trim(),
    owner_name: String(formData.get('owner_name') ?? '').trim(),
    business_number: String(formData.get('business_number') ?? '').trim(),
    company_name: String(formData.get('company_name') ?? '').trim(),
    customer_service: String(formData.get('customer_service') ?? '').trim(),
    address: String(formData.get('address') ?? '').trim(),
    copyright: String(formData.get('copyright') ?? '').trim(),
  };
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'id' });
    if (error) return { ok: false, error: '저장 실패: ' + error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '저장 중 오류' };
  }
}

/** is_featured 토글 */
export async function toggleFeatured(id: string, current: boolean): Promise<ActionResult> {
  if (!(await isAuthed())) return { ok: false, error: '로그인이 필요합니다.' };
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('articles')
      .update({ is_featured: !current })
      .eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '오류' };
  }
}
