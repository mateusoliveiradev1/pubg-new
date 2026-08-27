import { useNewsById } from '@/hooks/useNews';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function NewsDetail({ params }: { params: { id: string } }) {
  const { data: news, isLoading, error } = useNewsById(params.id);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (error || !news) {
    notFound();
  }

  const { title, summary, content, url, imageUrl, source, author, publishedAt } = news;

  return (
    <article className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to News
          </Link>
        </div>

        {imageUrl && (
          <div className="mb-6">
            <img
              src={imageUrl}
              alt={title}
              className="rounded-lg w-full h-[300px] object-cover"
            />
          </div>
        )}

        <h1 className="mb-4 text-3xl font-bold text-foreground dark:text-background">
          {title}
        </h1>

        <div className="mb-6 flex items-center text-sm text-muted-foreground">
          <span className="mr-4">{source}</span>
          {author && (
            <span className="mx-4">•</span>
            <span>{author}</span>
          )}
          <span className="mx-4">•</span>
          <span className="whitespace-nowrap">
            {new Date(publishedAt).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          }
        </div>

        {summary && (
          <p className="mb-6 text-lg text-muted-foreground">{summary}</p>
        )}

        {content && (
          <div className="prose prose-lg max-w-none text-foreground dark:text-background">
            {!Array.isArray(content) && typeof content === 'string' && content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6">{paragraph}</p>
            ))}
          </div>
        )}

        {url && (
          <div className="mt-8">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
            >
              Read original article
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
