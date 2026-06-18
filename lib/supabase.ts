import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 빌드 타임에 throw하지 않고 런타임에서만 검증 (Vercel 빌드 호환)
let _supabase: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수를 설정하세요.');
  _supabase = createClient(url, key);
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// 글에 사용하는 카테고리 (홈페이지와 동일하게 유지)
export const CATEGORIES = ['비즈니스', '트렌드', 'ESG', '재테크', '브랜드'] as const;
export type Category = (typeof CATEGORIES)[number];

// 커버 이미지를 올리는 Storage 버킷 이름
export const COVER_BUCKET = 'covers';

// articles 테이블의 한 행
export type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  category: string;
  is_published: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  tags: string[] | null;
  related_ids: string[] | null;
  view_count: number;
  star_count: number;
  created_at: string;
};
