import type { MetadataRoute } from 'next'

// Um grupo por user-agent SUBSTITUI o grupo `*` (não se soma a ele). Antes, os
// bots nomeados abaixo só tinham `allow: '/'` e por isso podiam rastrear
// `/admin` e `/api/cron/` — que o grupo `*` proibia só para os demais.
const DISALLOW = ['/api/admin/', '/admin', '/api/cron/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
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
        disallow: DISALLOW,
      },
    ],
    sitemap: 'https://griffo.work/sitemap.xml',
    host: 'https://griffo.work',
  }
}
