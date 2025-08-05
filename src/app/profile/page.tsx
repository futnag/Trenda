'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ProfileSettings } from '@/components/auth/ProfileSettings'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8">
          <ProfileSettings />
        </div>
      </div>
    </ProtectedRoute>
  )
}