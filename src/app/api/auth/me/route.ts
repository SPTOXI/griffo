import { NextResponse } from 'next/server'
import { getCurrentUser, hasActivePlan } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profession: user.profession,
      plan: user.plan,
      planStartsAt: user.planStartsAt,
      planEndsAt: user.planEndsAt,
      recruiterOptIn: user.recruiterOptIn,
      profileVisible: user.profileVisible,
      planActive: hasActivePlan(user),
    },
  })
}
