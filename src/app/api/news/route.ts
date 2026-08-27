import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/neon';
import { validateNewsMiddleware } from './middleware/validateNews';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { sanitizeInputMiddleware } from './middleware/sanitizeInput';
import { securityHeadersMiddleware } from './middleware/securityHeaders';
import { validateNewsFilter } from '@/lib/security/validators';

// Import services
import { scrapeService } from '@/lib/db/services/scrapeService';
import { neoService } from '@/lib/db/services/neoService';
import { cacheService } from '@/lib/db/cacheService';

/**
 * Apply middlewares in sequence
 */
async function applyMiddlewares(
  request: NextRequest,
  middlewares: Array<(req: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse>>
): Promise<NextResponse> {
  let index = 0;

  const next = async (): Promise<NextResponse> => {
    if (index >= middlewares.length) {
      // All middlewares processed, now handle the actual request
      return handleRequest(request);
    }

    const middleware = middlewares[index++];
    return middleware(request, next);
  };

  return next();
}

/**
 * Main request handler
 */
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const method = request.method;

  try {
    switch (method) {
      case 'GET':
        return await handleGetRequest(request, searchParams);
      case 'POST':
        return await handlePostRequest(request);
      case 'PUT':
        return await handlePutRequest(request);
      case 'DELETE':
        return await handleDeleteRequest(request);
      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests (list news, get single news, etc.)
 */
async function handleGetRequest(request: NextRequest, searchParams: URLSearchParams): Promise<NextResponse> {
  const path = request.nextUrl.pathname;

  // Check if it's a request for a specific news item
  const pathParts = path.split('/').filter(part => part.length > 0);
  if (pathParts.length > 0 && !isNaN(Number(pathParts[pathParts.length - 1])) ||
      pathParts.length > 1 && pathParts[pathParts.length - 1].match(/^[0-9a-f-]+$/)) {
    // This looks like an ID request
    return await getNewsById(request, pathParts[pathParts.length - 1]);
  }

  // Otherwise, it's a list request
  return await getNewsList(searchParams);
}

/**
 * Get paginated list of news with filtering
 */
async function getNewsList(searchParams: URLSearchParams): Promise<NextResponse> {
  try {
    // Validate and extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Validate filter parameters
    const filters = validateNewsFilter({
      source: source ? [source] : undefined,
      startDate,
      endDate,
      search
    });

    // Build where clause for Prisma
    const where: any = {};

    if (filters.source && filters.source.length > 0) {
      where.source = { in: filters.source };
    }

    if (filters.startDate || filters.endDate) {
      where.publishedAt = {};
      if (filters.startDate) {
        where.publishedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.publishedAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.news.count({ where });

    // Get paginated results
    const news = await prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        url: true,
        imageUrl: true,
        source: true,
        author: true,
        publishedAt: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

/**
 * Get a single news item by ID
 */
async function getNewsById(request: NextRequest, id: string): Promise<NextResponse> {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: 'Invalid news ID format' },
      { status: 400 }
    );
  }

  try {
    const news = await prisma.news.findUnique({
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

    if (!news) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests (create new news)
 */
async function handlePostRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // Use sanitized body if available from middleware
    // @ts-ignore
    const body = request.sanitizedBody || await request.json();

    // Validate the news data
    const validatedData = validateNewsData(body);

    // Check if news with this URL already exists
    const existingNews = await prisma.news.findUnique({
      where: { url: validatedData.url }
    });

    if (existingNews) {
      return NextResponse.json(
        { error: 'News with this URL already exists' },
        { status: 409 } // Conflict
      );
    }

    // Create new news item
    const news = await prisma.news.create({
      data: {
        title: validatedData.title,
        summary: validatedData.summary,
        content: validatedData.content,
        url: validatedData.url,
        imageUrl: validatedData.imageUrl,
        source: validatedData.source,
        author: validatedData.author,
        publishedAt: validatedData.publishedAt
      }
    });

    // Clear relevant cache
    await cacheService.invalidateNewsCache();

    return NextResponse.json(
      {
        message: 'News created successfully',
        news: {
          id: news.id,
          title: news.title,
          source: news.source,
          publishedAt: news.publishedAt
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json(
        { error: 'News with this URL already exists' },
        { status: 409 }
      );
    }

    console.error('Create news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle PUT requests (update existing news)
 */
async function handlePutRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname;
    const pathParts = path.split('/').filter(part => part.length > 0);
    const id = pathParts[pathParts.length - 1];

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid news ID format' },
        { status: 400 }
      );
    }

    // Use sanitized body if available
    // @ts-ignore
    const body = request.sanitizedBody || await request.json();

    // Validate the news data (partial update allowed)
    const newsSchema = require('@/lib/security/validators').newsSchema;
    const validatedData = newsSchema.partial().parse(body);

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id }
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      );
    }

    // If updating URL, check for conflicts
    if (validatedData.url && validatedData.url !== existingNews.url) {
      const urlConflict = await prisma.news.findUnique({
        where: { url: validatedData.url }
      });

      if (urlConflict) {
        return NextResponse.json(
          { error: 'Another news item with this URL already exists' },
          { status: 409 }
        );
      }
    }

    // Update news item
    const news = await prisma.news.update({
      where: { id },
      data: {
        title: validatedData.title,
        summary: validatedData.summary,
        content: validatedData.content,
        url: validatedData.url,
        imageUrl: validatedData.imageUrl,
        source: validatedData.source,
        author: validatedData.author,
        publishedAt: validatedData.publishedAt
      }
    });

    // Clear relevant cache
    await cacheService.invalidateNewsCache();

    return NextResponse.json({
      message: 'News updated successfully',
      news: {
        id: news.id,
        title: news.title,
        source: news.source,
        publishedAt: news.publishedAt
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') { // Prisma record not found error
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json(
        { error: 'Another news item with this URL already exists' },
        { status: 409 }
      );
    }

    console.error('Update news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle DELETE requests (delete news)
 */
async function handleDeleteRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname;
    const pathParts = path.split('/').filter(part => part.length > 0);
    const id = pathParts[pathParts.length - 1];

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid news ID format' },
        { status: 400 }
      );
    }

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id }
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      );
    }

    // Delete news item
    await prisma.news.delete({
      where: { id }
    });

    // Clear relevant cache
    await cacheService.invalidateNewsCache();

    return NextResponse.json({
      message: 'News deleted successfully'
    });
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma record not found error
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      );
    }

    console.error('Delete news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the handler with middlewares applied
export async function GET(request: NextRequest): Promise<NextResponse> {
  return applyMiddlewares(request, [
    securityHeadersMiddleware,
    rateLimitMiddleware,
    validateNewsMiddleware,
    sanitizeInputMiddleware
  ]);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return applyMiddlewares(request, [
    securityHeadersMiddleware,
    rateLimitMiddleware,
    validateNewsMiddleware,
    sanitizeInputMiddleware
  ]);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return applyMiddlewares(request, [
    securityHeadersMiddleware,
    rateLimitMiddleware,
    validateNewsMiddleware,
    sanitizeInputMiddleware
  ]);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return applyMiddlewares(request, [
    securityHeadersMiddleware,
    rateLimitMiddleware,
    validateNewsMiddleware,
    sanitizeInputMiddleware
  ]);
}

// For HEAD requests, we can reuse GET logic
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const response = await GET(request);
  // HEAD requests should not have a body
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers
  });
}