import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ProfileSettings } from '@/components/auth/ProfileSettings'
import Header from '@/components/common/Header'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-8">
          <ProfileSettings />
        </main>
      </div>
    </ProtectedRoute>
  )
}