'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

interface Withdrawal {
  id: string
  amount: number
  card_number: string
  status: string
  created_at: string
}

const wStatusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  transferred: 'تم التحويل',
  rejected: 'مرفوض',
}

const wStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  transferred: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
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

export default function TraderWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWithdrawals = useCallback(async () => {
    const res = await fetch('/api/withdrawals')
    const data = await res.json()
    if (Array.isArray(data)) setWithdrawals(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWithdrawals()

    const client = getSupabase()
    if (!client) return

    const channel = client
      .channel('withdrawals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        () => { fetchWithdrawals() }
      )
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [fetchWithdrawals])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalTransferred = withdrawals
    .filter(w => w.status === 'transferred')
    .reduce((sum, w) => sum + Number(w.amount), 0)

  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount), 0)

  return (
    <div className="animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted">تم تحويله</p>
          <p className="text-lg font-bold text-emerald-600">{totalTransferred.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted">قيد الانتظار</p>
          <p className="text-lg font-bold text-amber-600">{totalPending.toLocaleString()}</p>
        </div>
      </div>

      <h1 className="text-xl font-bold text-foreground mb-4">السحوبات</h1>

      {withdrawals.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted text-sm">لا توجد سحوبات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w, i) => (
            <div key={w.id} className="bg-card rounded-xl border border-border shadow-sm animate-slide-in"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    w.status === 'transferred' ? 'bg-emerald-50' : w.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                    {w.status === 'transferred' ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : w.status === 'rejected' ? (
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{Number(w.amount).toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      <span dir="ltr">{w.card_number}</span>
                      <span>•</span>
                      <span dir="ltr">{formatDate(w.created_at)}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${wStatusColors[w.status]}`}>
                  {wStatusLabels[w.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
