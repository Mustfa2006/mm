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
      const res = Response.json({ role: 'admin' })
      res.headers.set('Set-Cookie', `session=${encodeURIComponent(JSON.stringify({ role: 'admin', id: 'admin' }))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`)
      return res
    }

    // Check trader credentials
    const supabase = createServiceClient()

    const { data: traders } = await supabase
      .from('traders')
      .select('id, name, username, password, phone')
      .or(`username.eq.${username},phone.eq.${username}`)

    const trader = traders?.find(t => t.password === password)

    if (!trader) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const sessionData = JSON.stringify({ role: 'trader', id: trader.id, name: trader.name })
    const res = Response.json({ role: 'trader', name: trader.name })
    res.headers.set('Set-Cookie', `session=${encodeURIComponent(sessionData)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`)
    return res
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'حدث خطأ في الخادم: ' + String(err) }, { status: 500 })
  }
}
