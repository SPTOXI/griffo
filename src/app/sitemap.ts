import type { MetadataRoute } from 'next'
import { ATS_DATABASE } from '@/lib/ats/data'

const COUNTRIES = [
  'br', 'us', 'pt', 'es', 'mx', 'gb', 'ca', 'de', 'at', 'fr', 'be', 'lu',
  'it', 'au', 'nz', 'in', 'jp', 'global',
  'pl', 'cz', 'cl', 'my', 'tr', 'za', 'ae', 'co', 'ar', 'th', 'ro', 'bg',
  'id', 'ph', 'vn', 'ng', 'eg', 'pk', 'bd', 'ke', 'sg', 'nl', 'ie'
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://griffo.work'
  const lastModified = new Date()

  // 1. Root page
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          'pt-BR': `${baseUrl}/br`,
          'en-US': `${baseUrl}/us`,
          'pt-PT': `${baseUrl}/pt`,
          'es-ES': `${baseUrl}/es`,
          'es-MX': `${baseUrl}/mx`,
          'en-GB': `${baseUrl}/gb`,
          'de-DE': `${baseUrl}/de`,
          'fr-FR': `${baseUrl}/fr`,
          'it-IT': `${baseUrl}/it`,
          'ja-JP': `${baseUrl}/jp`,
          'nl-NL': `${baseUrl}/nl`,
          'sv-SE': `${baseUrl}/se`,
          'zh-CN': `${baseUrl}/cn`,
          'ar-AE': `${baseUrl}/ae`,
          'ko-KR': `${baseUrl}/kr`,
        },
      },
    },
  ]

  // 2. Country / Market specific pages
  for (const country of COUNTRIES) {
    routes.push({
      url: `${baseUrl}/${country}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: country === 'br' || country === 'us' || country === 'pt' || country === 'es' || country === 'mx' || country === 'de' || country === 'fr' || country === 'it' || country === 'jp' ? 0.9 : 0.8,
    })
  }

  // 3. ATS Systems & High-intent compatibility pages
  for (const slug of Object.keys(ATS_DATABASE)) {
    routes.push({
      url: `${baseUrl}/ats/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }

  return routes
}
