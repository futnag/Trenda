'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import type { 
  CountryCode, 
  DemographicFilter,
  FilterState 
} from '../../types/regional'
import { 
  COUNTRY_NAMES, 
  MAJOR_REGIONS, 
  EUROPEAN_COUNTRIES,
  ASIAN_COUNTRIES,
  NORTH_AMERICAN_COUNTRIES,
  DEFAULT_DEMOGRAPHIC_FILTERS 
} from '../../types/regional'
import { AgeGroup, Gender, IncomeLevel } from '../../types'

interface RegionalFilterProps {
  filters: DemographicFilter
  onFiltersChange: (filters: DemographicFilter) => void
  onSaveFilter?: (name: string, description?: string) => void
  savedFilters?: FilterState[]
  onLoadFilter?: (filterId: string) => void
  className?: string
}

export function RegionalFilter({
  filters,
  onFiltersChange,
  onSaveFilter,
  savedFilters = [],
  onLoadFilter,
  className = '',
}: RegionalFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [filterDescription, setFilterDescription] = useState('')

  const handleCountryChange = (country: CountryCode, checked: boolean) => {
    const currentCountries = filters.countries || []
    const newCountries = checked
      ? [...currentCountries, country]
      : currentCountries.filter(c => c !== country)
    
    onFiltersChange({
      ...filters,
      countries: newCountries,
    })
  }

  const handleRegionPresetChange = (regionCountries: CountryCode[]) => {
    onFiltersChange({
      ...filters,
      countries: regionCountries,
    })
  }

  const handleAgeGroupChange = (ageGroup: string, checked: boolean) => {
    const currentAgeGroups = filters.ageGroups || []
    const newAgeGroups = checked
      ? [...currentAgeGroups, ageGroup as any]
      : currentAgeGroups.filter(ag => ag !== ageGroup)
    
    onFiltersChange({
      ...filters,
      ageGroups: newAgeGroups,
    })
  }

  const handleGenderChange = (gender: string, checked: boolean) => {
    const currentGenders = filters.genders || []
    const newGenders = checked
      ? [...currentGenders, gender as any]
      : currentGenders.filter(g => g !== gender)
    
    onFiltersChange({
      ...filters,
      genders: newGenders,
    })
  }

  const handleIncomeLevelChange = (incomeLevel: string, checked: boolean) => {
    const currentIncomeLevels = filters.incomeLevels || []
    const newIncomeLevels = checked
      ? [...currentIncomeLevels, incomeLevel as any]
      : currentIncomeLevels.filter(il => il !== incomeLevel)
    
    onFiltersChange({
      ...filters,
      incomeLevels: newIncomeLevels,
    })
  }

  const handleReset = () => {
    onFiltersChange(DEFAULT_DEMOGRAPHIC_FILTERS)
  }

  const handleSave = () => {
    if (onSaveFilter && filterName.trim()) {
      onSaveFilter(filterName.trim(), filterDescription.trim() || undefined)
      setShowSaveDialog(false)
      setFilterName('')
      setFilterDescription('')
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.countries?.length) count++
    if (filters.ageGroups?.length) count++
    if (filters.genders?.length) count++
    if (filters.incomeLevels?.length) count++
    if (filters.ethnicities?.length) count++
    if (filters.languages?.length) count++
    return count
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">地域・人口統計フィルター</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()} 個のフィルター適用中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '折りたたむ' : '展開'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            リセット
          </Button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            保存済みフィルター
          </label>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((savedFilter) => (
              <Button
                key={savedFilter.id}
                variant="outline"
                size="sm"
                onClick={() => onLoadFilter?.(savedFilter.id)}
                className="text-xs"
              >
                {savedFilter.name}
                {savedFilter.isDefault && (
                  <span className="ml-1 text-blue-600">★</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-6">
          {/* Country/Region Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              国・地域
            </label>
            
            {/* Region Presets */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegionPresetChange(MAJOR_REGIONS)}
                >
                  主要地域
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegionPresetChange(NORTH_AMERICAN_COUNTRIES)}
                >
                  北米
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegionPresetChange(EUROPEAN_COUNTRIES)}
                >
                  ヨーロッパ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegionPresetChange(ASIAN_COUNTRIES)}
                >
                  アジア
                </Button>
              </div>
            </div>

            {/* Individual Countries */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                <label key={code} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.countries?.includes(code as CountryCode) || false}
                    onChange={(e) => handleCountryChange(code as CountryCode, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">{name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Age Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              年齢層
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.values(AgeGroup).map((ageGroup) => (
                <label key={ageGroup} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.ageGroups?.includes(ageGroup) || false}
                    onChange={(e) => handleAgeGroupChange(ageGroup, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{ageGroup}歳</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性別
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(Gender).map(([key, value]) => (
                <label key={value} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.genders?.includes(value) || false}
                    onChange={(e) => handleGenderChange(value, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    {value === 'male' ? '男性' : 
                     value === 'female' ? '女性' : 
                     value === 'other' ? 'その他' : '回答しない'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Income Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所得層
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(IncomeLevel).map((incomeLevel) => (
                <label key={incomeLevel} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.incomeLevels?.includes(incomeLevel) || false}
                    onChange={(e) => handleIncomeLevelChange(incomeLevel, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    {incomeLevel === 'low' ? '低所得' :
                     incomeLevel === 'middle' ? '中所得' :
                     incomeLevel === 'high' ? '高所得' : 'プレミアム'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Filter */}
          {onSaveFilter && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="w-full"
              >
                フィルター設定を保存
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">フィルター設定を保存</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フィルター名 *
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 北米の若年層"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="このフィルターの用途や特徴を説明してください"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSave}
                disabled={!filterName.trim()}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}