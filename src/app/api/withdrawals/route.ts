import { createServiceClient } from '@/lib/supabase'

function getSessionFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

// GET withdrawals
export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from('withdrawals')
    .select('*, traders(name)')
    .order('created_at', { ascending: false })

  if (session.role === 'trader') {
    query = query.eq('trader_id', session.id)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// POST - create withdrawal (admin only)
export async function POST(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const amount = Number(body.amount)

  // Check trader balance
  const { data: trader } = await supabase
    .from('traders')
    .select('balance, name')
    .eq('id', body.trader_id)
    .single()

  if (!trader) {
    return Response.json({ error: 'التاجر غير موجود' }, { status: 404 })
  }

  if (Number(trader.balance) < amount) {
    return Response.json({ error: 'رصيد التاجر غير كافي' }, { status: 400 })
  }

  // Deduct from balance
  await supabase
    .from('traders')
    .update({ balance: Number(trader.balance) - amount })
    .eq('id', body.trader_id)

  // Create withdrawal
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      trader_id: body.trader_id,
      amount: amount,
      card_number: body.card_number || '',
      status: 'pending',
    })
    .select('*, traders(name)')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// PATCH - update withdrawal status (admin only)
export async function PATCH(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  // Get current withdrawal
  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('status, amount, trader_id')
    .eq('id', body.id)
    .single()

  if (!withdrawal) {
    return Response.json({ error: 'السحب غير موجود' }, { status: 404 })
  }

  const oldStatus = withdrawal.status
  const newStatus = body.status

  // Return money to trader if changing TO rejected (from any status)
  // Money was deducted when withdrawal was created, so return it on reject
  if (newStatus === 'rejected' && oldStatus !== 'rejected') {
    const { data: trader } = await supabase
      .from('traders')
      .select('balance')
      .eq('id', withdrawal.trader_id)
      .single()

    if (trader) {
      await supabase
        .from('traders')
        .update({ balance: Number(trader.balance) + Number(withdrawal.amount) })
        .eq('id', withdrawal.trader_id)
    }
  }

  // Deduct money again if changing FROM rejected to pending or transferred
  // (money was returned when rejected, so deduct again)
  if (oldStatus === 'rejected' && newStatus !== 'rejected') {
    const { data: trader } = await supabase
      .from('traders')
      .select('balance')
      .eq('id', withdrawal.trader_id)
      .single()

    if (trader) {
      await supabase
        .from('traders')
        .update({ balance: Number(trader.balance) - Number(withdrawal.amount) })
        .eq('id', withdrawal.trader_id)
    }
  }

  // Update status
  const { data, error } = await supabase
    .from('withdrawals')
    .update({ status: newStatus })
    .eq('id', body.id)
    .select('*, traders(name)')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
