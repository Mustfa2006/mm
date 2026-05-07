import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  if (!session) return null
  try {
    return JSON.parse(session.value)
  } catch {
    return null
  }
}

// GET orders
export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
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

// POST - create order (admin only)
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: body.customer_name,
      phone: body.phone,
      alt_phone: body.alt_phone || '',
      province: body.province,
      city: body.city,
      notes: body.notes || '',
      product: body.product,
      quantity: body.quantity,
      price: body.price,
      profit: body.profit || 0,
      trader_id: body.trader_id,
      status: 'new',
    })
    .select('*, traders(name)')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// PATCH - update order status (handles profit/balance)
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  // Get current order
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status, profit, trader_id')
    .eq('id', body.id)
    .single()

  if (!currentOrder) {
    return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
  }

  // If trader, verify ownership
  if (session.role === 'trader' && currentOrder.trader_id !== session.id) {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const oldStatus = currentOrder.status
  const newStatus = body.status
  const profit = Number(currentOrder.profit) || 0

  // Update balance based on status change
  if (profit > 0) {
    // Was delivered, now something else → subtract profit
    if (oldStatus === 'delivered' && newStatus !== 'delivered') {
      await supabase.rpc('increment_balance', {
        trader_uuid: currentOrder.trader_id,
        amount: -profit,
      }).then(({ error }) => {
        if (error) {
          // Fallback: manual update
          return supabase
            .from('traders')
            .select('balance')
            .eq('id', currentOrder.trader_id)
            .single()
            .then(({ data }) => {
              if (data) {
                return supabase
                  .from('traders')
                  .update({ balance: Number(data.balance) - profit })
                  .eq('id', currentOrder.trader_id)
              }
            })
        }
      })
    }

    // Was NOT delivered, now delivered → add profit
    if (oldStatus !== 'delivered' && newStatus === 'delivered') {
      await supabase.rpc('increment_balance', {
        trader_uuid: currentOrder.trader_id,
        amount: profit,
      }).then(({ error }) => {
        if (error) {
          // Fallback: manual update
          return supabase
            .from('traders')
            .select('balance')
            .eq('id', currentOrder.trader_id)
            .single()
            .then(({ data }) => {
              if (data) {
                return supabase
                  .from('traders')
                  .update({ balance: Number(data.balance) + profit })
                  .eq('id', currentOrder.trader_id)
              }
            })
        }
      })
    }
  }

  // Update order status
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', body.id)
    .select('*, traders(name)')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// DELETE - delete order (admin only)
export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'معرف الطلب مطلوب' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // If order was delivered, subtract profit from balance
  const { data: order } = await supabase
    .from('orders')
    .select('status, profit, trader_id')
    .eq('id', id)
    .single()

  if (order && order.status === 'delivered' && Number(order.profit) > 0) {
    const { data: trader } = await supabase
      .from('traders')
      .select('balance')
      .eq('id', order.trader_id)
      .single()

    if (trader) {
      await supabase
        .from('traders')
        .update({ balance: Number(trader.balance) - Number(order.profit) })
        .eq('id', order.trader_id)
    }
  }

  const { error } = await supabase.from('orders').delete().eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
