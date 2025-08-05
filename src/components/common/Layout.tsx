'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {showSidebar && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}
        
        <main className={`flex-1 ${showSidebar ? 'lg:ml-0' : ''}`}>
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar toggle button */}
      {showSidebar && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-4 left-4 lg:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-20"
          aria-label="メニューを開く"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  )
}