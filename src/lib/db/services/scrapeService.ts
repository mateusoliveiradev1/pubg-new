import axios from 'axios';
import cheerio from 'cheerio';
import { NewsInput } from '@/lib/security/validators';

/**
 * Service for scraping news from various sources
 * Implements rate limiting, error handling, and data validation
 */
export class ScrapeService {
  private readonly requestDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  /**
   * Delay function to respect rate limits
   */
  private async delay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch and parse HTML from a URL
   */
  private async fetchHtml(url: string): Promise<string> {
    await this.delay();

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 seconds timeout
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  /**
   * Scrape news from the official PUBG website
   */
  async scrapePubgOfficial(): Promise<NewsInput[]> {
    try {
      const html = await this.fetchHtml('https://pubg.com/en-us/news/');
      const $ = cheerio.load(html);
      const newsItems: NewsInput[] = [];

      // Adjust selector based on actual PUBG website structure
      $('.news-item, .article, .post').each((index, element) => {
        const title = $(element).find('h2, h3, .title').first().text().trim();
        const summary = $(element).find('.summary, .excerpt, p').first().text().trim();
        const url = $(element).find('a').first().attr('href') || '';
        const imageUrl = $(element).find('img').first().attr('src') || '';
        const dateText = $(element).find('.date, .time, time').first().attr('datetime') ||
                         $(element).find('.date, .time').first().text().trim();

        // Make URL absolute if needed
        const absoluteUrl = url.startsWith('http') ? url : new URL(url, 'https://pubg.com').toString();
        const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, 'https://pubg.com').toString();

        if (title && absoluteUrl) {
          newsItems.push({
            title,
            summary: summary || undefined,
            content: undefined, // We'll fetch content separately if needed
            url: absoluteUrl,
            imageUrl: absoluteImageUrl || undefined,
            source: 'PUBG Official',
            author: undefined,
            publishedAt: dateText ? new Date(dateText) : new Date()
          });
        }
      });

      return newsItems;
    } catch (error) {
      console.error('Error scraping PUBG Official:', error);
      return []; // Return empty array on failure
    }
  }

  /**
   * Scrape news from a gaming site (example: IGN)
   * This is a generic scraper that would need to be adapted per site
   */
  async scrapeGamingSite(siteUrl: string, siteName: string): Promise<NewsInput[]> {
    try {
      const html = await this.fetchHtml(siteUrl);
      const $ = cheerio.load(html);
      const newsItems: NewsInput[] = [];

      // Generic selector - would need to be customized per site
      $('.article, .post, .news-item, .card').each((index, element) => {
        const title = $(element).find('h1, h2, h3, .title, .headline').first().text().trim();
        const summary = $(element).find('.summary, .excerpt, .description, p').first().text().trim();
        const url = $(element).find('a').first().attr('href') || '';
        const imageUrl = $(element).find('img').first().attr('src') || '';
        const dateText = $(element).find('time, .date, .timestamp').first().attr('datetime') ||
                         $(element).find('time, .date, .timestamp').first().text().trim();

        // Make URL absolute if needed
        const absoluteUrl = url.startsWith('http') ? url : new URL(url, siteUrl).toString();
        const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, siteUrl).toString();

        if (title && absoluteUrl) {
          newsItems.push({
            title,
            summary: summary || undefined,
            content: undefined,
            url: absoluteUrl,
            imageUrl: absoluteImageUrl || undefined,
            source: siteName,
            author: undefined,
            publishedAt: dateText ? new Date(dateText) : new Date()
          });
        }
      });

      return newsItems;
    } catch (error) {
      console.error(`Error scraping ${siteName}:`, error);
      return [];
    }
  }

  /**
   * Scrape news from NewsAPI.org (as a fallback)
   * Requires API key in environment variables
   */
  async scrapeNewsApi(query: string = 'PUBG Battlegrounds'): Promise<NewsInput[]> {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      console.warn('NewsAPI key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: apiKey
        },
        timeout: 10000
      });

      const articles = response.data.articles || [];
      const newsItems: NewsInput[] = [];

      for (const article of articles) {
        if (!article.title || !article.url) continue;

        newsItems.push({
          title: article.title,
          summary: article.description || undefined,
          content: article.content || undefined,
          url: article.url,
          imageUrl: article.urlToImage || undefined,
          source: article.source?.name || 'NewsAPI',
          author: article.author || undefined,
          publishedAt: new Date(article.publishedAt)
        });
      }

      return newsItems;
    } catch (error: any) {
      console.error('Error scraping NewsAPI:', error.message);
      return [];
    }
  }

  /**
   * Main function to scrape news from all configured sources
   * Returns deduplicated and validated news items
   */
  async scrapeAllSources(): Promise<NewsInput[]> {
    const allNews: NewsInput[] = [];

    // Scrape from official PUBG site
    const pubgNews = await this.scrapePubgOfficial();
    allNews.push(...pubgNews);

    // Scrape from gaming sites (example sites - would need real URLs and selectors)
    const gamingSites = [
      { url: 'https://www.ign.com/games/pubg', name: 'IGN' },
      { url: 'https://www.gamespot.com/pubg/', name: 'GameSpot' },
      { url: 'https://www.pcgamer.com/pubg/', name: 'PC Gamer' }
    ];

    for (const site of gamingSites) {
      const siteNews = await this.scrapeGamingSite(site.url, site.name);
      allNews.push(...siteNews);
    }

    // Scrape from NewsAPI as fallback
    const newsApiNews = await this.scrapeNewsApi();
    allNews.push(...newsApiNews);

    // Deduplicate by URL (case insensitive and normalized)
    const uniqueNewsMap = new Map<string, NewsInput>();
    for (const news of allNews) {
      const normalizedUrl = news.url.toLowerCase().trim();
      if (!uniqueNewsMap.has(normalizedUrl)) {
        uniqueNewsMap.set(normalizedUrl, news);
      }
    }

    const deduplicatedNews = Array.from(uniqueNewsMap.values());

    // Validate each news item through our schema
    const validatedNews: NewsInput[] = [];
    for (const news of deduplicatedNews) {
      try {
        const validated = require('@/lib/security/validators').newsSchema.parse(news);
        validatedNews.push(validated);
      } catch (error) {
        // Skip invalid news items but log for debugging
        console.warn('Invalid news item skipped:', news.title, error.message);
      }
    }

    return validatedNews;
  }
}

// Export a singleton instance
export const scrapeService = new ScrapeService();