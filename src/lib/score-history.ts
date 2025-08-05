import { supabase } from './supabase'
import type { MonetizationFactors } from '@/types'
import type { ScoreHistoryEntry, ScoreAnalysis } from './monetization-score'
import { analyzeScoreTrend, createScoreHistoryEntry, getRecentScoreHistory } from './monetization-score'

// =============================================================================
// DATABASE SCHEMA FOR SCORE HISTORY
// =============================================================================

export interface ScoreHistoryRecord {
  id: string
  theme_id: string
  score: number
  factors: MonetizationFactors
  metadata: Record<string, unknown> | null
  created_at: string
}

// =============================================================================
// SCORE HISTORY DATABASE OPERATIONS
// =============================================================================

/**
 * Saves a score history entry to the database
 */
export async function saveScoreHistory(
  themeId: string,
  score: number,
  factors: MonetizationFactors,
  metadata?: Record<string, unknown>
): Promise<ScoreHistoryEntry | null> {
  try {
    const entry = createScoreHistoryEntry(score, factors, metadata)
    
    const { data, error } = await supabase
      .from('score_history')
      .insert({
        theme_id: themeId,
        score: entry.score,
        factors: entry.factors,
        metadata: entry.metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving score history:', error)
      return null
    }

    return {
      score: data.score,
      factors: data.factors,
      timestamp: data.created_at,
      metadata: data.metadata || undefined,
    }
  } catch (error) {
    console.error('Error saving score history:', error)
    return null
  }
}

/**
 * Retrieves score history for a theme
 */
export async function getScoreHistory(
  themeId: string,
  limit: number = 100
): Promise<ScoreHistoryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('score_history')
      .select('*')
      .eq('theme_id', themeId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching score history:', error)
      return []
    }

    return data.map((record: ScoreHistoryRecord) => ({
      score: record.score,
      factors: record.factors,
      timestamp: record.created_at,
      metadata: record.metadata || undefined,
    }))
  } catch (error) {
    console.error('Error fetching score history:', error)
    return []
  }
}

/**
 * Retrieves recent score history for trend analysis
 */
export async function getRecentScoreHistoryFromDB(
  themeId: string,
  days: number = 30
): Promise<ScoreHistoryEntry[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('score_history')
      .select('*')
      .eq('theme_id', themeId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recent score history:', error)
      return []
    }

    return data.map((record: ScoreHistoryRecord) => ({
      score: record.score,
      factors: record.factors,
      timestamp: record.created_at,
      metadata: record.metadata || undefined,
    }))
  } catch (error) {
    console.error('Error fetching recent score history:', error)
    return []
  }
}

/**
 * Analyzes score trend for a theme using database history
 */
export async function analyzeThemeScoreTrend(
  themeId: string,
  currentScore: number,
  currentFactors: MonetizationFactors
): Promise<ScoreAnalysis | null> {
  try {
    const history = await getRecentScoreHistoryFromDB(themeId)
    return analyzeScoreTrend(currentScore, currentFactors, history)
  } catch (error) {
    console.error('Error analyzing score trend:', error)
    return null
  }
}

/**
 * Gets score statistics for a theme
 */
export async function getScoreStatistics(themeId: string): Promise<{
  current: number | null
  average: number
  min: number
  max: number
  totalEntries: number
  firstRecorded: string | null
  lastRecorded: string | null
} | null> {
  try {
    const { data, error } = await supabase
      .from('score_history')
      .select('score, created_at')
      .eq('theme_id', themeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching score statistics:', error)
      return null
    }

    if (data.length === 0) {
      return {
        current: null,
        average: 0,
        min: 0,
        max: 0,
        totalEntries: 0,
        firstRecorded: null,
        lastRecorded: null,
      }
    }

    const scores = data.map(record => record.score)
    const current = scores[0] // Most recent score
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const min = Math.min(...scores)
    const max = Math.max(...scores)

    return {
      current,
      average: Math.round(average * 100) / 100,
      min,
      max,
      totalEntries: data.length,
      firstRecorded: data[data.length - 1].created_at,
      lastRecorded: data[0].created_at,
    }
  } catch (error) {
    console.error('Error calculating score statistics:', error)
    return null
  }
}

/**
 * Deletes old score history entries to manage database size
 */
export async function cleanupOldScoreHistory(
  retentionDays: number = 365
): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const { data, error } = await supabase
      .from('score_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up old score history:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error cleaning up old score history:', error)
    return 0
  }
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Saves score history for multiple themes
 */
export async function saveBatchScoreHistory(
  entries: Array<{
    themeId: string
    score: number
    factors: MonetizationFactors
    metadata?: Record<string, unknown>
  }>
): Promise<ScoreHistoryEntry[]> {
  try {
    const records = entries.map(entry => ({
      theme_id: entry.themeId,
      score: entry.score,
      factors: entry.factors,
      metadata: entry.metadata || null,
    }))

    const { data, error } = await supabase
      .from('score_history')
      .insert(records)
      .select()

    if (error) {
      console.error('Error saving batch score history:', error)
      return []
    }

    return data.map((record: ScoreHistoryRecord) => ({
      score: record.score,
      factors: record.factors,
      timestamp: record.created_at,
      metadata: record.metadata || undefined,
    }))
  } catch (error) {
    console.error('Error saving batch score history:', error)
    return []
  }
}

