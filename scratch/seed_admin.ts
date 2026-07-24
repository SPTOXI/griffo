import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  const email = 'admin@griffowork.com'
  const name = 'GriffoWork Admin'
  const password = '711882GRiffo'
  const passwordHash = hashPassword(password)

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { name }] }
  })

  if (existing) {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        email,
        name,
        passwordHash,
        role: 'admin',
        plan: 'annual',
      }
    })
    console.log('✅ Usuário Admin existente atualizado com sucesso:', updated.email)
  } else {
    const created = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'admin',
        plan: 'annual',
      }
    })
    console.log('✅ Usuário Admin criado com sucesso:', created.email)
  }

  process.exit(0)
}

main().catch(err => {
  console.error('❌ Erro ao criar admin:', err)
  process.exit(1)
})
