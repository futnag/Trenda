'use client'

import { useState } from 'react'
import type { ThemeFilterRequest, ThemeCategory, CompetitionLevel, TechnicalDifficulty, AgeGroup } from '@/types'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'

interface CategoryFilterProps {
  filters: Partial<ThemeFilterRequest>
  onFilterChange: (filters: Partial<ThemeFilterRequest>) => void
  className?: string
}

// Filter options based on requirements
const THEME_CATEGORIES: { value: ThemeCategory; label: string }[] = [
  { value: 'productivity', label: '生産性' },
  { value: 'entertainment', label: 'エンターテイメント' },
  { value: 'education', label: '教育' },
  { value: 'health', label: 'ヘルスケア' },
  { value: 'finance', label: '金融' },
  { value: 'social', label: 'ソーシャル' },
]

const COMPETITION_LEVELS: { value: CompetitionLevel; label: string }[] = [
  { value: 'low', label: '低競合' },
  { value: 'medium', label: '中競合' },
  { value: 'high', label: '高競合' },
]

const TECHNICAL_DIFFICULTIES: { value: TechnicalDifficulty; label: string }[] = [
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
]

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: '18-24', label: '18-24歳' },
  { value: '25-34', label: '25-34歳' },
  { value: '35-44', label: '35-44歳' },
  { value: '45-54', label: '45-54歳' },
  { value: '55-64', label: '55-64歳' },
  { value: '65+', label: '65歳以上' },
]

// Popular countries for filtering
const COUNTRIES = [
  { value: 'JP', label: '日本' },
  { value: 'US', label: 'アメリカ' },
  { value: 'GB', label: 'イギリス' },
  { value: 'DE', label: 'ドイツ' },
  { value: 'FR', label: 'フランス' },
  { value: 'KR', label: '韓国' },
  { value: 'CN', label: '中国' },
  { value: 'IN', label: 'インド' },
]

export function CategoryFilter({ filters, onFilterChange, className = '' }: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCategoryChange = (categories: ThemeCategory[]) => {
    onFilterChange({ categories })
  }

  const handleCompetitionChange = (competitionLevel: CompetitionLevel[]) => {
    onFilterChange({ competitionLevel })
  }

  const handleDifficultyChange = (technicalDifficulty: TechnicalDifficulty[]) => {
    onFilterChange({ technicalDifficulty })
  }

  const handleCountryChange = (countries: string[]) => {
    onFilterChange({ countries })
  }

  const handleAgeGroupChange = (ageGroups: AgeGroup[]) => {
    onFilterChange({ ageGroups })
  }

  const handleMonetizationScoreChange = (min?: number, max?: number) => {
    onFilterChange({
      minMonetizationScore: min,
      maxMonetizationScore: max,
    })
  }

  const handleMarketSizeChange = (min?: number, max?: number) => {
    onFilterChange({
      minMarketSize: min,
      maxMarketSize: max,
    })
  }

  const clearAllFilters = () => {
    onFilterChange({
      categories: undefined,
      competitionLevel: undefined,
      technicalDifficulty: undefined,
      countries: undefined,
      ageGroups: undefined,
      minMonetizationScore: undefined,
      maxMonetizationScore: undefined,
      minMarketSize: undefined,
      maxMarketSize: undefined,
    })
  }

  const hasActiveFilters = !!(
    filters.categories?.length ||
    filters.competitionLevel?.length ||
    filters.technicalDifficulty?.length ||
    filters.countries?.length ||
    filters.ageGroups?.length ||
    filters.minMonetizationScore !== undefined ||
    filters.maxMonetizationScore !== undefined ||
    filters.minMarketSize !== undefined ||
    filters.maxMarketSize !== undefined
  )

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">フィルター</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              クリア
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? '折りたたむ' : '詳細フィルター'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリー
            </label>
            <select
              multiple
              value={filters.categories || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as ThemeCategory)
                handleCategoryChange(selected)
              }}
              className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              size={3}
            >
              {THEME_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Competition Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              競合レベル
            </label>
            <select
              multiple
              value={filters.competitionLevel || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as CompetitionLevel)
                handleCompetitionChange(selected)
              }}
              className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              size={3}
            >
              {COMPETITION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Technical Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              技術難易度
            </label>
            <select
              multiple
              value={filters.technicalDifficulty || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as TechnicalDifficulty)
                handleDifficultyChange(selected)
              }}
              className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              size={3}
            >
              {TECHNICAL_DIFFICULTIES.map(difficulty => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  国・地域
                </label>
                <select
                  multiple
                  value={filters.countries || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    handleCountryChange(selected)
                  }}
                  className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  size={4}
                >
                  {COUNTRIES.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢層
                </label>
                <select
                  multiple
                  value={filters.ageGroups || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value as AgeGroup)
                    handleAgeGroupChange(selected)
                  }}
                  className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  size={4}
                >
                  {AGE_GROUPS.map(ageGroup => (
                    <option key={ageGroup.value} value={ageGroup.value}>
                      {ageGroup.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monetization Score Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  マネタイズスコア
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="最小値"
                      value={filters.minMonetizationScore || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        handleMonetizationScoreChange(value, filters.maxMonetizationScore)
                      }}
                      className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="最大値"
                      value={filters.maxMonetizationScore || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        handleMonetizationScoreChange(filters.minMonetizationScore, value)
                      }}
                      className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Market Size Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市場規模
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="最小値"
                    value={filters.minMarketSize || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined
                      handleMarketSizeChange(value, filters.maxMarketSize)
                    }}
                    className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">〜</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="最大値"
                    value={filters.maxMarketSize || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined
                      handleMarketSizeChange(filters.minMarketSize, value)
                    }}
                    className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {filters.categories?.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {THEME_CATEGORIES.find(c => c.value === category)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      const newCategories = filters.categories?.filter(c => c !== category) || []
                      handleCategoryChange(newCategories)
                    }}
                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                  >
                    <span className="sr-only">Remove filter</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}
              
              {filters.competitionLevel?.map(level => (
                <span
                  key={level}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {COMPETITION_LEVELS.find(l => l.value === level)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      const newLevels = filters.competitionLevel?.filter(l => l !== level) || []
                      handleCompetitionChange(newLevels)
                    }}
                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-400 hover:bg-green-200 hover:text-green-500 focus:outline-none focus:bg-green-500 focus:text-white"
                  >
                    <span className="sr-only">Remove filter</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}

              {filters.countries?.map(country => (
                <span
                  key={country}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {COUNTRIES.find(c => c.value === country)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      const newCountries = filters.countries?.filter(c => c !== country) || []
                      handleCountryChange(newCountries)
                    }}
                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
                  >
                    <span className="sr-only">Remove filter</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}

              {filters.ageGroups?.map(ageGroup => (
                <span
                  key={ageGroup}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  {AGE_GROUPS.find(a => a.value === ageGroup)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      const newAgeGroups = filters.ageGroups?.filter(a => a !== ageGroup) || []
                      handleAgeGroupChange(newAgeGroups)
                    }}
                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500 focus:outline-none focus:bg-yellow-500 focus:text-white"
                  >
                    <span className="sr-only">Remove filter</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}