/**
 * Gets score history for multiple themes
 */
export async function getBatchScoreHistory(
  themeIds: string[],
  limit: number = 50
): Promise<Map<string, ScoreHistoryEntry[]>> {
  try {
    if (themeIds.length === 0) {
      return new Map()
    }

    const { data, error } = await supabase
      .from('score_history')
      .select('*')
      .in('theme_id', themeIds)
      .order('created_at', { ascending: false })
      .limit(limit * themeIds.length)

    if (error) {
      console.error('Error fetching batch score history:', error)
      return new Map()
    }

    const historyMap = new Map<string, ScoreHistoryEntry[]>()

    data.forEach((record: ScoreHistoryRecord) => {
      const entry: ScoreHistoryEntry = {
        score: record.score,
        factors: record.factors,
        timestamp: record.created_at,
        metadata: record.metadata || undefined,
      }

      if (!historyMap.has(record.theme_id)) {
        historyMap.set(record.theme_id, [])
      }
      historyMap.get(record.theme_id)!.push(entry)
    })

    // Limit entries per theme and sort by timestamp
    historyMap.forEach((entries, themeId) => {
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      historyMap.set(themeId, entries.slice(0, limit))
    })

    return historyMap
  } catch (error) {
    console.error('Error fetching batch score history:', error)
    return new Map()
  }
}

// =============================================================================
// TREND ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Gets themes with significant score changes
 */
export async function getThemesWithSignificantChanges(
  thresholdPercentage: number = 10,
  days: number = 7
): Promise<Array<{
  themeId: string
  currentScore: number
  previousScore: number
  changePercentage: number
  trend: 'increasing' | 'decreasing'
}>> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get recent scores grouped by theme
    const { data, error } = await supabase
      .from('score_history')
      .select('theme_id, score, created_at')
      .gte('created_at', cutoffDate.toISOString())
      .order('theme_id, created_at', { ascending: false })

    if (error) {
      console.error('Error fetching themes with significant changes:', error)
      return []
    }

    // Group by theme and analyze changes
    const themeGroups = new Map<string, Array<{ score: number; timestamp: string }>>()
    
    data.forEach(record => {
      if (!themeGroups.has(record.theme_id)) {
        themeGroups.set(record.theme_id, [])
      }
      themeGroups.get(record.theme_id)!.push({
        score: record.score,
        timestamp: record.created_at,
      })
    })

    const significantChanges: Array<{
      themeId: string
      currentScore: number
      previousScore: number
      changePercentage: number
      trend: 'increasing' | 'decreasing'
    }> = []

    themeGroups.forEach((scores, themeId) => {
      if (scores.length < 2) return

      // Sort by timestamp (most recent first)
      scores.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      const currentScore = scores[0].score
      const previousScore = scores[1].score
      
      if (previousScore === 0) return
      
      const changePercentage = ((currentScore - previousScore) / previousScore) * 100
      
      if (Math.abs(changePercentage) >= thresholdPercentage) {
        significantChanges.push({
          themeId,
          currentScore,
          previousScore,
          changePercentage,
          trend: changePercentage > 0 ? 'increasing' : 'decreasing',
        })
      }
    })

    return significantChanges.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage))
  } catch (error) {
    console.error('Error getting themes with significant changes:', error)
    return []
  }
}

/**
 * Gets top performing themes by average score
 */
export async function getTopPerformingThemes(
  limit: number = 10,
  days: number = 30
): Promise<Array<{
  themeId: string
  averageScore: number
  currentScore: number
  trend: 'increasing' | 'decreasing' | 'stable'
  entryCount: number
}>> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('score_history')
      .select('theme_id, score, created_at')
      .gte('created_at', cutoffDate.toISOString())
      .order('theme_id, created_at', { ascending: false })

    if (error) {
      console.error('Error fetching top performing themes:', error)
      return []
    }

    // Group by theme and calculate averages
    const themeStats = new Map<string, {
      scores: number[]
      timestamps: string[]
    }>()

    data.forEach(record => {
      if (!themeStats.has(record.theme_id)) {
        themeStats.set(record.theme_id, { scores: [], timestamps: [] })
      }
      const stats = themeStats.get(record.theme_id)!
      stats.scores.push(record.score)
      stats.timestamps.push(record.created_at)
    })

    const topThemes: Array<{
      themeId: string
      averageScore: number
      currentScore: number
      trend: 'increasing' | 'decreasing' | 'stable'
      entryCount: number
    }> = []

    themeStats.forEach((stats, themeId) => {
      if (stats.scores.length === 0) return

      const averageScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length
      
      // Sort by timestamp to get current and previous scores
      const sortedData = stats.scores
        .map((score, index) => ({ score, timestamp: stats.timestamps[index] }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      const currentScore = sortedData[0].score
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'

      if (sortedData.length > 1) {
        const previousScore = sortedData[1].score
        const change = ((currentScore - previousScore) / previousScore) * 100
        
        if (Math.abs(change) >= 2) {
          trend = change > 0 ? 'increasing' : 'decreasing'
        }
      }

      topThemes.push({
        themeId,
        averageScore: Math.round(averageScore * 100) / 100,
        currentScore,
        trend,
        entryCount: stats.scores.length,
      })
    })

    return topThemes
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting top performing themes:', error)
    return []
  }
}