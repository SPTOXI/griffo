import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function getAdminUser() {
  const user = await getCurrentUser()
  if (!user) return null
  
  // Check if role is admin
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!dbUser || dbUser.role !== 'admin') {
    return null
  }

  return dbUser
}
