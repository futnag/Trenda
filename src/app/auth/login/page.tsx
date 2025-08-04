'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'

function LoginPageContent() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Check for error parameters
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'callback_error':
          setError('認証処理中にエラーが発生しました。もう一度お試しください。')
          break
        case 'unexpected_error':
          setError('予期しないエラーが発生しました。もう一度お試しください。')
          break
        default:
          setError('エラーが発生しました。もう一度お試しください。')
      }
    }

    // Redirect if already logged in
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [searchParams, user, loading, router])

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Theme Discovery Tool
          </h1>
          <p className="text-gray-600">
            個人開発者向けテーマ発見ツール
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <LoginForm onToggleMode={toggleMode} onSuccess={handleSuccess} />
        ) : (
          <SignupForm onToggleMode={toggleMode} onSuccess={handleSuccess} />
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          利用規約とプライバシーポリシーに同意の上、ご利用ください。
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}