import { PrismaClient, News, NewsCache } from '@prisma/client';
import { NewsInput } from '@/lib/security/validators';

/**
 * Service for database operations with Neon PostgreSQL via Prisma
 */
export class NeoService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get all news with pagination and filtering
   */
  async getNews(options: {
    page?: number;
    limit?: number;
    sources?: string[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
  } = {}): Promise<{ news: News[]; total: number; page: number; limit: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      sources = [],
      startDate,
      endDate,
      search
    } = options;

    // Build where clause
    const where: any = {};

    if (sources.length > 0) {
      where.source = { in: sources };
    }

    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) {
        where.publishedAt.gte = startDate;
      }
      if (endDate) {
        where.publishedAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await this.prisma.news.count({ where });

    // Get paginated results
    const news = await this.prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        url: true,
        imageUrl: true,
        source: true,
        author: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      news,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get a single news item by ID
   */
  async getNewsById(id: string): Promise<News | null> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return null;
    }

    return await this.prisma.news.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        url: true,
        imageUrl: true,
        source: true,
        author: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Create a new news item
   */
  async createNews(data: NewsInput): Promise<News> {
    // Check if news with this URL already exists
    const existing = await this.prisma.news.findUnique({
      where: { url: data.url }
    });

    if (existing) {
      throw new Error('News with this URL already exists');
    }

    return await this.prisma.news.create({
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        url: data.url,
        imageUrl: data.imageUrl,
        source: data.source,
        author: data.author,
        publishedAt: data.publishedAt
      }
    });
  }

  /**
   * Update an existing news item
   */
  async updateNews(id: string, data: Partial<NewsInput>): Promise<News> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid news ID format');
    }

    // Check if news exists
    const existing = await this.prisma.news.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new Error('News not found');
    }

    // If updating URL, check for conflicts
    if (data.url && data.url !== existing.url) {
      const urlConflict = await this.prisma.news.findUnique({
        where: { url: data.url }
      });

      if (urlConflict) {
        throw new Error('Another news item with this URL already exists');
      }
    }

    return await this.prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        url: data.url,
        imageUrl: data.imageUrl,
        source: data.source,
        author: data.author,
        publishedAt: data.publishedAt
      }
    });
  }

  /**
   * Delete a news item by ID
   */
  async deleteNews(id: string): Promise<void> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid news ID format');
    }

    // Check if news exists
    const existing = await this.prisma.news.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new Error('News not found');
    }

    await this.prisma.news.delete({
      where: { id }
    });
  }

  /**
   * Get news count
   */
  async getNewsCount(): Promise<number> {
    return await this.prisma.news.count();
  }

  /**
   * Get recent news (last N hours)
   */
  async getRecentNews(hours: number = 24): Promise<News[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.prisma.news.findMany({
      where: {
        publishedAt: {
          gte: since
        }
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        url: true,
        imageUrl: true,
        source: true,
        author: true,
        publishedAt: true,
        createdAt: true
      }
    });
  }

  /**
   * Cache operations
   */
  async setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.prisma.newsCache.upsert({
      where: { key },
      update: {
        value,
        expiresAt
      },
      create: {
        key,
        value,
        expiresAt
      }
    });
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cacheEntry = await this.prisma.newsCache.findUnique({
      where: { key }
    });

    if (!cacheEntry) {
      return null;
    }

    // Check if expired
    if (cacheEntry.expiresAt < new Date()) {
      // Delete expired entry
      await this.prisma.newsCache.delete({
        where: { key }
      });
      return null;
    }

    return cacheEntry.value as T;
  }

  async deleteCache(key: string): Promise<void> {
    await this.prisma.newsCache.delete({
      where: { key }
    }).catch(() => {
      // Ignore if key doesn't exist
    });
  }

  async invalidateNewsCache(): Promise<void> {
    // Delete all cache entries related to news
    await this.prisma.newsCache.deleteMany({
      where: {
        key: {
          contains: 'news'
        }
      }
    });
  }
}

// Export a singleton instance using the global prisma client
import { prisma } from '@/lib/db/neon';
export const neoService = new NeoService(prisma);
