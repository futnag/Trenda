import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Header from '@/components/common/Header'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  ダッシュボード
                </h1>
                <p className="text-gray-600">
                  認証システムが正常に動作しています！
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  今後のタスクでダッシュボード機能を実装予定です。
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}