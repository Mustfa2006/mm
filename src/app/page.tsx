import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (session) {
    try {
      const data = JSON.parse(session.value)
      if (data.role === 'admin') redirect('/admin/orders')
      if (data.role === 'trader') redirect('/trader/orders')
    } catch {
      // Invalid session
    }
  }

  redirect('/login')
}
