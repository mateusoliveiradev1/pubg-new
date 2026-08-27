import NewsFeed from '@/components/news/NewsFeed';
import { NewsCardSkeleton } from '@/components/news/NewsCardSkeleton';

export default function Home() {
  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-6">
          PUBG News Portal
        </h1>
        <NewsFeed />
      </div>
    </main>
  );
}
