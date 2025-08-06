'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ProfileSettings } from '@/components/auth/ProfileSettings'
import SubscriptionManager from '@/components/subscription/SubscriptionManager'
import Header from '@/components/common/Header'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile')

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">アカウント設定</h1>
            <p className="text-gray-600 mt-2">
              プロフィール情報とサブスクリプションを管理できます
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                プロフィール
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subscription'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                サブスクリプション
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'subscription' && <SubscriptionManager />}
        </div>
      </div>
    </ProtectedRoute>
  )
}