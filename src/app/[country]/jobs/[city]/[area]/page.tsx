import { CityPage, cityPageMetadata } from '@/components/city-jobs/city-page'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ country: string; city: string; area: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { country, city, area } = await params
  return cityPageMetadata(country, city, area)
}

export default async function Page({ params }: PageProps) {
  const { country, city, area } = await params
  return <CityPage country={country} city={city} area={area} />
}
