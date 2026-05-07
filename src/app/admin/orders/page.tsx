'use client'

import { useEffect, useState, useCallback } from 'react'

interface Trader { id: string; name: string }

interface Order {
  id: string
  customer_name: string
  phone: string
  alt_phone: string
  province: string
  city: string
  notes: string
  product: string
  quantity: number
  price: string
  profit: number
  trader_id: string
  status: string
  created_at: string
  traders: { name: string } | null
}

const statusLabels: Record<string, string> = {
  new: 'جديد',
  in_delivery: 'قيد التوصيل',
  delivered: 'تم التوصيل',
  rejected: 'مرفوض',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  in_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} - ${hours}:${minutes}`
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '', phone: '', alt_phone: '', province: '', city: '',
    notes: '', product: '', quantity: '1', price: '', profit: '', trader_id: '',
  })

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    if (Array.isArray(data)) setOrders(data)
  }, [])

  const fetchTraders = useCallback(async () => {
    const res = await fetch('/api/traders')
    const data = await res.json()
    if (Array.isArray(data)) setTraders(data)
  }, [])

  useEffect(() => {
    Promise.all([fetchOrders(), fetchTraders()]).then(() => setLoading(false))
  }, [fetchOrders, fetchTraders])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity),
          profit: parseInt(form.profit) || 0,
        }),
      })
      if (res.ok) {
        setForm({ customer_name: '', phone: '', alt_phone: '', province: '', city: '', notes: '', product: '', quantity: '1', price: '', profit: '', trader_id: '' })
        setShowForm(false)
        fetchOrders()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا الطلب؟')) return
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
    fetchOrders()
    fetchTraders()
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchOrders()
    fetchTraders()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">الطلبات</h1>
          <p className="text-sm text-muted mt-0.5">{orders.length} طلب</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          طلب جديد
        </button>
      </div>

      {/* New Order Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">إنشاء طلب جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">اسم العميل</label>
                <input type="text" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="حسينية راشدية" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="07728939339" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">رقم بديل</label>
                <input type="text" value={form.alt_phone} onChange={e => setForm({ ...form, alt_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="لا يوجد" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">المحافظة</label>
                <input type="text" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="بغداد" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">المنطقة</label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="حسينية الراشدية" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">المنتج</label>
                <input type="text" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="مكنسة كهربائية" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">الكمية</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">السعر مع التوصيل</label>
                <input type="text" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="50,000" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">الربح</label>
                <input type="number" min="0" value={form.profit} onChange={e => setForm({ ...form, profit: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="5000" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">التاجر</label>
                <select value={form.trader_id} onChange={e => setForm({ ...form, trader_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer" required>
                  <option value="">اختر التاجر</option>
                  {traders.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={2} placeholder="لا توجد" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer">
                {submitting ? 'جاري الإرسال...' : 'إنشاء الطلب'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-background hover:bg-border/50 text-foreground px-6 py-2.5 rounded-xl text-sm border border-border transition-all duration-200 cursor-pointer">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
          <p className="text-muted text-sm">لا توجد طلبات حالياً</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, index) => (
            <div key={order.id}
              className="bg-card rounded-xl border border-border shadow-sm animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-xs">#{orders.length - index}</span>
                  <span className="font-bold text-sm text-foreground">{order.customer_name}</span>
                  <span className="text-xs text-muted">({order.traders?.name || '-'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none ${statusColors[order.status] || ''}`}>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button onClick={() => handleDelete(order.id)}
                    className="p-1 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted">المنتج</span><span className="font-medium">{order.product}</span></div>
                <div className="flex justify-between"><span className="text-muted">الكمية</span><span className="font-medium">{order.quantity}</span></div>
                <div className="flex justify-between"><span className="text-muted">السعر</span><span className="font-medium">{order.price}</span></div>
                <div className="flex justify-between"><span className="text-muted">الربح</span><span className="font-bold text-emerald-600">{Number(order.profit).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted">الهاتف</span><span className="font-medium" dir="ltr">{order.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted">المحافظة</span><span className="font-medium">{order.province}</span></div>
                <div className="flex justify-between"><span className="text-muted">المنطقة</span><span className="font-medium">{order.city}</span></div>
                <div className="flex justify-between"><span className="text-muted">التاريخ</span><span className="font-medium" dir="ltr">{formatDate(order.created_at)}</span></div>
                {order.notes && order.notes !== '' && (
                  <div className="flex justify-between col-span-2 sm:col-span-4"><span className="text-muted">ملاحظات</span><span className="font-medium">{order.notes}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
