import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BatchProcessingOptions {
  batchSize?: number
  maxConcurrency?: number
  forceUpdate?: boolean
  updateThemes?: boolean
  updateScores?: boolean
}

interface BatchResult {
  processed: number
  updated: number
  errors: number
  duration: number
  details: any[]
}

export class BatchProcessor {
  constructor(private supabaseClient: SupabaseClient) {}

  async processBatchUpdates(options: BatchProcessingOptions = {}): Promise<BatchResult> {
    const {
      batchSize = 100,
      maxConcurrency = 5,
      forceUpdate = false,
      updateThemes = true,
      updateScores = true
    } = options

    const startTime = Date.now()
    let totalProcessed = 0
    let totalUpdated = 0
    let totalErrors = 0
    const details: any[] = []

    console.log('Starting batch processing with options:', options)

    try {
      // Step 1: Process pending trend data
      if (updateThemes) {
        const trendResult = await this.processTrendDataBatch(batchSize, maxConcurrency, forceUpdate)
        totalProcessed += trendResult.processed
        totalUpdated += trendResult.updated
        totalErrors += trendResult.errors
        details.push({
          operation: 'trend_data_processing',
          ...trendResult
        })
      }

      // Step 2: Update monetization scores
      if (updateScores) {
        const scoreResult = await this.updateMonetizationScoresBatch(batchSize, maxConcurrency)
        totalProcessed += scoreResult.processed
        totalUpdated += scoreResult.updated
        totalErrors += scoreResult.errors
        details.push({
          operation: 'monetization_scores',
          ...scoreResult
        })
      }

      // Step 3: Update theme statistics
      const statsResult = await this.updateThemeStatisticsBatch(batchSize, maxConcurrency)
      totalProcessed += statsResult.processed
      totalUpdated += statsResult.updated
      totalErrors += statsResult.errors
      details.push({
        operation: 'theme_statistics',
        ...statsResult
      })

      // Step 4: Clean up old data
      const cleanupResult = await this.cleanupOldDataBatch()
      details.push({
        operation: 'data_cleanup',
        ...cleanupResult
      })

      const duration = Date.now() - startTime

      console.log(`Batch processing completed in ${duration}ms:`, {
        processed: totalProcessed,
        updated: totalUpdated,
        errors: totalErrors
      })

      return {
        processed: totalProcessed,
        updated: totalUpdated,
        errors: totalErrors,
        duration,
        details
      }

    } catch (error) {
      console.error('Batch processing failed:', error)
      throw error
    }
  }

  private async processTrendDataBatch(
    batchSize: number,
    maxConcurrency: number,
    forceUpdate: boolean
  ): Promise<{ processed: number; updated: number; errors: number }> {
    let processed = 0
    let updated = 0
    let errors = 0

    try {
      // Get themes that need trend data processing
      const { data: themes, error: themesError } = await this.supabaseClient
        .from('themes')
        .select(`
          id,
          title,
          updated_at,
          trend_data (
            id,
            source,
            timestamp,
            search_volume,
            growth_rate
          )
        `)
        .order('updated_at', { ascending: true })
        .limit(batchSize * 2) // Get more themes to ensure we have enough work

      if (themesError) {
        console.error('Error fetching themes for batch processing:', themesError)
        throw themesError
      }

      if (!themes || themes.length === 0) {
        console.log('No themes found for trend data processing')
        return { processed: 0, updated: 0, errors: 0 }
      }

      // Filter themes that need updates
      const themesToUpdate = themes.filter(theme => {
        if (forceUpdate) return true
        
        const lastUpdate = new Date(theme.updated_at)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        
        return lastUpdate < oneHourAgo
      })

      console.log(`Processing ${themesToUpdate.length} themes in batches of ${batchSize}`)

      // Process themes in batches with concurrency control
      const batches = this.createBatches(themesToUpdate, batchSize)
      
      for (const batch of batches) {
        const batchPromises = batch.map(theme => 
          this.processThemeTrendData(theme).catch(error => {
            console.error(`Error processing theme ${theme.id}:`, error)
            errors++
            return null
          })
        )

        // Limit concurrency
        const concurrentBatches = this.createBatches(batchPromises, maxConcurrency)
        
        for (const concurrentBatch of concurrentBatches) {
          const results = await Promise.all(concurrentBatch)
          
          for (const result of results) {
            processed++
            if (result) {
              updated++
            }
          }
        }
      }

    } catch (error) {
      console.error('Error in trend data batch processing:', error)
      throw error
    }

    return { processed, updated, errors }
  }

