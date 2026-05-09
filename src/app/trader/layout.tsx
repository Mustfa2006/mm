'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [traderName, setTraderName] = useState('')
  const [traderId, setTraderId] = useState('')
  const [balance, setBalance] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.role !== 'trader') {
          router.push('/login')
        } else {
          setTraderName(data.name || 'تاجر')
          setTraderId(data.id)
          setLoading(false)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  // Fetch balance
  useEffect(() => {
    if (!traderId) return

    function refreshBalance() {
      fetch('/api/balance')
        .then(r => r.json())
        .then(data => {
          if (typeof data.balance === 'number') setBalance(data.balance)
        })
        .catch(() => {})
    }

    refreshBalance()

    // Listen for balance update events from child pages
    window.addEventListener('balance-updated', refreshBalance)
    return () => window.removeEventListener('balance-updated', refreshBalance)
  }, [traderId])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">{traderName.charAt(0)}</span>
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">{traderName}</span>
                <p className="text-xs text-emerald-600 font-bold">{balance.toLocaleString()} ربح</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link href="/trader/orders"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname === '/trader/orders' ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:text-foreground'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <span className="hidden sm:inline">الطلبات</span>
              </Link>
              <Link href="/trader/withdrawals"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname === '/trader/withdrawals' ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:text-foreground'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
                <span className="hidden sm:inline">السحوبات</span>
              </Link>
            </div>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-muted hover:text-danger text-sm transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
