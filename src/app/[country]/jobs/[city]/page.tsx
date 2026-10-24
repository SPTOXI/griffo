import { CityPage, cityPageMetadata, type SearchParams } from '@/components/city-jobs/city-page'

export const revalidate = 3600

interface PageProps {
  searchParams: SearchParams
  params: Promise<{ country: string; city: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { country, city } = await params
  return cityPageMetadata(country, city, undefined, searchParams)
}

export default async function Page({ params, searchParams }: PageProps) {
  const { country, city } = await params
  return <CityPage country={country} city={city} searchParams={searchParams} />
}
