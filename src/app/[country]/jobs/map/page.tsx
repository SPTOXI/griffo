import { MapPage, mapMetadata } from '@/components/city-jobs/map-page'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { country } = await params
  return mapMetadata(country)
}

export default async function Page({ params }: PageProps) {
  const { country } = await params
  return <MapPage country={country} />
}
