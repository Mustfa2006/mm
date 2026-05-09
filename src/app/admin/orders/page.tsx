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

const emptyForm = {
  customer_name: '', phone: '', alt_phone: '', province: '', city: '',
  notes: '', product: '', quantity: '1', price: '', profit: '', trader_id: '',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Edit modal state
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })
  const [editSubmitting, setEditSubmitting] = useState(false)

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
        setForm({ ...emptyForm })
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
    if (!confirm(`هل تريد تغيير الحالة إلى "${statusLabels[status]}"؟`)) return
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchOrders()
    fetchTraders()
  }

  function openEdit(order: Order) {
    setEditOrder(order)
    setEditForm({
      customer_name: order.customer_name,
      phone: order.phone,
      alt_phone: order.alt_phone || '',
      province: order.province,
      city: order.city,
      notes: order.notes || '',
      product: order.product,
      quantity: String(order.quantity),
      price: order.price,
      profit: String(order.profit),
      trader_id: order.trader_id,
    })
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editOrder) return
    setEditSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editOrder.id,
          ...editForm,
          quantity: parseInt(editForm.quantity),
          profit: parseInt(editForm.profit) || 0,
        }),
      })
      if (res.ok) {
        setEditOrder(null)
        fetchOrders()
      }
    } finally {
      setEditSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Shared input class
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

  // Reusable form fields renderer
  const renderFormFields = (
    f: typeof form,
    setF: (v: typeof form) => void,
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-1.5">اسم العميل</label>
        <input type="text" value={f.customer_name} onChange={e => setF({ ...f, customer_name: e.target.value })}
          className={inputClass} placeholder="حسينية راشدية" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">رقم الهاتف</label>
        <input type="text" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}
          className={inputClass} placeholder="07728939339" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">رقم بديل</label>
        <input type="text" value={f.alt_phone} onChange={e => setF({ ...f, alt_phone: e.target.value })}
          className={inputClass} placeholder="لا يوجد" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">المحافظة</label>
        <input type="text" value={f.province} onChange={e => setF({ ...f, province: e.target.value })}
          className={inputClass} placeholder="بغداد" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">المنطقة</label>
        <input type="text" value={f.city} onChange={e => setF({ ...f, city: e.target.value })}
          className={inputClass} placeholder="حسينية الراشدية" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">المنتج</label>
        <input type="text" value={f.product} onChange={e => setF({ ...f, product: e.target.value })}
          className={inputClass} placeholder="مكنسة كهربائية" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">الكمية</label>
        <input type="number" min="1" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })}
          className={inputClass} required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">السعر مع التوصيل</label>
        <input type="text" value={f.price} onChange={e => setF({ ...f, price: e.target.value })}
          className={inputClass} placeholder="50,000" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">الربح</label>
        <input type="number" min="0" value={f.profit} onChange={e => setF({ ...f, profit: e.target.value })}
          className={inputClass} placeholder="5000" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">التاجر</label>
        <select value={f.trader_id} onChange={e => setF({ ...f, trader_id: e.target.value })}
          className={`${inputClass} cursor-pointer`} required>
          <option value="">اختر التاجر</option>
          {traders.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-semibold mb-1.5">ملاحظات</label>
        <textarea value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })}
          className={`${inputClass} resize-none`} rows={2} placeholder="لا توجد" />
      </div>
    </div>
  )

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
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97]"
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
          <h2 className="text-lg font-bold mb-4">إنشاء طلب جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields(form, setForm)}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer">
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

      {/* Edit Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEditOrder(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold">تعديل الطلب</h2>
              <button onClick={() => setEditOrder(null)}
                className="p-1.5 rounded-lg hover:bg-background transition-colors cursor-pointer">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {renderFormFields(editForm, setEditForm)}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSubmitting}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer">
                  {editSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button type="button" onClick={() => setEditOrder(null)}
                  className="bg-background hover:bg-border/50 text-foreground px-6 py-2.5 rounded-xl text-sm border border-border cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
          <p className="text-muted text-sm">لا توجد طلبات حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div key={order.id}
              className="bg-card rounded-2xl border border-border shadow-sm animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 30}ms` }}>

              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-background/50 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-1 rounded-lg">#{orders.length - index}</span>
                  <div>
                    <span className="font-bold text-base text-foreground">{order.customer_name}</span>
                    <span className="text-sm text-muted mr-2">({order.traders?.name || '-'})</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Status */}
                  <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none ${statusColors[order.status] || ''}`}>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {/* Edit */}
                  <button onClick={() => openEdit(order)} title="تعديل"
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button onClick={() => handleDelete(order.id)} title="حذف"
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-5 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                  <div>
                    <p className="text-xs text-muted mb-0.5">المنتج</p>
                    <p className="text-sm font-bold text-foreground">{order.product}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">الكمية</p>
                    <p className="text-sm font-bold text-foreground">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">السعر</p>
                    <p className="text-sm font-bold text-foreground">{order.price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">الربح</p>
                    <p className="text-sm font-bold text-emerald-600">{Number(order.profit).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">الهاتف</p>
                    <p className="text-sm font-bold text-foreground">{order.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">الموقع</p>
                    <p className="text-sm font-bold text-foreground">{order.province} - {order.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">رقم بديل</p>
                    <p className="text-sm font-bold text-foreground">{order.alt_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">التاريخ</p>
                    <p className="text-sm font-semibold text-foreground" dir="ltr">{formatDate(order.created_at)}</p>
                  </div>
                  {order.notes && (
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-xs text-muted mb-0.5">ملاحظات</p>
                      <p className="text-sm font-semibold text-foreground">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
