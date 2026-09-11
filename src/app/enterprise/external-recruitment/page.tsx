import type { Metadata } from 'next'
import {
  generatePillarMetadata,
  resolvePillarView,
  PillarView,
  type PillarPageProps,
} from '../_pillar-page'

const CANONICAL = 'https://griffo.work/enterprise/external-recruitment'

export async function generateMetadata({ searchParams }: PillarPageProps): Promise<Metadata> {
  return generatePillarMetadata(searchParams, 'externalRecruitment', CANONICAL)
}

export default async function ExternalRecruitmentPage({ searchParams }: PillarPageProps) {
  const { dir, content, cta, breadcrumbJsonLd } = await resolvePillarView(
    searchParams,
    'externalRecruitment',
    CANONICAL
  )
  return <PillarView dir={dir} content={content} cta={cta} breadcrumbJsonLd={breadcrumbJsonLd} />
}
