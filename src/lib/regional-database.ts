import { supabase } from './supabase'
import type { 
  CountryCode, 
  RegionalTrend, 
  LocalizedOpportunity, 
  RegionalComparison,
  DemographicFilter,
  CrossAnalysis,
  FilterState,
  RegionalAnalysisRequest,
  DemographicFilterRequest,
  SaveFilterStateRequest
} from '../types/regional'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  handleDatabaseError,
  validatePaginationParams,
  type APIResponse,
  type PaginatedResponse
} from './database'

// =============================================================================
// REGIONAL ANALYSIS OPERATIONS
// =============================================================================

export const regionalAnalysisOperations = {
  /**
   * Get regional trends for specified countries
   */
  async getRegionalTrends(regions: CountryCode[]): Promise<APIResponse<RegionalTrend[]>> {
    try {
      if (!regions.length) {
        return createErrorResponse('At least one region is required')
      }

      const { data, error } = await supabase
        .from('regional_trends')
        .select('*')
        .in('region', regions)
        .order('market_potential', { ascending: false })

      if (error) {
        throw handleDatabaseError(error)
      }

      // Transform database data to match RegionalTrend type
      const regionalTrends: RegionalTrend[] = (data || []).map(row => ({
        region: row.region as CountryCode,
        regionName: row.region_name,
        themes: [], // Will be populated separately if needed
        marketPotential: row.market_potential || 0,
        competitionLevel: row.competition_level as 'low' | 'medium' | 'high',
        localizedOpportunities: [], // Will be populated separately if needed
        demographics: row.demographics || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      return createSuccessResponse(regionalTrends)
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  /**
   * Get localized opportunities for a specific region
   */
  async getLocalizedOpportunities(
    region: CountryCode,
    options?: {
      themeIds?: string[]
      minMarketGap?: number
      minConfidence?: number
      limit?: number
    }
  ): Promise<APIResponse<LocalizedOpportunity[]>> {
    try {
      let query = supabase
        .from('localized_opportunities')
        .select(`
          *,
          themes!inner(id, title, category, monetization_score)
        `)
        .eq('region', region)
        .order('market_gap', { ascending: false })

      if (options?.themeIds?.length) {
        query = query.in('theme_id', options.themeIds)
      }

      if (options?.minMarketGap !== undefined) {
        query = query.gte('market_gap', options.minMarketGap)
      }

      if (options?.minConfidence !== undefined) {
        query = query.gte('confidence', options.minConfidence)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw handleDatabaseError(error)
      }

      const opportunities: LocalizedOpportunity[] = (data || []).map(row => ({
        id: row.id,
        themeId: row.theme_id,
        region: row.region as CountryCode,
        theme: row.theme,
        localNeed: row.local_need,
        marketGap: row.market_gap || 0,
        culturalFactors: row.cultural_factors || [],
        regulatoryConsiderations: row.regulatory_considerations || [],
        estimatedRevenue: {
          min: row.estimated_revenue_min || 0,
          max: row.estimated_revenue_max || 0,
        },
        confidence: row.confidence || 0,
        dataSource: row.data_source || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      return createSuccessResponse(opportunities)
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  /**
   * Compare multiple regions for market analysis
   */
  async compareRegions(
    regions: CountryCode[],
    options?: {
      themeIds?: string[]
      categories?: string[]
      includeOpportunities?: boolean
    }
  ): Promise<APIResponse<RegionalComparison>> {
    try {
      if (regions.length < 2) {
        return createErrorResponse('At least 2 regions are required for comparison')
      }

      // Check if we have a cached comparison
      const { data: cachedComparison } = await supabase
        .from('regional_comparisons')
        .select('*')
        .contains('regions', regions)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (cachedComparison) {
        return createSuccessResponse(cachedComparison.comparison_data as RegionalComparison)
      }

      // Get themes data for each region
      let themesQuery = supabase
        .from('themes')
        .select(`
          id,
          title,
          category,
          monetization_score,
          market_size,
          competition_level,
          trend_data!inner(geographic_data)
        `)

      if (options?.themeIds?.length) {
        themesQuery = themesQuery.in('id', options.themeIds)
      }

      if (options?.categories?.length) {
        themesQuery = themesQuery.in('category', options.categories)
      }

      const { data: themesData, error: themesError } = await themesQuery

      if (themesError) {
        throw handleDatabaseError(themesError)
      }

      // Process regional data
      const regionalData: Record<CountryCode, any> = {}
      let bestRegion: CountryCode = regions[0]
      let worstRegion: CountryCode = regions[0]
      let totalMarketPotential = 0
      let regionCount = 0

      for (const region of regions) {
        const regionThemes = (themesData || []).filter(theme => 
          theme.trend_data.some((td: any) => 
            td.geographic_data && td.geographic_data[region]
          )
        )

        const marketPotential = regionThemes.length > 0 
          ? regionThemes.reduce((sum, theme) => sum + (theme.monetization_score || 0), 0) / regionThemes.length
          : 0

        const avgCompetition = regionThemes.length > 0
          ? regionThemes.filter(t => t.competition_level === 'low').length / regionThemes.length * 100
          : 0

        regionalData[region] = {
          marketPotential: Math.round(marketPotential),
          competitionLevel: avgCompetition > 60 ? 'low' : avgCompetition > 30 ? 'medium' : 'high',
          searchVolume: regionThemes.reduce((sum, theme) => {
            const regionTrendData = theme.trend_data.find((td: any) => 
              td.geographic_data && td.geographic_data[region]
            )
            return sum + (regionTrendData?.geographic_data[region] || 0)
          }, 0),
          growthRate: 0, // Would be calculated from trend data
          estimatedRevenue: {
            min: regionThemes.reduce((sum, theme) => sum + (theme.market_size || 0) * 0.1, 0),
            max: regionThemes.reduce((sum, theme) => sum + (theme.market_size || 0) * 0.3, 0),
          },
        }

        totalMarketPotential += marketPotential
        regionCount++

        // Update best/worst regions
        if (marketPotential > (regionalData[bestRegion]?.marketPotential || 0)) {
          bestRegion = region
        }
        if (marketPotential < (regionalData[worstRegion]?.marketPotential || Infinity)) {
          worstRegion = region
        }
      }

      const comparison: RegionalComparison = {
        regions,
        themes: (themesData || []).map(theme => ({
          themeId: theme.id,
          title: theme.title,
          regionalData: Object.fromEntries(
            regions.map(region => [
              region,
              regionalData[region] || {
                marketPotential: 0,
                competitionLevel: 'high' as const,
                searchVolume: 0,
                growthRate: 0,
                estimatedRevenue: { min: 0, max: 0 },
              }
            ])
          ) as Record<CountryCode, any>,
        })),
        comparisonMetrics: {
          bestRegion,
          worstRegion,
          averageMarketPotential: regionCount > 0 ? Math.round(totalMarketPotential / regionCount) : 0,
          totalMarketSize: Object.values(regionalData).reduce(
            (sum, data) => sum + data.estimatedRevenue.max, 0
          ),
        },
        createdAt: new Date().toISOString(),
      }

      // Cache the comparison
      await supabase
        .from('regional_comparisons')
        .insert({
          regions,
          comparison_data: comparison,
          best_region: bestRegion,
          worst_region: worstRegion,
          average_market_potential: comparison.comparisonMetrics.averageMarketPotential,
          total_market_size: comparison.comparisonMetrics.totalMarketSize,
        })

      return createSuccessResponse(comparison)
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  /**
   * Get market potential for a specific region
   */
  async getRegionalMarketPotential(region: CountryCode): Promise<APIResponse<{
    region: CountryCode
    themeCount: number
    avgMonetizationScore: number
    totalOpportunities: number
    avgMarketGap: number
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_regional_market_potential', { region_code: region })

      if (error) {
        throw handleDatabaseError(error)
      }

      const result = data?.[0] || {
        region,
        theme_count: 0,
        avg_monetization_score: 0,
        total_opportunities: 0,
        avg_market_gap: 0,
      }

      return createSuccessResponse({
        region: result.region as CountryCode,
        themeCount: result.theme_count,
        avgMonetizationScore: parseFloat(result.avg_monetization_score) || 0,
        totalOpportunities: result.total_opportunities,
        avgMarketGap: parseFloat(result.avg_market_gap) || 0,
      })
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// =============================================================================
// DEMOGRAPHIC FILTERING OPERATIONS
// =============================================================================

export const demographicFilterOperations = {
  /**
   * Apply demographic filters to themes
   */
  async filterThemesByDemographics(
    request: DemographicFilterRequest
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page, limit, offset } = validatePaginationParams(request.page, request.limit)

      // Build the base query
      let query = supabase
        .from('themes')
        .select(`
          *,
          trend_data!inner(demographic_data, geographic_data),
          segment_themes(relevance_score, market_potential, competition_level)
        `, { count: 'exact' })

      // Apply demographic filters through trend_data
      const { filters } = request

      if (filters.countries?.length) {
        // Filter by geographic data containing any of the specified countries
        query = query.or(
          filters.countries.map(country => 
            `trend_data.geographic_data.cs.{"${country}":1}`
          ).join(',')
        )
      }

      if (filters.ageGroups?.length) {
        // Filter by demographic data containing any of the specified age groups
        query = query.or(
          filters.ageGroups.map(ageGroup => 
            `trend_data.demographic_data.cs.{"ageGroup":"${ageGroup}"}`
          ).join(',')
        )
      }

      if (filters.genders?.length) {
        query = query.or(
          filters.genders.map(gender => 
            `trend_data.demographic_data.cs.{"gender":"${gender}"}`
          ).join(',')
        )
      }

      if (filters.incomeLevels?.length) {
        query = query.or(
          filters.incomeLevels.map(income => 
            `trend_data.demographic_data.cs.{"incomeLevel":"${income}"}`
          ).join(',')
        )
      }

      // Apply theme filters
      if (request.themeIds?.length) {
        query = query.in('id', request.themeIds)
      }

      if (request.categories?.length) {
        query = query.in('category', request.categories)
      }

      // Apply sorting
      const sortBy = request.sortBy || 'relevance'
      const sortOrder = request.sortOrder || 'desc'

      switch (sortBy) {
        case 'relevance':
          query = query.order('monetization_score', { ascending: sortOrder === 'asc' })
          break
        case 'market_potential':
          query = query.order('market_size', { ascending: sortOrder === 'asc' })
          break
        case 'competition':
          query = query.order('competition_level', { ascending: sortOrder === 'asc' })
          break
        case 'revenue':
          query = query.order('estimated_revenue_max', { ascending: sortOrder === 'asc' })
          break
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw handleDatabaseError(error)
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return createPaginatedResponse(
        data || [],
        {
          page,
          limit,
          total: count || 0,
          totalPages,
        }
      )
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: dbError.message,
      }
    }
  },

  /**
   * Perform cross-analysis between demographic segments
   */
  async performCrossAnalysis(
    filters: DemographicFilter,
    options?: {
      includeComparisons?: boolean
      includeInsights?: boolean
    }
  ): Promise<APIResponse<CrossAnalysis>> {
    try {
      // Get demographic segments that match the filters
      const { data: segments, error: segmentsError } = await supabase
        .from('demographic_segments')
        .select(`
          *,
          segment_themes!inner(
            theme_id,
            relevance_score,
            market_potential,
            competition_level,
            estimated_revenue_min,
            estimated_revenue_max,
            themes!inner(id, title)
          )
        `)
        .order('average_relevance', { ascending: false })

      if (segmentsError) {
        throw handleDatabaseError(segmentsError)
      }

      // Transform segments data
      const analysisSegments = (segments || []).map(segment => ({
        segmentId: segment.segment_id,
        name: segment.name,
        description: segment.description || '',
        demographics: segment.demographics,
        themes: segment.segment_themes.map((st: any) => ({
          themeId: st.theme_id,
          title: st.themes.title,
          relevanceScore: st.relevance_score || 0,
          marketPotential: st.market_potential || 0,
          competitionLevel: st.competition_level as 'low' | 'medium' | 'high',
          estimatedRevenue: {
            min: st.estimated_revenue_min || 0,
            max: st.estimated_revenue_max || 0,
          },
        })),
        totalMarketSize: segment.total_market_size || 0,
        averageRelevance: segment.average_relevance || 0,
      }))

      // Generate comparisons if requested
      const comparisons = options?.includeComparisons ? 
        generateSegmentComparisons(analysisSegments) : []

      // Generate insights if requested
      const insights = options?.includeInsights ? 
        generateAnalysisInsights(analysisSegments) : []

      const crossAnalysis: CrossAnalysis = {
        segments: analysisSegments,
        comparisons,
        insights,
        createdAt: new Date().toISOString(),
      }

      return createSuccessResponse(crossAnalysis)
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// =============================================================================
// FILTER STATE OPERATIONS
// =============================================================================

export const filterStateOperations = {
  /**
   * Save a filter state for a user
   */
  async saveFilterState(
    userId: string,
    request: SaveFilterStateRequest
  ): Promise<APIResponse<FilterState>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      // If setting as default, unset other defaults first
      if (request.isDefault) {
        await supabase
          .from('user_filter_states')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true)
      }

      const { data, error } = await supabase
        .from('user_filter_states')
        .insert({
          user_id: userId,
          name: request.name,
          description: request.description,
          filters: request.filters,
          is_default: request.isDefault,
          is_public: request.isPublic,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      const filterState: FilterState = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        filters: data.filters,
        isDefault: data.is_default,
        isPublic: data.is_public,
        usageCount: data.usage_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      return createSuccessResponse(filterState, 'Filter state saved successfully')
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  /**
   * Get filter states for a user
   */
  async getUserFilterStates(
    userId: string,
    includePublic: boolean = true
  ): Promise<APIResponse<FilterState[]>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      let query = supabase
        .from('user_filter_states')
        .select('*')
        .order('is_default', { ascending: false })
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false })

      if (includePublic) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`)
      } else {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        throw handleDatabaseError(error)
      }

      const filterStates: FilterState[] = (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        filters: row.filters,
        isDefault: row.is_default,
        isPublic: row.is_public,
        usageCount: row.usage_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      return createSuccessResponse(filterStates)
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  /**
   * Update filter state usage count
   */
  async incrementFilterUsage(filterId: string): Promise<APIResponse<null>> {
    try {
      if (!filterId) {
        return createErrorResponse('Filter ID is required')
      }

      const { error } = await supabase
        .from('user_filter_states')
        .update({ 
          usage_count: supabase.raw('usage_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', filterId)

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(null, 'Filter usage updated')
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  /**
   * Delete a filter state
   */
  async deleteFilterState(
    userId: string,
    filterId: string
  ): Promise<APIResponse<null>> {
    try {
      if (!userId || !filterId) {
        return createErrorResponse('User ID and Filter ID are required')
      }

      const { error } = await supabase
        .from('user_filter_states')
        .delete()
        .eq('id', filterId)
        .eq('user_id', userId)

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(null, 'Filter state deleted successfully')
    } catch (error) {
      const dbError = handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateSegmentComparisons(segments: any[]): any[] {
  const comparisons = []
  
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const segmentA = segments[i]
      const segmentB = segments[j]
      
      const differences = [
        {
          metric: 'Average Relevance',
          valueA: segmentA.averageRelevance,
          valueB: segmentB.averageRelevance,
          significance: Math.abs(segmentA.averageRelevance - segmentB.averageRelevance),
        },
        {
          metric: 'Total Market Size',
          valueA: segmentA.totalMarketSize,
          valueB: segmentB.totalMarketSize,
          significance: Math.abs(segmentA.totalMarketSize - segmentB.totalMarketSize) / 
                       Math.max(segmentA.totalMarketSize, segmentB.totalMarketSize) * 100,
        },
        {
          metric: 'Theme Count',
          valueA: segmentA.themes.length,
          valueB: segmentB.themes.length,
          significance: Math.abs(segmentA.themes.length - segmentB.themes.length),
        },
      ]

      const recommendations = []
      if (segmentA.averageRelevance > segmentB.averageRelevance + 10) {
        recommendations.push(`Focus on ${segmentA.name} for higher relevance themes`)
      }
      if (segmentB.totalMarketSize > segmentA.totalMarketSize * 1.5) {
        recommendations.push(`Consider ${segmentB.name} for larger market opportunities`)
      }

      comparisons.push({
        segmentA: segmentA.segmentId,
        segmentB: segmentB.segmentId,
        differences,
        recommendations,
      })
    }
  }

  return comparisons
}

function generateAnalysisInsights(segments: any[]): any[] {
  const insights = []

  // Find the best performing segment
  const bestSegment = segments.reduce((best, current) => 
    current.averageRelevance > best.averageRelevance ? current : best
  )

  insights.push({
    type: 'opportunity' as const,
    title: 'Top Performing Segment',
    description: `${bestSegment.name} shows the highest average relevance (${bestSegment.averageRelevance.toFixed(1)}%) across themes`,
    confidence: 85,
    impact: 'high' as const,
    actionable: true,
  })

  // Find segments with low competition
  const lowCompetitionSegments = segments.filter(segment => 
    segment.themes.filter((theme: any) => theme.competitionLevel === 'low').length > 
    segment.themes.length * 0.6
  )

  if (lowCompetitionSegments.length > 0) {
    insights.push({
      type: 'opportunity' as const,
      title: 'Low Competition Segments',
      description: `${lowCompetitionSegments.length} segment(s) have predominantly low competition themes`,
      confidence: 75,
      impact: 'medium' as const,
      actionable: true,
    })
  }

  // Identify market size trends
  const avgMarketSize = segments.reduce((sum, seg) => sum + seg.totalMarketSize, 0) / segments.length
  const largeMarketSegments = segments.filter(seg => seg.totalMarketSize > avgMarketSize * 1.5)

  if (largeMarketSegments.length > 0) {
    insights.push({
      type: 'trend' as const,
      title: 'Large Market Opportunities',
      description: `${largeMarketSegments.length} segment(s) show significantly larger market potential`,
      confidence: 70,
      impact: 'high' as const,
      actionable: true,
    })
  }

  return insights
}