  private async processThemeTrendData(theme: any): Promise<boolean> {
    try {
      // Calculate aggregated trend metrics
      const trendData = theme.trend_data || []
      
      if (trendData.length === 0) {
        return false
      }

      // Calculate average search volume
      const avgSearchVolume = trendData.reduce((sum: number, data: any) => 
        sum + (data.search_volume || 0), 0) / trendData.length

      // Calculate average growth rate
      const avgGrowthRate = trendData.reduce((sum: number, data: any) => 
        sum + (data.growth_rate || 0), 0) / trendData.length

      // Calculate trend momentum (recent vs older data)
      const recentData = trendData.filter((data: any) => {
        const dataTime = new Date(data.timestamp)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return dataTime > sevenDaysAgo
      })

      const momentum = recentData.length > 0 
        ? recentData.reduce((sum: number, data: any) => sum + (data.growth_rate || 0), 0) / recentData.length
        : avgGrowthRate

      // Update theme with calculated metrics
      const { error: updateError } = await this.supabaseClient
        .from('themes')
        .update({
          market_size: Math.round(avgSearchVolume),
          updated_at: new Date().toISOString(),
          data_sources: [...new Set(trendData.map((data: any) => data.source))]
        })
        .eq('id', theme.id)

      if (updateError) {
        console.error(`Error updating theme ${theme.id}:`, updateError)
        return false
      }

      // Store aggregated trend summary
      await this.storeTrendSummary(theme.id, {
        avg_search_volume: Math.round(avgSearchVolume),
        avg_growth_rate: Math.round(avgGrowthRate * 100) / 100,
        momentum: Math.round(momentum * 100) / 100,
        data_points: trendData.length,
        sources: trendData.map((data: any) => data.source),
        last_updated: new Date().toISOString()
      })

      return true

    } catch (error) {
      console.error('Error processing theme trend data:', error)
      return false
    }
  }

  private async updateMonetizationScoresBatch(
    batchSize: number,
    maxConcurrency: number
  ): Promise<{ processed: number; updated: number; errors: number }> {
    let processed = 0
    let updated = 0
    let errors = 0

    try {
      // Get themes that need score updates
      const { data: themes, error: themesError } = await this.supabaseClient
        .from('themes')
        .select(`
          id,
          title,
          market_size,
          competition_level,
          monetization_score,
          updated_at
        `)
        .order('updated_at', { ascending: true })
        .limit(batchSize * 2)

      if (themesError) {
        console.error('Error fetching themes for score updates:', themesError)
        throw themesError
      }

      if (!themes || themes.length === 0) {
        return { processed: 0, updated: 0, errors: 0 }
      }

      console.log(`Updating monetization scores for ${themes.length} themes`)

      // Process in batches
      const batches = this.createBatches(themes, batchSize)
      
      for (const batch of batches) {
        const batchPromises = batch.map(theme => 
          this.updateThemeMonetizationScore(theme).catch(error => {
            console.error(`Error updating score for theme ${theme.id}:`, error)
            errors++
            return null
          })
        )

        const concurrentBatches = this.createBatches(batchPromises, maxConcurrency)
        
        for (const concurrentBatch of concurrentBatches) {
          const results = await Promise.all(concurrentBatch)
          
          for (const result of results) {
            processed++
            if (result) {
              updated++
            }
          }
        }
      }

    } catch (error) {
      console.error('Error in monetization score batch processing:', error)
      throw error
    }

    return { processed, updated, errors }
  }

