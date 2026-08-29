import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/admin/', '/admin', '/api/cron/'],
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Applebot',
          'GPTBot',
          'ClaudeBot',
          'PerplexityBot',
          'CCBot',
          'Google-Extended',
          'Bytespider',
          'cohere-ai',
          'OAI-SearchBot',
          'facebookexternalhit',
          'Twitterbot',
        ],
        allow: '/',
      },
    ],
    sitemap: 'https://griffo.work/sitemap.xml',
    host: 'https://griffo.work',
  }
}
