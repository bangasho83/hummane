'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'

export default function HomePage() {
  const router = useRouter()
  const { currentUser, currentCompany, isHydrating } = useApp()

  useEffect(() => {
    // Wait for hydration to complete before redirecting
    if (isHydrating) return
    if (currentUser) {
      if (currentCompany) {
        router.push('/dashboard')
      } else {
        router.push('/company-setup')
      }
    } else {
      router.push('/login')
    }
  }, [currentUser, currentCompany, router, isHydrating])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          hum<span className="text-blue-600">mane</span>
        </h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
