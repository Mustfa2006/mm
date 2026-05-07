'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.role === 'admin') router.push('/admin/orders')
        else if (data.role === 'trader') router.push('/trader/orders')
        else router.push('/login')
      })
      .catch(() => router.push('/login'))
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
