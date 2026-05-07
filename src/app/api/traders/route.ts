import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

// Helper to check admin session
async function isAdmin() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  if (!session) return false
  try {
    const data = JSON.parse(session.value)
    return data.role === 'admin'
  } catch {
    return false
  }
}

// GET all traders
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('traders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// POST - create trader
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('traders')
    .insert({
      name: body.name,
      phone: body.phone,
      username: body.username,
      password: body.password,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// PUT - update trader
export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('traders')
    .update({
      name: body.name,
      phone: body.phone,
      username: body.username,
      password: body.password,
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// DELETE - delete trader
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'معرف التاجر مطلوب' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('traders')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
