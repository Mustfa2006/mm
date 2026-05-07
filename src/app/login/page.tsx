'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ')
        setLoading(false)
        return
      }

      if (data.role === 'admin') {
        router.push('/admin/orders')
      } else {
        router.push('/trader/orders')
      }
    } catch {
      setError('خطأ في الاتصال بالخادم')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">نظام إدارة الطلبات</h1>
          <p className="text-sm text-muted mt-1">سجّل دخولك للمتابعة</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="اسم المستخدم أو رقم الهاتف"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 text-center animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
