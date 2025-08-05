import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RawTrendData {
  source: string
  search_volume: number
  growth_rate: number
  geographic_data: any
  demographic_data: any
  timestamp: string
  [key: string]: any
}

interface NormalizedTrendData {
  theme_id: string
  source: string
  search_volume: number
  growth_rate: number
  geographic_data: any
  demographic_data: any
  timestamp: string
  metadata: any
}

interface NormalizationOptions {
  validateData?: boolean
  enrichData?: boolean
  deduplicateData?: boolean
}

export class DataNormalizer {
  constructor(private supabaseClient: SupabaseClient) {}

  async normalizeCollectedData(
    rawData: RawTrendData[],
    options: NormalizationOptions = {}
  ): Promise<{
    normalized: NormalizedTrendData[]
    errors: any[]
    summary: any
  }> {
    const {
      validateData = true,
      enrichData = true,
      deduplicateData = true
    } = options

    const normalized: NormalizedTrendData[] = []
    const errors: any[] = []
    let processed = 0
    let skipped = 0

    console.log(`Starting normalization of ${rawData.length} records`)

    for (const rawRecord of rawData) {
      try {
        // Step 1: Validate raw data
        if (validateData && !this.validateRawData(rawRecord)) {
          errors.push({
            record: rawRecord,
            error: 'Data validation failed',
            timestamp: new Date().toISOString()
          })
          skipped++
          continue
        }

        // Step 2: Find or create theme
        const themeId = await this.findOrCreateTheme(rawRecord)
        if (!themeId) {
          errors.push({
            record: rawRecord,
            error: 'Failed to find or create theme',
            timestamp: new Date().toISOString()
          })
          skipped++
          continue
        }

        // Step 3: Normalize data structure
        let normalizedRecord = this.normalizeDataStructure(rawRecord, themeId)

        // Step 4: Enrich data if requested
        if (enrichData) {
          normalizedRecord = await this.enrichNormalizedData(normalizedRecord)
        }

        // Step 5: Check for duplicates if requested
        if (deduplicateData) {
          const isDuplicate = await this.checkForDuplicate(normalizedRecord)
          if (isDuplicate) {
            console.log(`Skipping duplicate record for theme ${themeId} from ${rawRecord.source}`)
            skipped++
            continue
          }
        }

        normalized.push(normalizedRecord)
        processed++

      } catch (error) {
        console.error('Error normalizing record:', error)
        errors.push({
          record: rawRecord,
          error: error.message,
          timestamp: new Date().toISOString()
        })
        skipped++
      }
    }

    // Step 6: Batch insert normalized data
    if (normalized.length > 0) {
      await this.batchInsertNormalizedData(normalized)
    }

    const summary = {
      total: rawData.length,
      processed,
      skipped,
      errors: errors.length,
      successRate: processed / rawData.length * 100
    }

    console.log('Normalization complete:', summary)

    return {
      normalized,
      errors,
      summary
    }
  }

