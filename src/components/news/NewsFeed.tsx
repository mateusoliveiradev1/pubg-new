import { useNews } from '@/hooks/useNews';
import NewsCard from '@/components/news/NewsCard';
import NewsCardSkeleton from '@/components/news/NewsCardSkeleton';
import { Shimmer } from 'react-shimmer'; // We'll install react-shimmer or use a simple skeleton

// Since we don't want to add another dependency for skeleton, let's create a simple one.
// Alternatively, we can use a placeholder. For now, we'll create a simple skeleton.

export default function NewsFeed() {
  const { data: news, isLoading, error } = useNews();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">Failed to load news.</div>;
  }

  if (!news || news.length === 0) {
    return <div className="text-center text-gray-500 py-10">No news available.</div>;
  }

  return (
    <div className="space-y-6">
      {news.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
