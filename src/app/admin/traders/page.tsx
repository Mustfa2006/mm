'use client'

import { useEffect, useState, useCallback } from 'react'

interface Trader {
  id: string
  name: string
  phone: string
  username: string
  password: string
  created_at: string
}

export default function AdminTradersPage() {
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trader | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', username: '', password: '' })

  const fetchTraders = useCallback(async () => {
    const res = await fetch('/api/traders')
    const data = await res.json()
    if (Array.isArray(data)) setTraders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTraders()
  }, [fetchTraders])

  function openAdd() {
    setEditing(null)
    setForm({ name: '', phone: '', username: '', password: '' })
    setShowForm(true)
  }

  function openEdit(trader: Trader) {
    setEditing(trader)
    setForm({ name: trader.name, phone: trader.phone, username: trader.username, password: trader.password })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await fetch('/api/traders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      } else {
        await fetch('/api/traders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowForm(false)
      setEditing(null)
      fetchTraders()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا التاجر؟ سيتم حذف جميع طلباته.')) return
    await fetch(`/api/traders?id=${id}`, { method: 'DELETE' })
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
          <h1 className="text-xl font-bold text-foreground">التجار</h1>
          <p className="text-sm text-muted mt-0.5">{traders.length} تاجر</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          إضافة تاجر
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? 'تعديل التاجر' : 'إضافة تاجر جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">اسم التاجر</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="أحمد العراقي"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="07700000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">اسم المستخدم</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="ahmed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="كلمة المرور"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة التاجر'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="bg-background hover:bg-border/50 text-foreground px-6 py-2.5 rounded-xl text-sm border border-border transition-all duration-200 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Traders List */}
      {traders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-muted/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="text-muted text-sm">لا يوجد تجار حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {traders.map((trader, index) => (
            <div
              key={trader.id}
              className="bg-card rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {trader.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{trader.name}</h3>
                    <p className="text-xs text-muted mt-0.5" dir="ltr">{trader.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(trader)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(trader.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-background rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">المستخدم</span>
                  <span className="font-medium text-foreground" dir="ltr">{trader.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">كلمة المرور</span>
                  <span className="font-medium text-foreground" dir="ltr">{trader.password}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
