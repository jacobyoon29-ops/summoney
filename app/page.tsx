import { getAdminClient } from '@/lib/supabaseAdmin';
import { DEFAULT_SETTINGS, type Article, type SiteSettings } from '@/lib/supabase';
import HomeClient, { type HomeArticle } from './HomeClient';

// 발행 직후 바로 반영되도록 매 요청마다 최신 데이터를 읽는다.
export const dynamic = 'force-dynamic';

// 아직 발행된 글이 없을 때 보여줄 예시 글 (디자인이 비어 보이지 않도록)
const SAMPLE_ARTICLES: HomeArticle[] = [
  { category: '비즈니스', title: '다이소가 1000원짜리로 1조를 버는 방법', summary: '가격이 아니라 구조가 다르다. 다이소 비즈니스 모델의 핵심을 파헤친다.', date: '2025.06.01', coverImage: null, slug: '' },
  { category: '트렌드', title: '올리브영이 드럭스토어를 넘어선 이유', summary: 'H&B 스토어의 진화, 올리브영이 만든 새로운 카테고리의 정체.', date: '2025.05.28', coverImage: null, slug: '' },
  { category: 'ESG', title: 'ESG가 돈이 되는 진짜 이유', summary: '규제 대응이 아니다. ESG를 수익 모델로 바꾼 기업들의 전략.', date: '2025.05.20', coverImage: null, slug: '' },
  { category: '재테크', title: '월급쟁이가 ETF로 돈 모으는 법', summary: '복잡한 주식 분석 없이, 직장인이 실천할 수 있는 ETF 전략.', date: '2025.05.15', coverImage: null, slug: '' },
  { category: '브랜드', title: '무신사는 어떻게 패션 플랫폼 1위가 됐나', summary: '커뮤니티에서 커머스로. 무신사의 성장 공식을 분석한다.', date: '2025.05.10', coverImage: null, slug: '' },
  { category: '비즈니스', title: '배달의민족이 수수료를 올릴 수밖에 없는 이유', summary: '플랫폼 경제의 딜레마. 성장과 수익 사이에서 배민이 선택한 것.', date: '2025.05.05', coverImage: null, slug: '' },
];

function toHomeArticle(a: Article): HomeArticle {
  return {
    category: a.category,
    title: a.title,
    summary: a.summary ?? '',
    date: (a.published_at ?? a.created_at).slice(0, 10).replace(/-/g, '.'),
    coverImage: a.cover_image,
    slug: a.slug,
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
  const [published, siteSettings] = await Promise.all([
    getPublishedArticles(),
    getSiteSettings(),
  ]);
  const articles = published.length > 0 ? published : SAMPLE_ARTICLES;
  return <HomeClient articles={articles} siteSettings={siteSettings} />;
}
