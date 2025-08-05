import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Header from '@/components/common/Header'
import { TrendDashboard } from '@/components/dashboard'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <TrendDashboard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}