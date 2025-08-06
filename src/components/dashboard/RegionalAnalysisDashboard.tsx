'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { RegionalFilter } from './RegionalFilter'
import { RegionalComparison } from './RegionalComparison'
import { LocalizedOpportunities } from './LocalizedOpportunities'
import type { 
  CountryCode, 
  DemographicFilter,
  FilterState 
} from '../../types/regional'
import { DEFAULT_DEMOGRAPHIC_FILTERS } from '../../types/regional'
import { filterStateOperations } from '../../lib/regional-database'

interface RegionalAnalysisDashboardProps {
  userId?: string
  initialFilters?: DemographicFilter
  className?: string
}

export function RegionalAnalysisDashboard({
  userId,
  initialFilters = DEFAULT_DEMOGRAPHIC_FILTERS,
  className = '',
}: RegionalAnalysisDashboardProps) {
  const [filters, setFilters] = useState<DemographicFilter>(initialFilters)
  const [savedFilters, setSavedFilters] = useState<FilterState[]>([])
  const [selectedRegionsForComparison, setSelectedRegionsForComparison] = useState<CountryCode[]>([])
  const [selectedRegionForOpportunities, setSelectedRegionForOpportunities] = useState<CountryCode | null>(null)
  const [activeTab, setActiveTab] = useState<'comparison' | 'opportunities'>('comparison')

  useEffect(() => {
    if (userId) {
      loadSavedFilters()
    }
  }, [userId])

  const loadSavedFilters = async () => {
    if (!userId) return

    try {
      const response = await filterStateOperations.getUserFilterStates(userId, true)
      if (response.data) {
        setSavedFilters(response.data)
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error)
    }
  }

  const handleFiltersChange = (newFilters: DemographicFilter) => {
    setFilters(newFilters)
    
    // Update selected regions for comparison based on filter
    if (newFilters.countries && newFilters.countries.length > 0) {
      setSelectedRegionsForComparison(newFilters.countries.slice(0, 5)) // Limit to 5 regions
      if (!selectedRegionForOpportunities || !newFilters.countries.includes(selectedRegionForOpportunities)) {
        setSelectedRegionForOpportunities(newFilters.countries[0])
      }
    }
  }

  const handleSaveFilter = async (name: string, description?: string) => {
    if (!userId) return

    try {
      const response = await filterStateOperations.saveFilterState(userId, {
        name,
        description,
        filters,
        isDefault: false,
        isPublic: false,
      })

      if (response.data) {
        setSavedFilters(prev => [response.data!, ...prev])
      }
    } catch (error) {
      console.error('Failed to save filter:', error)
    }
  }

  const handleLoadFilter = async (filterId: string) => {
    const savedFilter = savedFilters.find(f => f.id === filterId)
    if (savedFilter) {
      setFilters(savedFilter.filters)
      
      // Increment usage count
      if (userId) {
        try {
          await filterStateOperations.incrementFilterUsage(filterId)
          // Update local state
          setSavedFilters(prev => 
            prev.map(f => 
              f.id === filterId 
                ? { ...f, usageCount: f.usageCount + 1 }
                : f
            )
          )
        } catch (error) {
          console.error('Failed to increment filter usage:', error)
        }
      }
    }
  }

  const handleRegionToggleForComparison = (region: CountryCode) => {
    setSelectedRegionsForComparison(prev => {
      if (prev.includes(region)) {
        return prev.filter(r => r !== region)
      } else {
        return [...prev, region].slice(0, 5) // Limit to 5 regions
      }
    })
  }

  const getFilteredThemeIds = (): string[] | undefined => {
    // This would typically come from a theme search/filter based on the demographic filters
    // For now, return undefined to get all themes
    return undefined
  }

  const getFilteredCategories = (): string[] | undefined => {
    // This would typically come from category filters
    // For now, return undefined to get all categories
    return undefined
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">地域・人口統計学的分析</h2>
          <p className="text-gray-600 mt-1">
            地域別のトレンド分析とローカライゼーション機会を発見
          </p>
        </div>
      </div>

      {/* Filters */}
      <RegionalFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSaveFilter={userId ? handleSaveFilter : undefined}
        savedFilters={savedFilters}
        onLoadFilter={handleLoadFilter}
      />

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'comparison'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            地域比較分析
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'opportunities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ローカライゼーション機会
          </button>
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'comparison' && (
        <RegionalComparison
          selectedRegions={selectedRegionsForComparison}
          onRegionToggle={handleRegionToggleForComparison}
          themeIds={getFilteredThemeIds()}
          categories={getFilteredCategories()}
        />
      )}

      {activeTab === 'opportunities' && (
        <LocalizedOpportunities
          selectedRegion={selectedRegionForOpportunities}
          onRegionChange={setSelectedRegionForOpportunities}
          themeIds={getFilteredThemeIds()}
          minMarketGap={0}
          minConfidence={0}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">分析対象地域</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filters.countries?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">人口統計セグメント</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(filters.ageGroups?.length || 0) * (filters.genders?.length || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">保存済みフィルター</p>
              <p className="text-2xl font-semibold text-gray-900">
                {savedFilters.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">使い方のヒント</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• 地域比較では複数の国を選択して市場ポテンシャルを比較できます</li>
              <li>• ローカライゼーション機会では特定地域の未開拓ニーズを発見できます</li>
              <li>• フィルター設定を保存して、定期的な分析に活用してください</li>
              <li>• 人口統計学的セグメントを組み合わせて、ターゲット市場を絞り込めます</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}