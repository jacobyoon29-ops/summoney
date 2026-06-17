import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 없습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  created_at: string;
};
