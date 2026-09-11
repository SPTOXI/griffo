import type { Metadata } from 'next'
import {
  generatePillarMetadata,
  resolvePillarView,
  PillarView,
  type PillarPageProps,
} from '../_pillar-page'

const CANONICAL = 'https://griffo.work/enterprise/internal-mobility'

export async function generateMetadata({ searchParams }: PillarPageProps): Promise<Metadata> {
  return generatePillarMetadata(searchParams, 'internalMobility', CANONICAL)
}

export default async function InternalMobilityPage({ searchParams }: PillarPageProps) {
  const { dir, content, cta, breadcrumbJsonLd } = await resolvePillarView(
    searchParams,
    'internalMobility',
    CANONICAL
  )
  return <PillarView dir={dir} content={content} cta={cta} breadcrumbJsonLd={breadcrumbJsonLd} />
}
