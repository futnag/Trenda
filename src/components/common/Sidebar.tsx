'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  requiresAuth?: boolean
  requiresPro?: boolean
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
      </svg>
    ),
    requiresAuth: true,
  },
  {
    href: '/themes',
    label: 'トレンドテーマ',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    requiresAuth: true,
  },
  {
    href: '/analysis',
    label: '競合分析',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    requiresAuth: true,
    requiresPro: true,
  },
  {
    href: '/alerts',
    label: 'アラート設定',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 12.344l1.414 1.414L9 10.414V3a1 1 0 011-1h4a1 1 0 011 1v7.414l3.243 3.243 1.414-1.414L15 8.586V3a3 3 0 00-3-3H8a3 3 0 00-3 3v5.586l-0.657 3.758z" />
      </svg>
    ),
    requiresAuth: true,
  },
  {
    href: '/profile',
    label: 'プロフィール',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    requiresAuth: true,
  },
]

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <span className="text-lg font-semibold text-gray-900">メニュー</span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null
              
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group
                    ${active 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={`mr-3 ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.requiresPro && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pro
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500">
                  無料プラン
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Link
                href="/pricing"
                className="w-full flex justify-center items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                アップグレード
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
