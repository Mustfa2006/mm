import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return Response.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 })
    }

    // Check admin credentials
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const cookieStore = await cookies()
      cookieStore.set('session', JSON.stringify({ role: 'admin', id: 'admin' }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      return Response.json({ role: 'admin' })
    }

    // Check trader credentials - search by username OR phone
    const supabase = createServiceClient()

    const { data: traders } = await supabase
      .from('traders')
      .select('id, name, username, password, phone')
      .or(`username.eq.${username},phone.eq.${username}`)

    const trader = traders?.find(t => t.password === password)

    if (!trader) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set('session', JSON.stringify({ role: 'trader', id: trader.id, name: trader.name }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return Response.json({ role: 'trader', name: trader.name })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