  private validateRawData(data: RawTrendData): boolean {
    // Required fields validation
    const requiredFields = ['source', 'search_volume', 'growth_rate', 'timestamp']
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        console.warn(`Missing required field: ${field}`)
        return false
      }
    }

    // Data type validation
    if (typeof data.search_volume !== 'number' || data.search_volume < 0) {
      console.warn('Invalid search_volume:', data.search_volume)
      return false
    }

    if (typeof data.growth_rate !== 'number') {
      console.warn('Invalid growth_rate:', data.growth_rate)
      return false
    }

    // Timestamp validation
    const timestamp = new Date(data.timestamp)
    if (isNaN(timestamp.getTime())) {
      console.warn('Invalid timestamp:', data.timestamp)
      return false
    }

    // Check if timestamp is not too old (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    if (timestamp < thirtyDaysAgo) {
      console.warn('Timestamp too old:', data.timestamp)
      return false
    }

    return true
  }

  private async findOrCreateTheme(data: RawTrendData): Promise<string | null> {
    try {
      // Extract theme information from the raw data
      const themeTitle = this.extractThemeTitle(data)
      if (!themeTitle) {
        return null
      }

      // First, try to find existing theme
      const { data: existingThemes, error: findError } = await this.supabaseClient
        .from('themes')
        .select('id')
        .ilike('title', `%${themeTitle}%`)
        .limit(1)

      if (findError) {
        console.error('Error finding theme:', findError)
        return null
      }

      if (existingThemes && existingThemes.length > 0) {
        return existingThemes[0].id
      }

      // If not found, create new theme
      const newTheme = {
        title: themeTitle,
        description: `Auto-generated theme from ${data.source} data`,
        category: this.inferCategory(themeTitle),
        monetization_score: 0, // Will be calculated later
        market_size: data.search_volume || 0,
        competition_level: 'medium' as const,
        technical_difficulty: 'intermediate' as const,
        estimated_revenue_min: 0,
        estimated_revenue_max: 0,
        data_sources: [data.source]
      }

      const { data: createdTheme, error: createError } = await this.supabaseClient
        .from('themes')
        .insert(newTheme)
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating theme:', createError)
        return null
      }

      console.log(`Created new theme: ${themeTitle} (${createdTheme.id})`)
      return createdTheme.id

    } catch (error) {
      console.error('Error in findOrCreateTheme:', error)
      return null
    }
  }

  private extractThemeTitle(data: RawTrendData): string | null {
    // Extract theme title from various data sources
    if (data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
      return data.keywords[0]
    }

    if (data.theme_title) {
      return data.theme_title
    }

    if (data.query) {
      return data.query
    }

    if (data.title) {
      return data.title
    }

    // Fallback: try to extract from source-specific fields
    switch (data.source) {
      case 'google-trends':
        return data.keywords?.[0] || null
      case 'reddit':
        return data.subreddits?.[0] || null
      case 'twitter':
        return data.hashtags?.[0] || null
      case 'product-hunt':
        return data.product_name || null
      case 'github':
        return data.repository_name || null
      default:
        return null
    }
  }

  private inferCategory(title: string): string {
    const categoryKeywords = {
      productivity: ['productivity', 'task', 'todo', 'calendar', 'schedule', 'organize', 'workflow'],
      entertainment: ['game', 'music', 'video', 'movie', 'entertainment', 'fun', 'streaming'],
      education: ['learn', 'education', 'course', 'tutorial', 'study', 'training', 'skill'],
      health: ['health', 'fitness', 'medical', 'wellness', 'exercise', 'diet', 'mental'],
      finance: ['finance', 'money', 'budget', 'investment', 'crypto', 'trading', 'banking'],
      social: ['social', 'chat', 'community', 'network', 'dating', 'messaging', 'forum']
    }

    const lowerTitle = title.toLowerCase()
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return category
      }
    }

    return 'productivity' // Default category
  }

  private normalizeDataStructure(data: RawTrendData, themeId: string): NormalizedTrendData {
    return {
      theme_id: themeId,
      source: data.source,
      search_volume: Math.max(0, Math.floor(data.search_volume)),
      growth_rate: Math.round(data.growth_rate * 100) / 100, // Round to 2 decimal places
      geographic_data: this.normalizeGeographicData(data.geographic_data),
      demographic_data: this.normalizeDemographicData(data.demographic_data),
      timestamp: new Date(data.timestamp).toISOString(),
      metadata: this.extractMetadata(data)
    }
  }

  private normalizeGeographicData(geoData: any): any {
    if (!geoData || typeof geoData !== 'object') {
      return {}
    }

    const normalized: any = {}

    // Normalize country codes
    if (geoData.country_breakdown) {
      normalized.countries = {}
      for (const [country, value] of Object.entries(geoData.country_breakdown)) {
        if (typeof value === 'number' && value >= 0) {
          normalized.countries[country.toUpperCase()] = Math.round(value * 100) / 100
        }
      }
    }

    // Normalize regional data
    if (geoData.regional_interest && Array.isArray(geoData.regional_interest)) {
      normalized.regions = geoData.regional_interest
        .filter((region: any) => region && typeof region.interest === 'number')
        .map((region: any) => ({
          name: region.region || region.name,
          interest: Math.round(region.interest * 100) / 100
        }))
    }

    // Add primary region
    if (geoData.region) {
      normalized.primary_region = geoData.region
    }

    return normalized
  }

  private normalizeDemographicData(demoData: any): any {
    if (!demoData || typeof demoData !== 'object') {
      return {}
    }

    const normalized: any = {}

    // Normalize age groups
    if (demoData.age_groups) {
      normalized.age_distribution = {}
      const validAgeGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
      
      for (const [ageGroup, value] of Object.entries(demoData.age_groups)) {
        if (validAgeGroups.includes(ageGroup) && typeof value === 'number' && value >= 0) {
          normalized.age_distribution[ageGroup] = Math.round(value * 100) / 100
        }
      }
    }

    // Normalize gender data
    if (demoData.gender_split) {
      normalized.gender_distribution = {}
      const validGenders = ['male', 'female', 'other']
      
      for (const [gender, value] of Object.entries(demoData.gender_split)) {
        if (validGenders.includes(gender) && typeof value === 'number' && value >= 0) {
          normalized.gender_distribution[gender] = Math.round(value * 100) / 100
        }
      }
    }

    // Add user activity data if available
    if (demoData.user_activity) {
      normalized.engagement = {
        average_score: Math.round((demoData.user_activity.average_score || 0) * 100) / 100,
        average_comments: Math.round((demoData.user_activity.average_comments || 0) * 100) / 100,
        total_engagement: Math.round((demoData.user_activity.total_engagement || 0) * 100) / 100
      }
    }

    return normalized
  }

  private extractMetadata(data: RawTrendData): any {
    const metadata: any = {
      collection_timestamp: new Date().toISOString(),
      source_version: '1.0'
    }

    // Add source-specific metadata
    switch (data.source) {
      case 'google-trends':
        if (data.related_queries) metadata.related_queries = data.related_queries
        if (data.keywords) metadata.keywords = data.keywords
        break
      
      case 'reddit':
        if (data.subreddits) metadata.subreddits = data.subreddits
        if (data.post_count) metadata.post_count = data.post_count
        if (data.engagement_score) metadata.engagement_score = data.engagement_score
        break
      
      case 'twitter':
        if (data.hashtags) metadata.hashtags = data.hashtags
        if (data.tweet_count) metadata.tweet_count = data.tweet_count
        break
      
      case 'product-hunt':
        if (data.product_name) metadata.product_name = data.product_name
        if (data.votes) metadata.votes = data.votes
        break
      
      case 'github':
        if (data.repository_name) metadata.repository_name = data.repository_name
        if (data.stars) metadata.stars = data.stars
        if (data.language) metadata.language = data.language
        break
    }

    return metadata
  }

  private async enrichNormalizedData(data: NormalizedTrendData): Promise<NormalizedTrendData> {
    try {
      // Add calculated fields
      data.metadata.quality_score = this.calculateDataQualityScore(data)
      data.metadata.trend_strength = this.calculateTrendStrength(data)
      data.metadata.market_potential = this.calculateMarketPotential(data)

      // Add timestamp-based enrichments
      const timestamp = new Date(data.timestamp)
      data.metadata.collection_hour = timestamp.getUTCHours()
      data.metadata.collection_day = timestamp.getUTCDay()
      data.metadata.collection_week = this.getWeekNumber(timestamp)

      return data
    } catch (error) {
      console.error('Error enriching data:', error)
      return data
    }
  }

  private calculateDataQualityScore(data: NormalizedTrendData): number {
    let score = 0
    let maxScore = 0

    // Search volume quality (0-30 points)
    maxScore += 30
    if (data.search_volume > 0) {
      score += Math.min(30, Math.log10(data.search_volume + 1) * 10)
    }

    // Geographic data quality (0-25 points)
    maxScore += 25
    if (data.geographic_data && Object.keys(data.geographic_data).length > 0) {
      score += 25
    }

    // Demographic data quality (0-25 points)
    maxScore += 25
    if (data.demographic_data && Object.keys(data.demographic_data).length > 0) {
      score += 25
    }

    // Metadata richness (0-20 points)
    maxScore += 20
    const metadataKeys = Object.keys(data.metadata || {})
    score += Math.min(20, metadataKeys.length * 4)

    return Math.round((score / maxScore) * 100)
  }

  private calculateTrendStrength(data: NormalizedTrendData): number {
    const growthRate = Math.abs(data.growth_rate)
    const searchVolume = data.search_volume

    // Combine growth rate and search volume for trend strength
    const volumeScore = Math.min(50, Math.log10(searchVolume + 1) * 10)
    const growthScore = Math.min(50, growthRate)

    return Math.round(volumeScore + growthScore)
  }

  private calculateMarketPotential(data: NormalizedTrendData): number {
    const searchVolume = data.search_volume
    const growthRate = data.growth_rate
    const qualityScore = data.metadata.quality_score || 0

    // Market potential based on volume, growth, and data quality
    const volumePotential = Math.min(40, Math.log10(searchVolume + 1) * 8)
    const growthPotential = Math.min(40, Math.max(0, growthRate))
    const qualityPotential = qualityScore * 0.2

    return Math.round(volumePotential + growthPotential + qualityPotential)
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  private async checkForDuplicate(data: NormalizedTrendData): Promise<boolean> {
    try {
      const { data: existing, error } = await this.supabaseClient
        .from('trend_data')
        .select('id')
        .eq('theme_id', data.theme_id)
        .eq('source', data.source)
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Within last hour
        .limit(1)

      if (error) {
        console.error('Error checking for duplicates:', error)
        return false
      }

      return existing && existing.length > 0
    } catch (error) {
      console.error('Error in duplicate check:', error)
      return false
    }
  }

  private async batchInsertNormalizedData(data: NormalizedTrendData[]): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('trend_data')
        .upsert(data, {
          onConflict: 'theme_id,source,timestamp',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error batch inserting normalized data:', error)
        throw error
      }

      console.log(`Successfully inserted ${data.length} normalized records`)
    } catch (error) {
      console.error('Error in batch insert:', error)
      throw error
    }
  }
}