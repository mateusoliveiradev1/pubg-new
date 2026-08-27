import Link from 'next/link';
import Image from 'next/image';
import { formatRelative, parseISO } from 'date-fns';

interface NewsCardProps {
  article: {
    id: string;
    title: string;
    summary?: string;
    url: string;
    imageUrl?: string;
    source: string;
    author?: string;
    publishedAt: string; // ISO string
  };
}

export default function NewsCard({ article }: NewsCardProps) {
  const { title, summary, url, imageUrl, source, author, publishedAt } = article;

  // Format the date to be relative (e.g., "2 hours ago") or absolute if older than a week
  const date = parseISO(publishedAt);
  const dateDisplay = formatRelative(date, new Date());

  return (
    <Link href={`/news/${article.id}`} passHref className="block hover:shadow-lg transition-shadow duration-300">
      <a className="group">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              className="object-cover h-48"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMzMzMiLz48L3N2Zz4="
              priority
            />
          ) : null}
          <div className="p-4">
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <span className="mr-2">{source}</span>
              {author && (
                <span className="mx-2">•</span>
                <span>{author}</span>
              )}
              <span className="mx-2">•</span>
              <span className="whitespace-nowrap">{dateDisplay}</span>
            </div>
            <h3 className="mb-2 line-clamp-2 font-semibold text-foreground dark:text-background">{title}</h3>
            {summary && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{summary}</p>
            )}
          </div>
        </div>
      </Link>
    );
}
