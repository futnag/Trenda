import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AnalysisOptions {
  analyzeNewThemes?: boolean
  updateExistingThemes?: boolean
  calculateCompetition?: boolean
  updateRecommendations?: boolean
}

interface ThemeAnalysisResult {
  themes_analyzed: number
  themes_updated: number
  new_insights: number
  errors: number
  details: any[]
}

export class ThemeAnalyzer {
  constructor(private supabaseClient: SupabaseClient) {}

  async analyzeAndUpdateThemes(options: AnalysisOptions = {}): Promise<ThemeAnalysisResult> {
    const {
      analyzeNewThemes = true,
      updateExistingThemes = true,
      calculateCompetition = true,
      updateRecommendations = true
    } = options

    let themesAnalyzed = 0
    let themesUpdated = 0
    let newInsights = 0
    let errors = 0
    const details: any[] = []

    console.log('Starting theme analysis with options:', options)

    try {
      // Step 1: Analyze new themes
      if (analyzeNewThemes) {
        const newThemeResult = await this.analyzeNewThemes()
        themesAnalyzed += newThemeResult.analyzed
        themesUpdated += newThemeResult.updated
        newInsights += newThemeResult.insights
        errors += newThemeResult.errors
        details.push({
          operation: 'new_theme_analysis',
          ...newThemeResult
        })
      }

      // Step 2: Update existing themes with new data
      if (updateExistingThemes) {
        const existingThemeResult = await this.updateExistingThemes()
        themesAnalyzed += existingThemeResult.analyzed
        themesUpdated += existingThemeResult.updated
        newInsights += existingThemeResult.insights
        errors += existingThemeResult.errors
        details.push({
          operation: 'existing_theme_update',
          ...existingThemeResult
        })
      }

      // Step 3: Calculate competition analysis
      if (calculateCompetition) {
        const competitionResult = await this.analyzeCompetition()
        themesAnalyzed += competitionResult.analyzed
        themesUpdated += competitionResult.updated
        newInsights += competitionResult.insights
        errors += competitionResult.errors
        details.push({
          operation: 'competition_analysis',
          ...competitionResult
        })
      }

      // Step 4: Update theme recommendations
      if (updateRecommendations) {
        const recommendationResult = await this.updateRecommendations()
        newInsights += recommendationResult.insights
        errors += recommendationResult.errors
        details.push({
          operation: 'recommendation_update',
          ...recommendationResult
        })
      }

      console.log(`Theme analysis completed: ${themesAnalyzed} analyzed, ${themesUpdated} updated, ${newInsights} insights, ${errors} errors`)

      return {
        themes_analyzed: themesAnalyzed,
        themes_updated: themesUpdated,
        new_insights: newInsights,
        errors,
        details
      }

    } catch (error) {
      console.error('Theme analysis failed:', error)
      throw error
    }
  }

