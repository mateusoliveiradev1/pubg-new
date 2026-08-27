import { z } from 'zod';

/**
 * News validation schema using Zod
 * Ensures all incoming data conforms to expected structure and constraints
 */
export const newsSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  
  summary: z.string()
    .max(500, 'Summary must not exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
  
  content: z.string()
    .max(10000, 'Content must not exceed 10000 characters')
    .trim()
    .optional()
    .nullable(),
  
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL must not exceed 2048 characters'),
  
  imageUrl: z.string()
    .url('Invalid image URL format')
    .max(2048, 'Image URL must not exceed 2048 characters')
    .optional()
    .nullable(),
  
  source: z.enum([
    'PUBG Official',
    'Twitter/X',
    'Facebook',
    'IGN',
    'GameSpot',
    'PC Gamer',
    'Kotaku',
    'Polygon',
    'NewsAPI',
    'Reddit',
    'YouTube'
  ], 'Invalid news source'),
  
  author: z.string()
    .max(100, 'Author name must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  publishedAt: z.string()
    .refine((val) => !isNaN(Date.parse(val)), { 
      message: 'Invalid date format' 
    })
    .transform((val) => new Date(val)),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.number()
    .int()
    .positive()
    .default(1),
  
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(10),
});

/**
 * News filter validation schema
 */
export const newsFilterSchema = z.object({
  source: z.array(z.enum([
    'PUBG Official',
    'Twitter/X',
    'Facebook',
    'IGN',
    'GameSpot',
    'PC Gamer',
    'Kotaku',
    'Polygon',
    'NewsAPI',
    'Reddit',
    'YouTube'
  ])).optional(),
  
  startDate: z.string()
    .refine((val) => !isNaN(Date.parse(val)), { 
      message: 'Invalid start date format' 
    })
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
  
  endDate: z.string()
    .refine((val) => !isNaN(Date.parse(val)), { 
      message: 'Invalid end date format' 
    })
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
  
  search: z.string()
    .max(100, 'Search term must not exceed 100 characters')
    .trim()
    .optional(),
});

/**
 * Sanitize input to prevent XSS attacks
 * Basic HTML escaping for strings
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize news data
 * Returns validated data or throws Zod error
 */
export function validateNewsData(data: unknown) {
  return newsSchema.parse(data);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(data: unknown) {
  return paginationSchema.parse(data);
}

/**
 * Validate news filter parameters
 */
export function validateNewsFilter(data: unknown) {
  return newsFilterSchema.parse(data);
}

/**
 * Validate URL safety (basic checks)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!parsed.protocol.startsWith('http')) {
      return false;
    }
    
    // Block localhost and private IPs in production (optional)
    // if (process.env.NODE_ENV === 'production') {
    //   const hostname = parsed.hostname.toLowerCase();
    //   if (hostname === 'localhost' || 
    //       hostname === '127.0.0.1' ||
    //       hostname.startsWith('192.168.') ||
    //       hostname.startsWith('10.') ||
    //       hostname.startsWith('172.16.')) {
    //     return false;
    //   }
    // }
    
    return true;
  } catch {
    return false;
  }
}

export type NewsInput = z.infer<typeof newsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type NewsFilterInput = z.infer<typeof newsFilterSchema>;
