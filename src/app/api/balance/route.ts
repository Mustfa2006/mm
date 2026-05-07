import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  if (!session) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const data = JSON.parse(session.value)
    if (data.role !== 'trader') {
      return Response.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { data: trader } = await supabase
      .from('traders')
      .select('balance')
      .eq('id', data.id)
      .single()

    return Response.json({ balance: Number(trader?.balance || 0) })
  } catch {
    return Response.json({ error: 'خطأ' }, { status: 500 })
  }
}
