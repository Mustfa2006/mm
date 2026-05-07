'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

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
  status: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  new: 'جديد',
  in_delivery: 'قيد التوصيل',
  delivered: 'تم التوصيل',
  rejected: 'مرفوض',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-blue-600 border-blue-200',
  in_delivery: 'bg-violet-50 text-violet-600 border-violet-200',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

const statusDot: Record<string, string> = {
  new: 'bg-blue-500',
  in_delivery: 'bg-violet-500',
  delivered: 'bg-emerald-500',
  rejected: 'bg-red-500',
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

export default function TraderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState<{ id: string; status: string } | null>(null)

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    if (Array.isArray(data)) setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()

    const client = getSupabase()
    if (!client) return

    const channel = client
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { fetchOrders() }
      )
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [fetchOrders])

  async function handleStatusChange(id: string, status: string) {
    setConfirm(null)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Confirmation Dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setConfirm(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-foreground text-center mb-1">تأكيد تغيير الحالة</h3>
            <p className="text-sm text-muted text-center mb-4">
              هل تريد تغيير الحالة إلى <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border mx-1 ${statusColors[confirm.status]}`}>{statusLabels[confirm.status]}</span>؟
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange(confirm.id, confirm.status)}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                تأكيد
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 bg-background border border-border text-foreground py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer hover:bg-border/30"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            filter === 'all' ? 'bg-foreground text-white border-foreground' : 'bg-card border-border text-muted hover:bg-background'
          }`}
        >
          الكل ({orders.length})
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              filter === key ? statusColors[key] + ' ring-1 ring-current/20' : 'bg-card border-border text-muted hover:bg-background'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[key]}`} />
            {label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted text-sm">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className="bg-card rounded-xl border border-border shadow-sm animate-slide-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusDot[order.status]}`} />
                  <span className="font-bold text-sm text-foreground">{order.customer_name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>

              {/* Card Body - Compact Grid */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">المنتج</span>
                    <span className="font-medium text-foreground text-left">{order.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">الكمية</span>
                    <span className="font-medium text-foreground">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">الهاتف</span>
                    <span className="font-medium text-foreground" dir="ltr">{order.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">السعر</span>
                    <span className="font-bold text-foreground">{order.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">الربح</span>
                    <span className="font-bold text-emerald-600">{Number(order.profit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">المحافظة</span>
                    <span className="font-medium text-foreground">{order.province}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">المنطقة</span>
                    <span className="font-medium text-foreground">{order.city}</span>
                  </div>
                  {order.alt_phone && order.alt_phone !== '' && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted">رقم بديل</span>
                      <span className="font-medium text-foreground" dir="ltr">{order.alt_phone}</span>
                    </div>
                  )}
                  {order.notes && order.notes !== '' && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted">ملاحظات</span>
                      <span className="font-medium text-foreground">{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer - Status Actions + Date */}
              <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (order.status === key) return
                        setConfirm({ id: order.id, status: key })
                      }}
                      disabled={order.status === key}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                        order.status === key
                          ? statusColors[key] + ' opacity-100'
                          : 'border-border/60 text-muted/60 hover:text-foreground hover:border-border'
                      } disabled:cursor-default`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-muted shrink-0" dir="ltr">
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
