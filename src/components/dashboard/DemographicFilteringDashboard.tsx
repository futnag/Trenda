'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { MultiDimensionalFilter } from './MultiDimensionalFilter'
import { DemographicCrossAnalysis } from './DemographicCrossAnalysis'
import { SegmentComparison } from './SegmentComparison'
import type { 
  DemographicFilter,
  FilterState 
} from '../../types/regional'
import { DEFAULT_DEMOGRAPHIC_FILTERS } from '../../types/regional'
import { filterStateOperations } from '../../lib/regional-database'

interface DemographicFilteringDashboardProps {
  userId?: string
  initialFilters?: DemographicFilter
  className?: string
}

interface Segment {
  id: string
  name: string
  filters: DemographicFilter
  color: string
  createdAt: Date
}

const SEGMENT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]

export function DemographicFilteringDashboard({
  userId,
  initialFilters = DEFAULT_DEMOGRAPHIC_FILTERS,
  className = '',
}: DemographicFilteringDashboardProps) {
  const [filters, setFilters] = useState<DemographicFilter>(initialFilters)
  const [savedFilters, setSavedFilters] = useState<FilterState[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [activeTab, setActiveTab] = useState<'filters' | 'analysis' | 'comparison'>('filters')
  const [showCreateSegmentDialog, setShowCreateSegmentDialog] = useState(false)
  const [segmentName, setSegmentName] = useState('')

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
  }

  const handleSaveFilter = async (name: string, description?: string, isDefault?: boolean) => {
    if (!userId) return

    try {
      const response = await filterStateOperations.saveFilterState(userId, {
        name,
        description,
        filters,
        isDefault: isDefault || false,
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

  const handleDeleteFilter = async (filterId: string) => {
    if (!userId) return

    try {
      await filterStateOperations.deleteFilterState(userId, filterId)
      setSavedFilters(prev => prev.filter(f => f.id !== filterId))
    } catch (error) {
      console.error('Failed to delete filter:', error)
    }
  }

  const handleCreateSegment = () => {
    if (!segmentName.trim()) return

    const newSegment: Segment = {
      id: `segment-${Date.now()}`,
      name: segmentName.trim(),
      filters: { ...filters },
      color: SEGMENT_COLORS[segments.length % SEGMENT_COLORS.length],
      createdAt: new Date(),
    }

    setSegments(prev => [...prev, newSegment])
    setSegmentName('')
    setShowCreateSegmentDialog(false)
    setActiveTab('comparison')
  }

  const handleSegmentUpdate = (segmentId: string, newFilters: DemographicFilter) => {
    setSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, filters: newFilters }
          : segment
      )
    )
  }

  const handleSegmentRemove = (segmentId: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== segmentId))
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.values(filters).forEach(value => {
      if (Array.isArray(value) && value.length > 0) count++
      else if (value && !Array.isArray(value)) count++
    })
    return count
  }

  const hasValidFilters = () => {
    return !!(
      (filters.countries && filters.countries.length > 0) ||
      (filters.ageGroups && filters.ageGroups.length > 0) ||
      (filters.genders && filters.genders.length > 0) ||
      (filters.incomeLevels && filters.incomeLevels.length > 0)
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">人口統計学的フィルタリング</h2>
          <p className="text-gray-600 mt-1">
            多次元フィルターとクロス分析でターゲットセグメントを特定
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasValidFilters() && (
            <Button
              variant="primary"
              onClick={() => setShowCreateSegmentDialog(true)}
            >
              セグメント作成
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'filters'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            フィルター設定
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            クロス分析
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'comparison'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            セグメント比較
            {segments.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {segments.length}
              </span>
            )}
          </button>
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'filters' && (
        <MultiDimensionalFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          savedFilters={savedFilters}
          onSaveFilter={userId ? handleSaveFilter : undefined}
          onLoadFilter={handleLoadFilter}
          onDeleteFilter={handleDeleteFilter}
        />
      )}

      {activeTab === 'analysis' && (
        <DemographicCrossAnalysis
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {activeTab === 'comparison' && (
        <SegmentComparison
          segments={segments}
          onSegmentUpdate={handleSegmentUpdate}
          onSegmentRemove={handleSegmentRemove}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">アクティブフィルター</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getActiveFiltersCount()}
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
              <p className="text-sm font-medium text-gray-600">作成セグメント</p>
              <p className="text-2xl font-semibold text-gray-900">
                {segments.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">分析実行回数</p>
              <p className="text-2xl font-semibold text-gray-900">
                {savedFilters.reduce((sum, filter) => sum + filter.usageCount, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      {(savedFilters.length > 0 || segments.length > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近のアクティビティ</h3>
          <div className="space-y-3">
            {/* Recent Segments */}
            {segments.slice(-3).map((segment) => (
              <div key={segment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{segment.name}</div>
                  <div className="text-xs text-gray-600">
                    セグメント作成 • {segment.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters(segment.filters)
                    setActiveTab('filters')
                  }}
                >
                  フィルターを適用
                </Button>
              </div>
            ))}

            {/* Recent Saved Filters */}
            {savedFilters.slice(0, 2).map((filter) => (
              <div key={filter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{filter.name}</div>
                  <div className="text-xs text-gray-600">
                    使用回数: {filter.usageCount} • {new Date(filter.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadFilter(filter.id)}
                >
                  読み込み
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">使い方ガイド</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• フィルター設定で地理的・人口統計学的条件を組み合わせてセグメントを定義</li>
              <li>• クロス分析でセグメント間の関係性と市場機会を発見</li>
              <li>• セグメント比較で複数のターゲット層を定量的に評価</li>
              <li>• よく使うフィルター設定は保存して効率的に再利用</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Create Segment Dialog */}
      {showCreateSegmentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新しいセグメントを作成</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  セグメント名 *
                </label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 北米の若年層高所得者"
                />
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">現在のフィルター設定</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  {filters.countries && filters.countries.length > 0 && (
                    <div>国・地域: {filters.countries.length} 個選択</div>
                  )}
                  {filters.ageGroups && filters.ageGroups.length > 0 && (
                    <div>年齢層: {filters.ageGroups.join(', ')}</div>
                  )}
                  {filters.genders && filters.genders.length > 0 && (
                    <div>性別: {filters.genders.length} 個選択</div>
                  )}
                  {filters.incomeLevels && filters.incomeLevels.length > 0 && (
                    <div>所得層: {filters.incomeLevels.length} 個選択</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateSegmentDialog(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleCreateSegment}
                disabled={!segmentName.trim()}
              >
                作成
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}