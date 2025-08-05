'use client'

import { useState } from 'react'

export interface SortOption {
  value: string
  label: string
  field: string
  order: 'asc' | 'desc'
}

interface ThemeSortControlsProps {
  currentSort: string
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  className?: string
}

const sortOptions: SortOption[] = [
  {
    value: 'monetizationScore-desc',
    label: 'マネタイズスコア（高い順）',
    field: 'monetizationScore',
    order: 'desc'
  },
  {
    value: 'monetizationScore-asc',
    label: 'マネタイズスコア（低い順）',
    field: 'monetizationScore',
    order: 'asc'
  },
  {
    value: 'marketSize-desc',
    label: '市場規模（大きい順）',
    field: 'marketSize',
    order: 'desc'
  },
  {
    value: 'marketSize-asc',
    label: '市場規模（小さい順）',
    field: 'marketSize',
    order: 'asc'
  },
  {
    value: 'updatedAt-desc',
    label: '更新日（新しい順）',
    field: 'updatedAt',
    order: 'desc'
  },
  {
    value: 'updatedAt-asc',
    label: '更新日（古い順）',
    field: 'updatedAt',
    order: 'asc'
  },
  {
    value: 'title-asc',
    label: 'タイトル（A-Z）',
    field: 'title',
    order: 'asc'
  },
  {
    value: 'title-desc',
    label: 'タイトル（Z-A）',
    field: 'title',
    order: 'desc'
  }
]

export function ThemeSortControls({
  currentSort,
  onSortChange,
  className = ''
}: ThemeSortControlsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentOption = sortOptions.find(option => option.value === currentSort) || sortOptions[0]

  const handleSortChange = (option: SortOption) => {
    onSortChange(option.field, option.order)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Desktop dropdown */}
      <div className="hidden sm:block">
        <select
          value={currentSort}
          onChange={(e) => {
            const option = sortOptions.find(opt => opt.value === e.target.value)
            if (option) {
              handleSortChange(option)
            }
          }}
          className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
          aria-label="テーマの並び順を選択"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile dropdown */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-between w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="truncate">{currentOption.label}</span>
          <svg
            className={`ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSortChange(option)}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      option.value === currentSort
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                    {option.value === currentSort && (
                      <svg
                        className="ml-2 inline h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Quick sort buttons for common actions
export function QuickSortButtons({
  onSortChange,
  className = ''
}: {
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  className?: string
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onSortChange('monetizationScore', 'desc')}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        高スコア順
      </button>
      
      <button
        type="button"
        onClick={() => onSortChange('marketSize', 'desc')}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
        </svg>
        大市場順
      </button>
      
      <button
        type="button"
        onClick={() => onSortChange('updatedAt', 'desc')}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        最新順
      </button>
    </div>
  )
}