import { CityPage, cityPageMetadata } from '@/components/city-jobs/city-page'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ country: string; city: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { country, city } = await params
  return cityPageMetadata(country, city)
}

export default async function Page({ params }: PageProps) {
  const { country, city } = await params
  return <CityPage country={country} city={city} />
}