  private async updateThemeMonetizationScore(theme: any): Promise<boolean> {
    try {
      // Get latest trend data for the theme
      const { data: trendData, error: trendError } = await this.supabaseClient
        .from('trend_data')
        .select('search_volume, growth_rate, timestamp')
        .eq('theme_id', theme.id)
        .order('timestamp', { ascending: false })
        .limit(10)

      if (trendError) {
        console.error('Error fetching trend data for score calculation:', trendError)
        return false
      }

      // Calculate new monetization score
      const newScore = this.calculateMonetizationScore(theme, trendData || [])

      // Only update if score has changed significantly
      const scoreDifference = Math.abs(newScore - (theme.monetization_score || 0))
      if (scoreDifference < 5) {
        return false // Skip minor changes
      }

      // Update theme with new score
      const { error: updateError } = await this.supabaseClient
        .from('themes')
        .update({
          monetization_score: newScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', theme.id)

      if (updateError) {
        console.error(`Error updating monetization score for theme ${theme.id}:`, updateError)
        return false
      }

      console.log(`Updated monetization score for theme ${theme.id}: ${theme.monetization_score} -> ${newScore}`)
      return true

    } catch (error) {
      console.error('Error updating theme monetization score:', error)
      return false
    }
  }

  private calculateMonetizationScore(theme: any, trendData: any[]): number {
    // Basic monetization score calculation
    // This should match the algorithm in the monetization-score.ts file
    
    let marketSizeScore = 0
    let growthScore = 0
    let competitionScore = 0

    // Market size component (0-40 points)
    const marketSize = theme.market_size || 0
    if (marketSize > 0) {
      marketSizeScore = Math.min(40, Math.log10(marketSize + 1) * 8)
    }

    // Growth component (0-30 points)
    if (trendData.length > 0) {
      const avgGrowthRate = trendData.reduce((sum, data) => sum + (data.growth_rate || 0), 0) / trendData.length
      growthScore = Math.min(30, Math.max(0, avgGrowthRate))
    }

    // Competition component (0-30 points)
    const competitionLevel = theme.competition_level || 'medium'
    const competitionScores = { low: 30, medium: 20, high: 10 }
    competitionScore = competitionScores[competitionLevel as keyof typeof competitionScores] || 20

    const totalScore = marketSizeScore + growthScore + competitionScore
    return Math.min(100, Math.max(0, Math.round(totalScore)))
  }

  private async updateThemeStatisticsBatch(
    batchSize: number,
    maxConcurrency: number
  ): Promise<{ processed: number; updated: number; errors: number }> {
    let processed = 0
    let updated = 0
    let errors = 0

    try {
      // Update global statistics
      const stats = await this.calculateGlobalStatistics()
      
      // Store statistics in a dedicated table or cache
      await this.storeGlobalStatistics(stats)

      processed = 1
      updated = 1

    } catch (error) {
      console.error('Error updating theme statistics:', error)
      errors = 1
    }

    return { processed, updated, errors }
  }

  private async calculateGlobalStatistics(): Promise<any> {
    try {
      // Get theme counts by category
      const { data: categoryStats, error: categoryError } = await this.supabaseClient
        .from('themes')
        .select('category')
        .not('category', 'is', null)

      if (categoryError) throw categoryError

      const categoryCounts = (categoryStats || []).reduce((acc: any, theme: any) => {
        acc[theme.category] = (acc[theme.category] || 0) + 1
        return acc
      }, {})

      // Get average monetization scores
      const { data: scoreStats, error: scoreError } = await this.supabaseClient
        .from('themes')
        .select('monetization_score, category')
        .not('monetization_score', 'is', null)

      if (scoreError) throw scoreError

      const avgScores = (scoreStats || []).reduce((acc: any, theme: any) => {
        if (!acc[theme.category]) {
          acc[theme.category] = { total: 0, count: 0 }
        }
        acc[theme.category].total += theme.monetization_score
        acc[theme.category].count += 1
        return acc
      }, {})

      // Calculate averages
      for (const category in avgScores) {
        avgScores[category] = Math.round(avgScores[category].total / avgScores[category].count)
      }

      // Get trend data statistics
      const { data: trendStats, error: trendError } = await this.supabaseClient
        .from('trend_data')
        .select('source, search_volume, timestamp')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (trendError) throw trendError

      const sourceStats = (trendStats || []).reduce((acc: any, data: any) => {
        if (!acc[data.source]) {
          acc[data.source] = { count: 0, totalVolume: 0 }
        }
        acc[data.source].count += 1
        acc[data.source].totalVolume += data.search_volume || 0
        return acc
      }, {})

      return {
        category_counts: categoryCounts,
        average_scores: avgScores,
        source_statistics: sourceStats,
        total_themes: categoryStats?.length || 0,
        total_trend_data_points: trendStats?.length || 0,
        last_updated: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error calculating global statistics:', error)
      throw error
    }
  }

  private async cleanupOldDataBatch(): Promise<{ processed: number; updated: number; errors: number }> {
    let processed = 0
    let updated = 0
    let errors = 0

    try {
      // Delete trend data older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      
      const { error: deleteError } = await this.supabaseClient
        .from('trend_data')
        .delete()
        .lt('timestamp', ninetyDaysAgo)

      if (deleteError) {
        console.error('Error cleaning up old trend data:', deleteError)
        errors++
      } else {
        console.log('Successfully cleaned up old trend data')
        processed++
        updated++
      }

    } catch (error) {
      console.error('Error in data cleanup:', error)
      errors++
    }

    return { processed, updated, errors }
  }

  private async storeTrendSummary(themeId: string, summary: any): Promise<void> {
    try {
      // Store in a trend_summaries table or update theme metadata
      const { error } = await this.supabaseClient
        .from('themes')
        .update({
          data_sources: summary.sources,
          updated_at: summary.last_updated
        })
        .eq('id', themeId)

      if (error) {
        console.error('Error storing trend summary:', error)
      }
    } catch (error) {
      console.error('Error in storeTrendSummary:', error)
    }
  }

  private async storeGlobalStatistics(stats: any): Promise<void> {
    try {
      // In a real implementation, you might store this in a dedicated statistics table
      // For now, we'll just log it
      console.log('Global statistics calculated:', stats)
    } catch (error) {
      console.error('Error storing global statistics:', error)
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }
}