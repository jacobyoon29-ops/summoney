import { getAdminClient } from '@/lib/supabaseAdmin';
import { DEFAULT_SETTINGS, type Article, type SiteSettings } from '@/lib/supabase';
import HomeClient, { type HomeArticle } from './HomeClient';

export const dynamic = 'force-dynamic';

function toHomeArticle(a: Article): HomeArticle {
  return {
    id: a.id,
    category: a.category,
    title: a.title,
    summary: a.summary ?? '',
    date: (a.published_at ?? a.created_at).slice(0, 10).replace(/-/g, '.'),
    coverImage: a.cover_image,
    slug: a.slug,
    isFeatured: a.is_featured ?? false,
    viewCount: a.view_count,
    createdAt: a.created_at,
  };
}

async function getPublishedArticles(): Promise<HomeArticle[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error || !data) return [];
    return (data as Article[]).map(toHomeArticle);
  } catch {
    return [];
  }
}

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    return (data as SiteSettings) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default async function Home() {
  const [articles, siteSettings] = await Promise.all([
    getPublishedArticles(),
    getSiteSettings(),
  ]);
  return <HomeClient articles={articles} siteSettings={siteSettings} />;
}