  private async analyzeNewThemes(): Promise<{
    analyzed: number
    updated: number
    insights: number
    errors: number
  }> {
    let analyzed = 0
    let updated = 0
    let insights = 0
    let errors = 0

    try {
      // Get themes created in the last 24 hours that haven't been fully analyzed
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: newThemes, error: themesError } = await this.supabaseClient
        .from('themes')
        .select(`
          id,
          title,
          description,
          category,
          monetization_score,
          market_size,
          competition_level,
          technical_difficulty,
          created_at,
          trend_data (
            id,
            source,
            search_volume,
            growth_rate,
            geographic_data,
            demographic_data,
            timestamp
          )
        `)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })

      if (themesError) {
        console.error('Error fetching new themes:', themesError)
        throw themesError
      }

      if (!newThemes || newThemes.length === 0) {
        console.log('No new themes to analyze')
        return { analyzed: 0, updated: 0, insights: 0, errors: 0 }
      }

      console.log(`Analyzing ${newThemes.length} new themes`)

      for (const theme of newThemes) {
        try {
          analyzed++

          // Perform comprehensive analysis
          const analysis = await this.performThemeAnalysis(theme)
          
          if (analysis.shouldUpdate) {
            // Update theme with analysis results
            const { error: updateError } = await this.supabaseClient
              .from('themes')
              .update({
                monetization_score: analysis.monetizationScore,
                market_size: analysis.marketSize,
                competition_level: analysis.competitionLevel,
                technical_difficulty: analysis.technicalDifficulty,
                estimated_revenue_min: analysis.revenueRange.min,
                estimated_revenue_max: analysis.revenueRange.max,
                updated_at: new Date().toISOString()
              })
              .eq('id', theme.id)

            if (updateError) {
              console.error(`Error updating theme ${theme.id}:`, updateError)
              errors++
            } else {
              updated++
              console.log(`Updated analysis for theme: ${theme.title}`)
            }
          }

          // Store insights if any were discovered
          if (analysis.insights && analysis.insights.length > 0) {
            await this.storeThemeInsights(theme.id, analysis.insights)
            insights += analysis.insights.length
          }

        } catch (themeError) {
          console.error(`Error analyzing theme ${theme.id}:`, themeError)
          errors++
        }
      }

    } catch (error) {
      console.error('Error in new theme analysis:', error)
      throw error
    }

    return { analyzed, updated, insights, errors }
  }

  private async updateExistingThemes(): Promise<{
    analyzed: number
    updated: number
    insights: number
    errors: number
  }> {
    let analyzed = 0
    let updated = 0
    let insights = 0
    let errors = 0

    try {
      // Get themes that haven't been updated in the last 6 hours but have new trend data
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data: themes, error: themesError } = await this.supabaseClient
        .from('themes')
        .select(`
          id,
          title,
          monetization_score,
          market_size,
          updated_at,
          trend_data!inner (
            id,
            search_volume,
            growth_rate,
            timestamp
          )
        `)
        .lt('updated_at', sixHoursAgo)
        .gte('trend_data.timestamp', oneHourAgo)
        .limit(50) // Process in batches

      if (themesError) {
        console.error('Error fetching themes for update:', themesError)
        throw themesError
      }

      if (!themes || themes.length === 0) {
        console.log('No existing themes need updating')
        return { analyzed: 0, updated: 0, insights: 0, errors: 0 }
      }

      console.log(`Updating analysis for ${themes.length} existing themes`)

      for (const theme of themes) {
        try {
          analyzed++

          // Re-analyze theme with latest data
          const analysis = await this.performThemeAnalysis(theme)
          
          // Check if significant changes warrant an update
          const significantChange = this.hasSignificantChange(theme, analysis)
          
          if (significantChange) {
            const { error: updateError } = await this.supabaseClient
              .from('themes')
              .update({
                monetization_score: analysis.monetizationScore,
                market_size: analysis.marketSize,
                updated_at: new Date().toISOString()
              })
              .eq('id', theme.id)

            if (updateError) {
              console.error(`Error updating theme ${theme.id}:`, updateError)
              errors++
            } else {
              updated++
              console.log(`Updated existing theme: ${theme.title}`)
            }
          }

          // Store new insights
          if (analysis.insights && analysis.insights.length > 0) {
            await this.storeThemeInsights(theme.id, analysis.insights)
            insights += analysis.insights.length
          }

        } catch (themeError) {
          console.error(`Error updating theme ${theme.id}:`, themeError)
          errors++
        }
      }

    } catch (error) {
      console.error('Error in existing theme update:', error)
      throw error
    }

    return { analyzed, updated, insights, errors }
  }

  private async performThemeAnalysis(theme: any): Promise<{
    shouldUpdate: boolean
    monetizationScore: number
    marketSize: number
    competitionLevel: string
    technicalDifficulty: string
    revenueRange: { min: number; max: number }
    insights: any[]
  }> {
    const trendData = theme.trend_data || []
    const insights: any[] = []

    // Calculate market size from trend data
    const marketSize = this.calculateMarketSize(trendData)
    
    // Calculate monetization score
    const monetizationScore = this.calculateMonetizationScore(theme, trendData)
    
    // Determine competition level
    const competitionLevel = await this.determineCompetitionLevel(theme)
    
    // Assess technical difficulty
    const technicalDifficulty = this.assessTechnicalDifficulty(theme)
    
    // Estimate revenue range
    const revenueRange = this.estimateRevenueRange(marketSize, monetizationScore, competitionLevel)

    // Generate insights
    if (trendData.length > 0) {
      insights.push(...this.generateTrendInsights(theme, trendData))
    }

    insights.push(...this.generateMarketInsights(theme, marketSize, competitionLevel))

    // Determine if update is needed
    const shouldUpdate = this.shouldUpdateTheme(theme, {
      monetizationScore,
      marketSize,
      competitionLevel,
      technicalDifficulty
    })

    return {
      shouldUpdate,
      monetizationScore,
      marketSize,
      competitionLevel,
      technicalDifficulty,
      revenueRange,
      insights
    }
  }

  private calculateMarketSize(trendData: any[]): number {
    if (trendData.length === 0) return 0

    // Calculate weighted average of search volumes
    const totalVolume = trendData.reduce((sum, data) => sum + (data.search_volume || 0), 0)
    const avgVolume = totalVolume / trendData.length

    // Apply recency weighting
    const now = Date.now()
    const weightedVolume = trendData.reduce((sum, data) => {
      const age = now - new Date(data.timestamp).getTime()
      const ageInDays = age / (24 * 60 * 60 * 1000)
      const weight = Math.max(0.1, 1 - (ageInDays / 30)) // Decay over 30 days
      return sum + (data.search_volume || 0) * weight
    }, 0) / trendData.length

    return Math.round(Math.max(avgVolume, weightedVolume))
  }

  private calculateMonetizationScore(theme: any, trendData: any[]): number {
    let score = 0

    // Market size component (0-40 points)
    const marketSize = this.calculateMarketSize(trendData)
    const marketScore = Math.min(40, Math.log10(marketSize + 1) * 8)
    score += marketScore

    // Growth trend component (0-30 points)
    if (trendData.length > 0) {
      const avgGrowthRate = trendData.reduce((sum, data) => sum + (data.growth_rate || 0), 0) / trendData.length
      const growthScore = Math.min(30, Math.max(0, avgGrowthRate))
      score += growthScore
    }

    // Category bonus (0-15 points)
    const categoryBonuses: Record<string, number> = {
      productivity: 15,
      finance: 12,
      health: 10,
      education: 8,
      social: 6,
      entertainment: 4
    }
    score += categoryBonuses[theme.category] || 5

    // Data quality bonus (0-15 points)
    const dataQualityScore = Math.min(15, trendData.length * 2)
    score += dataQualityScore

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  private async determineCompetitionLevel(theme: any): Promise<string> {
    try {
      // This is a simplified version - in production you'd analyze actual competitors
      const marketSize = theme.market_size || 0
      
      // Simple heuristic based on market size and category
      if (marketSize > 100000) {
        return 'high'
      } else if (marketSize > 10000) {
        return 'medium'
      } else {
        return 'low'
      }
    } catch (error) {
      console.error('Error determining competition level:', error)
      return 'medium'
    }
  }

  private assessTechnicalDifficulty(theme: any): string {
    // Simple assessment based on category and keywords
    const title = (theme.title || '').toLowerCase()
    const description = (theme.description || '').toLowerCase()
    
    const complexKeywords = ['ai', 'machine learning', 'blockchain', 'crypto', 'api', 'integration', 'real-time']
    const simpleKeywords = ['todo', 'note', 'tracker', 'calculator', 'timer', 'reminder']
    
    const hasComplexKeywords = complexKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    )
    
    const hasSimpleKeywords = simpleKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    )

    if (hasComplexKeywords) {
      return 'advanced'
    } else if (hasSimpleKeywords) {
      return 'beginner'
    } else {
      return 'intermediate'
    }
  }

  private estimateRevenueRange(marketSize: number, monetizationScore: number, competitionLevel: string): {
    min: number
    max: number
  } {
    // Base revenue estimation
    const baseRevenue = Math.log10(marketSize + 1) * 1000
    
    // Score multiplier
    const scoreMultiplier = monetizationScore / 100
    
    // Competition adjustment
    const competitionMultipliers = { low: 1.5, medium: 1.0, high: 0.6 }
    const competitionMultiplier = competitionMultipliers[competitionLevel as keyof typeof competitionMultipliers] || 1.0

    const estimatedRevenue = baseRevenue * scoreMultiplier * competitionMultiplier

    return {
      min: Math.round(estimatedRevenue * 0.3),
      max: Math.round(estimatedRevenue * 2.0)
    }
  }

  private generateTrendInsights(theme: any, trendData: any[]): any[] {
    const insights: any[] = []

    // Growth trend insight
    const recentData = trendData.filter(data => {
      const dataTime = new Date(data.timestamp)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return dataTime > sevenDaysAgo
    })

    if (recentData.length > 0) {
      const avgRecentGrowth = recentData.reduce((sum, data) => sum + (data.growth_rate || 0), 0) / recentData.length
      
      if (avgRecentGrowth > 50) {
        insights.push({
          type: 'high_growth',
          title: 'High Growth Trend',
          description: `This theme is experiencing rapid growth with an average growth rate of ${avgRecentGrowth.toFixed(1)}% in the past week.`,
          confidence: 0.8,
          impact: 'positive'
        })
      } else if (avgRecentGrowth < -20) {
        insights.push({
          type: 'declining_trend',
          title: 'Declining Interest',
          description: `Interest in this theme is declining with a ${Math.abs(avgRecentGrowth).toFixed(1)}% decrease in the past week.`,
          confidence: 0.7,
          impact: 'negative'
        })
      }
    }

    // Data source diversity insight
    const sources = [...new Set(trendData.map(data => data.source))]
    if (sources.length >= 3) {
      insights.push({
        type: 'multi_source_validation',
        title: 'Multi-Source Validation',
        description: `This theme is trending across ${sources.length} different platforms: ${sources.join(', ')}.`,
        confidence: 0.9,
        impact: 'positive'
      })
    }

    return insights
  }

  private generateMarketInsights(theme: any, marketSize: number, competitionLevel: string): any[] {
    const insights: any[] = []

    // Market size insight
    if (marketSize > 50000 && competitionLevel === 'low') {
      insights.push({
        type: 'blue_ocean',
        title: 'Blue Ocean Opportunity',
        description: `Large market size (${marketSize.toLocaleString()}) with low competition presents a significant opportunity.`,
        confidence: 0.8,
        impact: 'positive'
      })
    }

    // Niche market insight
    if (marketSize < 10000 && marketSize > 1000) {
      insights.push({
        type: 'niche_market',
        title: 'Niche Market Opportunity',
        description: `This represents a focused niche market that could be ideal for specialized solutions.`,
        confidence: 0.7,
        impact: 'neutral'
      })
    }

    return insights
  }

  private shouldUpdateTheme(theme: any, newAnalysis: any): boolean {
    // Check for significant changes
    const scoreDiff = Math.abs((newAnalysis.monetizationScore || 0) - (theme.monetization_score || 0))
    const sizeDiff = Math.abs((newAnalysis.marketSize || 0) - (theme.market_size || 0))
    
    return scoreDiff >= 10 || sizeDiff >= 1000 || newAnalysis.competitionLevel !== theme.competition_level
  }

  private hasSignificantChange(theme: any, analysis: any): boolean {
    const scoreDiff = Math.abs(analysis.monetizationScore - (theme.monetization_score || 0))
    const sizeDiff = Math.abs(analysis.marketSize - (theme.market_size || 0))
    
    return scoreDiff >= 5 || sizeDiff >= 500
  }

  private async storeThemeInsights(themeId: string, insights: any[]): Promise<void> {
    try {
      const insightRecords = insights.map(insight => ({
        theme_id: themeId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        impact: insight.impact,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabaseClient
        .from('theme_insights')
        .upsert(insightRecords, {
          onConflict: 'theme_id,type',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error storing theme insights:', error)
      } else {
        console.log(`Stored ${insights.length} insights for theme ${themeId}`)
      }
    } catch (error) {
      console.error('Error in storeThemeInsights:', error)
    }
  }

  private async analyzeCompetition(): Promise<{
    analyzed: number
    updated: number
    insights: number
    errors: number
  }> {
    // Placeholder for competition analysis
    // In a real implementation, this would analyze competitor data
    console.log('Competition analysis would be performed here')
    return { analyzed: 0, updated: 0, insights: 0, errors: 0 }
  }

  private async updateRecommendations(): Promise<{
    insights: number
    errors: number
  }> {
    // Placeholder for recommendation updates
    // In a real implementation, this would update user recommendations
    console.log('Recommendation updates would be performed here')
    return { insights: 0, errors: 0 }
  }
}