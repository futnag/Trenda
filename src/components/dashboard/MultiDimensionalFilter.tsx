'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import type { 
  DemographicFilter,
  FilterState 
} from '../../types/regional'
import { 
  COUNTRY_NAMES, 
  MAJOR_REGIONS, 
  EUROPEAN_COUNTRIES,
  ASIAN_COUNTRIES,
  NORTH_AMERICAN_COUNTRIES 
} from '../../types/regional'
import { AgeGroup, Gender, IncomeLevel } from '../../types'

interface MultiDimensionalFilterProps {
  filters: DemographicFilter
  onFiltersChange: (filters: DemographicFilter) => void
  savedFilters?: FilterState[]
  onSaveFilter?: (name: string, description?: string, isDefault?: boolean) => void
  onLoadFilter?: (filterId: string) => void
  onDeleteFilter?: (filterId: string) => void
  className?: string
}

interface FilterCombination {
  id: string
  name: string
  description: string
  filters: DemographicFilter
  estimatedSegmentSize: number
}

export function MultiDimensionalFilter({
  filters,
  onFiltersChange,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  className = '',
}: MultiDimensionalFilterProps) {
  const [activeSection, setActiveSection] = useState<string>('geographic')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterCombinations, setFilterCombinations] = useState<FilterCombination[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveDialogData, setSaveDialogData] = useState({
    name: '',
    description: '',
    isDefault: false,
  })

  useEffect(() => {
    generateFilterCombinations()
  }, [filters])

  const generateFilterCombinations = () => {
    const combinations: FilterCombination[] = []
    
    // Generate common combinations
    if (filters.countries && filters.ageGroups) {
      filters.countries.forEach(country => {
        filters.ageGroups?.forEach(ageGroup => {
          const combinationFilters: DemographicFilter = {
            countries: [country],
            ageGroups: [ageGroup],
            genders: filters.genders,
            incomeLevels: filters.incomeLevels,
          }
          
          combinations.push({
            id: `${country}-${ageGroup}`,
            name: `${COUNTRY_NAMES[country]} - ${ageGroup}歳`,
            description: `${COUNTRY_NAMES[country]}の${ageGroup}歳層`,
            filters: combinationFilters,
            estimatedSegmentSize: Math.floor(Math.random() * 1000000) + 100000, // Mock data
          })
        })
      })
    }

    setFilterCombinations(combinations.slice(0, 10)) // Limit to 10 combinations
  }

  const handleFilterChange = (
    filterType: keyof DemographicFilter,
    value: string,
    checked: boolean
  ) => {
    const currentValues = (filters[filterType] as string[]) || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value)
    
    onFiltersChange({
      ...filters,
      [filterType]: newValues,
    })
  }

  const handleBulkFilterChange = (
    filterType: keyof DemographicFilter,
    values: string[]
  ) => {
    onFiltersChange({
      ...filters,
      [filterType]: values,
    })
  }

  const handleClearFilter = (filterType: keyof DemographicFilter) => {
    onFiltersChange({
      ...filters,
      [filterType]: [],
    })
  }

  const handleClearAllFilters = () => {
    onFiltersChange({
      countries: [],
      regions: [],
      ageGroups: [],
      genders: [],
      ethnicities: [],
      incomeLevels: [],
      languages: [],
      urbanRural: undefined,
      educationLevel: [],
      occupation: [],
    })
  }

  const handleSaveFilter = () => {
    if (onSaveFilter && saveDialogData.name.trim()) {
      onSaveFilter(
        saveDialogData.name.trim(),
        saveDialogData.description.trim() || undefined,
        saveDialogData.isDefault
      )
      setShowSaveDialog(false)
      setSaveDialogData({ name: '', description: '', isDefault: false })
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.values(filters).forEach(value => {
      if (Array.isArray(value) && value.length > 0) count++
      else if (value && !Array.isArray(value)) count++
    })
    return count
  }

  const getEstimatedSegmentSize = () => {
    // Mock calculation - in real implementation, this would query the database
    let baseSize = 10000000 // 10M base population
    
    if (filters.countries?.length) {
      baseSize = baseSize * (filters.countries.length / 39) // Adjust for country selection
    }
    if (filters.ageGroups?.length) {
      baseSize = baseSize * (filters.ageGroups.length / 6) // Adjust for age groups
    }
    if (filters.genders?.length) {
      baseSize = baseSize * (filters.genders.length / 4) // Adjust for gender
    }
    if (filters.incomeLevels?.length) {
      baseSize = baseSize * (filters.incomeLevels.length / 4) // Adjust for income
    }

    return Math.floor(baseSize)
  }

  const sections = [
    { id: 'geographic', name: '地理的', icon: '🌍' },
    { id: 'demographic', name: '人口統計', icon: '👥' },
    { id: 'socioeconomic', name: '社会経済', icon: '💼' },
    { id: 'behavioral', name: '行動', icon: '📊' },
  ]

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">多次元フィルター</h3>
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
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '基本表示' : '詳細表示'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllFilters}
          >
            すべてクリア
          </Button>
        </div>
      </div>

      {/* Estimated Segment Size */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-blue-900">推定セグメントサイズ</h4>
            <p className="text-2xl font-bold text-blue-600">
              {getEstimatedSegmentSize().toLocaleString()} 人
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">全人口に対する割合</p>
            <p className="text-lg font-semibold text-blue-600">
              {((getEstimatedSegmentSize() / 10000000) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeSection === section.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.name}</span>
          </button>
        ))}
      </div>

      {/* Filter Content */}
      <div className="space-y-6">
        {/* Geographic Filters */}
        {activeSection === 'geographic' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  国・地域 ({filters.countries?.length || 0} 選択中)
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkFilterChange('countries', MAJOR_REGIONS)}
                  >
                    主要地域
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearFilter('countries')}
                  >
                    クリア
                  </Button>
                </div>
              </div>

              {/* Region Presets */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkFilterChange('countries', NORTH_AMERICAN_COUNTRIES)}
                  >
                    北米 ({NORTH_AMERICAN_COUNTRIES.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkFilterChange('countries', EUROPEAN_COUNTRIES)}
                  >
                    ヨーロッパ ({EUROPEAN_COUNTRIES.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkFilterChange('countries', ASIAN_COUNTRIES)}
                  >
                    アジア ({ASIAN_COUNTRIES.length})
                  </Button>
                </div>
              </div>

              {/* Country Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-3">
                {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                  <label key={code} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.countries?.includes(code as any) || false}
                      onChange={(e) => handleFilterChange('countries', code, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{name}</span>
                  </label>
                ))}
              </div>
            </div>

            {showAdvanced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  都市・地方
                </label>
                <div className="flex gap-4">
                  {['urban', 'rural', 'both'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="urbanRural"
                        value={option}
                        checked={filters.urbanRural === option}
                        onChange={(e) => onFiltersChange({ ...filters, urbanRural: e.target.value as any })}
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        {option === 'urban' ? '都市部' : option === 'rural' ? '地方' : '両方'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Demographic Filters */}
        {activeSection === 'demographic' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  年齢層 ({filters.ageGroups?.length || 0} 選択中)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearFilter('ageGroups')}
                >
                  クリア
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.values(AgeGroup).map((ageGroup) => (
                  <label key={ageGroup} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.ageGroups?.includes(ageGroup) || false}
                      onChange={(e) => handleFilterChange('ageGroups', ageGroup, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{ageGroup}歳</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  性別 ({filters.genders?.length || 0} 選択中)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearFilter('genders')}
                >
                  クリア
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(Gender).map(([key, value]) => (
                  <label key={value} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.genders?.includes(value) || false}
                      onChange={(e) => handleFilterChange('genders', value, e.target.checked)}
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

            {showAdvanced && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    民族・人種
                  </label>
                  <input
                    type="text"
                    placeholder="例: アジア系, ヨーロッパ系, アフリカ系"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const ethnicities = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      onFiltersChange({ ...filters, ethnicities })
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    教育レベル
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['high_school', 'bachelor', 'master', 'phd', 'other'].map((level) => (
                      <label key={level} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.educationLevel?.includes(level as any) || false}
                          onChange={(e) => handleFilterChange('educationLevel', level, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          {level === 'high_school' ? '高校' :
                           level === 'bachelor' ? '学士' :
                           level === 'master' ? '修士' :
                           level === 'phd' ? '博士' : 'その他'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Socioeconomic Filters */}
        {activeSection === 'socioeconomic' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  所得層 ({filters.incomeLevels?.length || 0} 選択中)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearFilter('incomeLevels')}
                >
                  クリア
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(IncomeLevel).map((incomeLevel) => (
                  <label key={incomeLevel} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.incomeLevels?.includes(incomeLevel) || false}
                      onChange={(e) => handleFilterChange('incomeLevels', incomeLevel, e.target.checked)}
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

            {showAdvanced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  職業
                </label>
                <input
                  type="text"
                  placeholder="例: エンジニア, デザイナー, マーケター"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const occupations = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    onFiltersChange({ ...filters, occupation: occupations })
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Behavioral Filters */}
        {activeSection === 'behavioral' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                言語
              </label>
              <input
                type="text"
                placeholder="例: 日本語, 英語, 中国語"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const languages = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  onFiltersChange({ ...filters, languages })
                }}
              />
            </div>

            <div className="text-center text-gray-500 py-8">
              <p>行動フィルターは今後のアップデートで追加予定です</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Combinations */}
      {filterCombinations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold mb-3">推奨フィルター組み合わせ</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filterCombinations.slice(0, 6).map((combination) => (
              <div
                key={combination.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => onFiltersChange(combination.filters)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-medium text-sm">{combination.name}</h5>
                  <span className="text-xs text-gray-500">
                    {combination.estimatedSegmentSize.toLocaleString()}人
                  </span>
                </div>
                <p className="text-xs text-gray-600">{combination.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold mb-3">保存済みフィルター</h4>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((savedFilter) => (
              <div key={savedFilter.id} className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadFilter?.(savedFilter.id)}
                  className="text-xs"
                >
                  {savedFilter.name}
                  {savedFilter.isDefault && (
                    <span className="ml-1 text-blue-600">★</span>
                  )}
                  <span className="ml-1 text-gray-500">({savedFilter.usageCount})</span>
                </Button>
                {onDeleteFilter && (
                  <button
                    onClick={() => onDeleteFilter(savedFilter.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
        <div className="text-sm text-gray-600">
          {getActiveFiltersCount() > 0 && (
            <span>
              {getActiveFiltersCount()} 個のフィルターが適用されています
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onSaveFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              フィルターを保存
            </Button>
          )}
        </div>
      </div>

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
                  value={saveDialogData.name}
                  onChange={(e) => setSaveDialogData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 北米の若年層高所得者"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={saveDialogData.description}
                  onChange={(e) => setSaveDialogData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="このフィルターの用途や特徴を説明してください"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={saveDialogData.isDefault}
                    onChange={(e) => setSaveDialogData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">デフォルトフィルターに設定</span>
                </label>
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
                onClick={handleSaveFilter}
                disabled={!saveDialogData.name.trim()}
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