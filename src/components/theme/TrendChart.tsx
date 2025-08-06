'use client'

import { useMemo } from 'react'
import type { Theme, TrendData } from '@/types'
import Card from '@/components/common/Card'

interface TrendChartProps {
  theme: Theme
  trendData: TrendData[]
  className?: string
}

export function TrendChart({ theme, trendData, className = '' }: TrendChartProps) {
  // Process trend data for visualization
  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return {
        labels: [],
        datasets: [],
        isEmpty: true
      }
    }

    // Sort by timestamp
    const sortedData = [...trendData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Group by source
    const groupedBySource = sortedData.reduce((acc, item) => {
      if (!acc[item.source]) {
        acc[item.source] = []
      }
      acc[item.source].push(item)
      return acc
    }, {} as Record<string, TrendData[]>)

    // Create labels (dates)
    const allDates = [...new Set(sortedData.map(item => 
      new Date(item.timestamp).toLocaleDateString('ja-JP')
    ))].sort()

    // Create datasets for each source
    const datasets = Object.entries(groupedBySource).map(([source, data], index) => {
      const colors = [
        { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)' }, // blue
        { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgb(16, 185, 129)' }, // green
        { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgb(245, 158, 11)' }, // yellow
        { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)' }, // red
        { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgb(139, 92, 246)' }, // purple
      ]
      
      const color = colors[index % colors.length]
      
      return {
        label: source,
        data: data.map(item => ({
          x: new Date(item.timestamp).toLocaleDateString('ja-JP'),
          y: item.searchVolume,
          growthRate: item.growthRate
        })),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    })

    return {
      labels: allDates,
      datasets,
      isEmpty: false
    }
  }, [trendData])

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return {
        totalDataPoints: 0,
        averageSearchVolume: 0,
        averageGrowthRate: 0,
        latestUpdate: null,
        sources: []
      }
    }

    const totalDataPoints = trendData.length
    const averageSearchVolume = trendData.reduce((sum, item) => sum + (item.searchVolume || 0), 0) / totalDataPoints
    const averageGrowthRate = trendData.reduce((sum, item) => sum + (item.growthRate || 0), 0) / totalDataPoints
    const latestUpdate = trendData.reduce((latest, item) => {
      const itemDate = new Date(item.timestamp)
      return !latest || itemDate > latest ? itemDate : latest
    }, null as Date | null)
    const sources = [...new Set(trendData.map(item => item.source))]

    return {
      totalDataPoints,
      averageSearchVolume: Math.round(averageSearchVolume),
      averageGrowthRate: Math.round(averageGrowthRate * 100) / 100,
      latestUpdate,
      sources
    }
  }, [trendData])

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Get source display name
  const getSourceDisplayName = (source: string) => {
    const names: Record<string, string> = {
      google_trends: 'Google Trends',
      reddit: 'Reddit',
      twitter: 'Twitter',
      product_hunt: 'Product Hunt',
      github: 'GitHub',
    }
    return names[source] || source
  }

  // Simple SVG chart implementation
  const renderSimpleChart = () => {
    if (chartData.isEmpty || chartData.datasets.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>トレンドデータがありません</p>
            <p className="text-sm">データが収集されると、ここにグラフが表示されます</p>
          </div>
        </div>
      )
    }

    // Get all data points for scaling
    const allValues = chartData.datasets.flatMap(dataset => dataset.data.map(point => point.y))
    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const valueRange = maxValue - minValue || 1

    const chartWidth = 600
    const chartHeight = 200
    const padding = 40

    return (
      <div className="h-64 flex items-center justify-center">
        <svg width={chartWidth} height={chartHeight + padding * 2} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + chartHeight - (ratio * chartHeight)
            const value = minValue + (ratio * valueRange)
            return (
              <g key={index}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {formatNumber(Math.round(value))}
                </text>
              </g>
            )
          })}

          {/* Data lines */}
          {chartData.datasets.map((dataset, datasetIndex) => {
            if (dataset.data.length < 2) return null

            const points = dataset.data.map((point, pointIndex) => {
              const x = padding + (pointIndex / (dataset.data.length - 1)) * (chartWidth - padding * 2)
              const y = padding + chartHeight - ((point.y - minValue) / valueRange) * chartHeight
              return { x, y, value: point.y }
            })

            const pathData = points.reduce((path, point, index) => {
              if (index === 0) {
                return `M ${point.x} ${point.y}`
              }
              return `${path} L ${point.x} ${point.y}`
            }, '')

            return (
              <g key={datasetIndex}>
                {/* Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={dataset.borderColor}
                  strokeWidth={2}
                />
                
                {/* Data points */}
                {points.map((point, pointIndex) => (
                  <circle
                    key={pointIndex}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill={dataset.borderColor}
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${dataset.label}: ${formatNumber(point.value)}`}</title>
                  </circle>
                ))}
              </g>
            )
          })}

          {/* X-axis labels */}
          {chartData.labels.map((label, index) => {
            const x = padding + (index / (chartData.labels.length - 1)) * (chartWidth - padding * 2)
            return (
              <text
                key={index}
                x={x}
                y={chartHeight + padding + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">トレンド推移</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {trendStats.latestUpdate && (
            <span>
              最終更新: {trendStats.latestUpdate.toLocaleDateString('ja-JP')}
            </span>
          )}
          <span>
            データ数: {trendStats.totalDataPoints}
          </span>
        </div>
      </div>

      {/* Chart */}
      {renderSimpleChart()}

      {/* Legend */}
      {!chartData.isEmpty && chartData.datasets.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4">
          {chartData.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: dataset.borderColor }}
              />
              <span className="text-sm text-gray-700">
                {getSourceDisplayName(dataset.label)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">平均検索ボリューム</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(trendStats.averageSearchVolume)}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">平均成長率</div>
          <div className={`text-2xl font-bold ${
            trendStats.averageGrowthRate > 0 ? 'text-green-600' : 
            trendStats.averageGrowthRate < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {trendStats.averageGrowthRate > 0 ? '+' : ''}{trendStats.averageGrowthRate}%
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">データソース数</div>
          <div className="text-2xl font-bold text-gray-900">
            {trendStats.sources.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {trendStats.sources.map(source => getSourceDisplayName(source)).join(', ')}
          </div>
        </div>
      </div>
    </Card>
  )
}