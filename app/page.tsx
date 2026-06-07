'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, roleToPath } from '@/store/auth.store'

export default function RootPage() {
  const { user, _hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (user) {
      router.replace(roleToPath[user.role])
    } else {
      router.replace('/login')
    }
  }, [_hasHydrated, user, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
    </div>
  )
}
