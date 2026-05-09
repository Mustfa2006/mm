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

function CopyField({ label, value, ltr = false }: { label: string, value: string, ltr?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/30 group">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{label}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-muted/10 text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          title="نسخ"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          )}
        </button>
      </div>
      <span className="text-sm font-bold text-foreground" dir={ltr ? 'ltr' : 'rtl'}>{value}</span>
    </div>
  )
}

export default function TraderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [statusModal, setStatusModal] = useState<{ id: string; currentStatus: string; newStatus: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  async function handleStatusChange() {
    if (!statusModal) return
    const { id, newStatus: status } = statusModal
    setStatusModal(null)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    // Notify layout to refresh balance immediately
    window.dispatchEvent(new Event('balance-updated'))
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
      {/* Status Change Dialog */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center px-4" onClick={() => setStatusModal(null)}>
          <div
            className="bg-card rounded-2xl shadow-xl p-5 w-full max-w-xs animate-fade-in border border-border"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-foreground text-center mb-4 text-lg">تغيير حالة الطلب</h3>
            <div className="space-y-2 mb-6">
              {Object.entries(statusLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusModal({ ...statusModal, newStatus: key })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    statusModal.newStatus === key
                      ? statusColors[key] + ' ring-2 ring-current/20'
                      : 'bg-background border-border text-foreground hover:bg-muted/5'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${statusDot[key]}`} />
                  <span className="font-bold text-sm">{label}</span>
                  {statusModal.newStatus === key && (
                    <svg className="w-5 h-5 mr-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStatusChange}
                disabled={statusModal.newStatus === statusModal.currentStatus}
                className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => setStatusModal(null)}
                className="flex-1 bg-background border border-border text-foreground py-3 rounded-xl text-sm font-bold transition-all cursor-pointer hover:bg-border/30"
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
              className="bg-card rounded-2xl border border-border shadow-sm animate-slide-in overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => setExpandedId(order.id)}
            >
              {/* Header: Name + Status */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[order.status]}`} />
                  <span className="font-bold text-sm text-foreground">{order.customer_name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setStatusModal({ id: order.id, currentStatus: order.status, newStatus: order.status })
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-opacity cursor-pointer hover:opacity-80 ${statusColors[order.status]}`}
                >
                  {statusLabels[order.status]}
                </button>
              </div>

              {/* 2x2 Grid: Product/Qty then Price/Profit */}
              <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <p className="text-[10px] text-muted">المنتج</p>
                  <p className="text-sm font-bold text-foreground truncate">{order.product}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">الكمية</p>
                  <p className="text-sm font-bold text-foreground">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">السعر</p>
                  <p className="text-sm font-bold text-foreground">{order.price}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">الربح</p>
                  <p className="text-sm font-bold text-emerald-600">{Number(order.profit).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {expandedId && (() => {
        const order = orders.find(o => o.id === expandedId)
        if (!order) return null
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in"
            onClick={() => setExpandedId(null)}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto animate-slide-in"
              onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusDot[order.status]}`} />
                  <h3 className="font-bold text-base">{order.customer_name}</h3>
                </div>
                <button onClick={() => setExpandedId(null)}
                  className="p-1.5 rounded-lg hover:bg-background transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info List - Vertical */}
              <div className="px-5 py-4 space-y-3">
                <CopyField label="المنتج" value={order.product} />
                <CopyField label="الكمية" value={order.quantity.toString()} />
                <CopyField label="السعر" value={order.price} />
                <CopyField label="الربح" value={Number(order.profit).toLocaleString()} />
                <CopyField label="الهاتف" value={order.phone} />
                <CopyField label="رقم بديل" value={order.alt_phone || '-'} />
                <CopyField label="المحافظة" value={order.province} />
                <CopyField label="المنطقة" value={order.city} />
                <CopyField label="التاريخ" value={formatDate(order.created_at)} ltr />
                {order.notes && <CopyField label="ملاحظات" value={order.notes} />}

                <div 
                  className="flex justify-between items-center py-1.5 cursor-pointer group"
                  onClick={() => setStatusModal({ id: order.id, currentStatus: order.status, newStatus: order.status })}
                >
                  <span className="text-sm text-muted">الحالة</span>
                  <div className="flex items-center gap-1.5 group-hover:opacity-80 transition-opacity">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
