'use client'

import { useEffect, useState, useCallback } from 'react'

interface Trader { id: string; name: string; balance: number }

interface Withdrawal {
  id: string
  trader_id: string
  amount: number
  card_number: string
  status: string
  created_at: string
  traders: { name: string } | null
}

const wStatusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  transferred: 'تم التحويل',
  rejected: 'مرفوض',
}

const wStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  transferred: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ trader_id: '', amount: '', card_number: '' })

  const fetchData = useCallback(async () => {
    const [wRes, tRes] = await Promise.all([
      fetch('/api/withdrawals'),
      fetch('/api/traders'),
    ])
    const [wData, tData] = await Promise.all([wRes.json(), tRes.json()])
    if (Array.isArray(wData)) setWithdrawals(wData)
    if (Array.isArray(tData)) setTraders(tData)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const selectedTrader = traders.find(t => t.id === form.trader_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حدث خطأ')
        return
      }
      setForm({ trader_id: '', amount: '', card_number: '' })
      setShowForm(false)
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchData()
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
      {/* Traders Balances */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted mb-2">أرصدة التجار</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {traders.map(t => (
            <div key={t.id} className="shrink-0 bg-card border border-border rounded-xl px-4 py-2.5 min-w-[140px]">
              <p className="text-xs text-muted">{t.name}</p>
              <p className="text-lg font-bold text-emerald-600">{Number(t.balance).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">السحوبات</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          سحب جديد
        </button>
      </div>

      {/* New Withdrawal Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">إنشاء سحب جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">التاجر</label>
                <select value={form.trader_id} onChange={e => setForm({ ...form, trader_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer" required>
                  <option value="">اختر التاجر</option>
                  {traders.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (رصيد: {Number(t.balance).toLocaleString()})</option>
                  ))}
                </select>
                {selectedTrader && (
                  <p className="text-xs text-emerald-600 mt-1">الرصيد المتاح: {Number(selectedTrader.balance).toLocaleString()}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">المبلغ</label>
                <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="5000" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">رقم البطاقة / الحساب</label>
                <input type="text" value={form.card_number} onChange={e => setForm({ ...form, card_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="رقم البطاقة أو الحساب" required />
              </div>
            </div>
            {error && (
              <div className="bg-danger/5 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3">{error}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer">
                {submitting ? 'جاري الإرسال...' : 'إنشاء السحب'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }}
                className="bg-background hover:bg-border/50 text-foreground px-6 py-2.5 rounded-xl text-sm border border-border cursor-pointer">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted text-sm">لا توجد سحوبات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w, i) => (
            <div key={w.id} className="bg-card rounded-xl border border-border shadow-sm animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{w.traders?.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                      <span className="font-bold text-foreground text-sm">{Number(w.amount).toLocaleString()}</span>
                      <span dir="ltr">•  {w.card_number}</span>
                      <span dir="ltr">{formatDate(w.created_at)}</span>
                    </div>
                  </div>
                </div>
                <select value={w.status} onChange={e => handleStatusChange(w.id, e.target.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none ${wStatusColors[w.status]}`}>
                  {Object.entries(wStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
