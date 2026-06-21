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
export const CATEGORIES = ['다른나라 줍줍줍', '경제 줍줍줍', '사람 줍줍줍'] as const;
export type Category = (typeof CATEGORIES)[number];

// 커버 이미지를 올리는 Storage 버킷 이름
export const COVER_BUCKET = 'covers';

// site_settings 테이블의 한 행 (id = 1 고정)
export type SiteSettings = {
  id: number;
  site_name: string;
  owner_name: string;
  business_number: string;
  company_name: string;
  customer_service: string;
  address: string;
  copyright: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: '줍줍줍',
  owner_name: '윤덕주',
  business_number: '126-95-41371',
  company_name: '개인의 서사',
  customer_service: '',
  address: '경기도 부천시 원미구 부천로198번길 18, 202동 10층 (춘의동, 춘의테크노파크II)',
  copyright: 'Copyright © 줍줍줍 All Rights Reserved',
};

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
  is_featured: boolean;
  created_at: string;
};
