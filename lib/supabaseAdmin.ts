import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * service_role 키로 동작하는 서버 전용 Supabase 클라이언트.
 * 이 키는 NEXT_PUBLIC_ 접두사가 없어 브라우저로 노출되지 않으며, RLS 를 우회한다.
 * 반드시 서버(서버 컴포넌트 / 서버 액션)에서만 사용할 것.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. .env.local 을 확인하고 dev 서버를 재시작하세요.'
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
