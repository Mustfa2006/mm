import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) {
    return Response.json({ error: 'غير مسجل دخول' }, { status: 401 })
  }

  try {
    const data = JSON.parse(session.value)
    return Response.json(data)
  } catch {
    return Response.json({ error: 'جلسة غير صالحة' }, { status: 401 })
  }
}
