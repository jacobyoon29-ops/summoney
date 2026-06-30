import { getAdminClient } from '@/lib/supabaseAdmin';
import { DEFAULT_SETTINGS, type Article, type Series, type SiteSettings } from '@/lib/supabase';
import HomeClient, { type HomeArticle, type HomeSeries } from './HomeClient';

export const dynamic = 'force-dynamic';

function toHomeArticle(a: Article, seriesMap: Map<string, Series>): HomeArticle {
  const series = a.series_id ? seriesMap.get(a.series_id) : undefined;
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
    seriesId: a.series_id,
    seriesName: series?.name ?? null,
    seriesSlug: series?.slug ?? null,
  };
}

async function getPublishedArticles(seriesMap: Map<string, Series>): Promise<HomeArticle[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error || !data) return [];
    return (data as Article[]).map((a) => toHomeArticle(a, seriesMap));
  } catch {
    return [];
  }
}

async function getAllSeries(): Promise<Series[]> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase.from('series').select('*').order('created_at', { ascending: false });
    return (data ?? []) as Series[];
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
  const [allSeries, siteSettings] = await Promise.all([getAllSeries(), getSiteSettings()]);
  const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
  const articles = await getPublishedArticles(seriesMap);

  const seriesList: HomeSeries[] = allSeries.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    coverImage: s.cover_image,
  }));

  return <HomeClient articles={articles} seriesList={seriesList} siteSettings={siteSettings} />;
}
