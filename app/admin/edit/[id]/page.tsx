import { notFound } from 'next/navigation';
import { getArticle } from '../../actions';
import ArticleForm from '../../ArticleForm';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  return <ArticleForm initial={article} />;
}
