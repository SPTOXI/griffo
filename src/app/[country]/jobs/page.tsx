import { HubPage, hubMetadata } from '@/components/city-jobs/city-page'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { country } = await params
  return hubMetadata(country)
}

export default async function Page({ params }: PageProps) {
  const { country } = await params
  return <HubPage country={country} />
}
