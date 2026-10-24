import { CityPage, cityPageMetadata } from '@/components/vagas/city-page'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ cidade: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { cidade } = await params
  return cityPageMetadata(cidade)
}

export default async function Page({ params }: PageProps) {
  const { cidade } = await params
  return <CityPage cidade={cidade} />
}
