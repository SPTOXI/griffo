import { CityPage, cityPageMetadata } from '@/components/vagas/city-page'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ cidade: string; area: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { cidade, area } = await params
  return cityPageMetadata(cidade, area)
}

export default async function Page({ params }: PageProps) {
  const { cidade, area } = await params
  return <CityPage cidade={cidade} area={area} />
}
