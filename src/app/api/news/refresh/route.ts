import { NextRequest, NextResponse } from 'next/server';
import { scrapeService } from '@/lib/db/services/scrapeService';
import { neoService } from '@/lib/db/services/neoService';
import { cacheService } from '@/lib/db/services/cacheService';

const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.warn('CRON_SECRET is not set. The refresh endpoint is not protected.');
}

/**
 * GET handler for triggering news refresh via cron job.
 * Expects a header `x-cron-secret` or query parameter `secret` matching CRON_SECRET.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check for secret in header or query
  const secretHeader = request.headers.get('x-cron-secret');
  const { searchParams } = new URL(request.url);
  const secretQuery = searchParams.get('secret');

  const providedSecret = secretHeader || secretQuery;

  // If CRON_SECRET is set, require a matching secret
  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Scrape news from all sources
    const scrapedNews = await scrapeService.scrapeAllSources();

    if (scrapedNews.length === 0) {
      return NextResponse.json(
        { message: 'No news scraped', count: 0 },
        { status: 200 }
      );
    }

    // Save each news item to the database (avoiding duplicates by URL)
    let savedCount = 0;
    for (const news of scrapedNews) {
      try {
        // Check if news with this URL already exists
        const existing = await neoService.prisma.news.findUnique({
          where: { url: news.url }
        });

        if (!existing) {
          await neoService.createNews(news);
          savedCount++;
        }
        // If exists, we skip (or could update if we wanted to, but for now we skip)
      } catch (error: any) {
        console.error(`Failed to save news "${news.title}":`, error);
        // Continue with other news items
      }
    }

    // Clear the cache to reflect new data
    cacheService.invalidate('news-list');

    return NextResponse.json(
      { 
        message: `News refresh completed`, 
        scraped: scrapedNews.length,
        saved: savedCount
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('News refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
