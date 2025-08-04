import { supabase, createServerSupabaseClient } from './supabase'
import type { Database } from '../types'
import { z } from 'zod'

// Type aliases for easier use
export type User = Database['public']['Tables']['users']['Row']
export type Theme = Database['public']['Tables']['themes']['Row']
export type TrendData = Database['public']['Tables']['trend_data']['Row']
export type CompetitorAnalysis = Database['public']['Tables']['competitor_analysis']['Row']
export type UserAlert = Database['public']['Tables']['user_alerts']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

// Generic API response types
export interface APIResponse<T> {
  data: T | null
  error: string | null
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error: string | null
  message?: string
}

// Error handling utilities
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function handleDatabaseError(error: any): DatabaseError {
  if (error?.code) {
    return new DatabaseError(
      error.message || 'Database operation failed',
      error.code,
      error.details
    )
  }
  
  return new DatabaseError(
    error?.message || 'Unknown database error',
    'UNKNOWN_ERROR',
    error
  )
}

// Response normalization utilities
export function createSuccessResponse<T>(
  data: T,
  message?: string
): APIResponse<T> {
  return {
    data,
    error: null,
    message,
    timestamp: new Date().toISOString(),
  }
}

export function createErrorResponse<T = null>(
  error: string | DatabaseError,
  data: T = null as T
): APIResponse<T> {
  const errorMessage = error instanceof DatabaseError ? error.message : error
  
  return {
    data,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  message?: string
): PaginatedResponse<T> {
  return {
    data,
    pagination,
    error: null,
    message,
  }
}

// Validation utilities
export function validatePaginationParams(
  page: number = 1,
  limit: number = 20
): { page: number; limit: number; offset: number } {
  const validatedPage = Math.max(1, Math.floor(page))
  const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)))
  const offset = (validatedPage - 1) * validatedLimit

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset,
  }
}

// Real-time subscription utilities
export interface RealtimeSubscription {
  unsubscribe: () => void
}

export function subscribeToTable<T>(
  table: keyof Database['public']['Tables'],
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: T | null
    old: T | null
  }) => void,
  filter?: string
): RealtimeSubscription {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table as string,
        filter,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T | null,
          old: payload.old as T | null,
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

// User operations
export const userOperations = {
  async getUser(userId: string): Promise<APIResponse<User>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async createUser(user: Database['public']['Tables']['users']['Insert']): Promise<APIResponse<User>> {
    try {
      // Validate required fields
      if (!user.email) {
        return createErrorResponse('Email is required')
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          ...user,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data, 'User created successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async updateUser(userId: string, updates: Database['public']['Tables']['users']['Update']): Promise<APIResponse<User>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data, 'User updated successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async deleteUser(userId: string): Promise<APIResponse<null>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(null, 'User deleted successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getUserByEmail(email: string): Promise<APIResponse<User>> {
    try {
      if (!email) {
        return createErrorResponse('Email is required')
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// Theme operations
export const themeOperations = {
  async getThemes(filters?: {
    category?: string
    competition_level?: string
    technical_difficulty?: string
    min_monetization_score?: number
    max_monetization_score?: number
    min_market_size?: number
    max_market_size?: number
    search?: string
    page?: number
    limit?: number
    sort_by?: 'monetization_score' | 'market_size' | 'created_at' | 'updated_at' | 'title'
    sort_order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Theme>> {
    try {
      const { page, limit, offset } = validatePaginationParams(filters?.page, filters?.limit)
      
      let query = supabase
        .from('themes')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.competition_level) {
        query = query.eq('competition_level', filters.competition_level)
      }
      if (filters?.technical_difficulty) {
        query = query.eq('technical_difficulty', filters.technical_difficulty)
      }
      if (filters?.min_monetization_score !== undefined) {
        query = query.gte('monetization_score', filters.min_monetization_score)
      }
      if (filters?.max_monetization_score !== undefined) {
        query = query.lte('monetization_score', filters.max_monetization_score)
      }
      if (filters?.min_market_size !== undefined) {
        query = query.gte('market_size', filters.min_market_size)
      }
      if (filters?.max_market_size !== undefined) {
        query = query.lte('market_size', filters.max_market_size)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'monetization_score'
      const sortOrder = filters?.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

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
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: dbError.message,
      }
    }
  },

  async getTheme(themeId: string): Promise<APIResponse<Theme>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getThemeWithTrendData(themeId: string): Promise<APIResponse<Theme & { trend_data: TrendData[] }>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('themes')
        .select(`
          *,
          trend_data (*)
        `)
        .eq('id', themeId)
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data as Theme & { trend_data: TrendData[] })
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getThemeWithCompetitors(themeId: string): Promise<APIResponse<Theme & { competitor_analysis: CompetitorAnalysis[] }>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('themes')
        .select(`
          *,
          competitor_analysis (*)
        `)
        .eq('id', themeId)
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data as Theme & { competitor_analysis: CompetitorAnalysis[] })
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getThemeWithAllRelations(themeId: string): Promise<APIResponse<Theme & { 
    trend_data: TrendData[]
    competitor_analysis: CompetitorAnalysis[]
    user_alerts: UserAlert[]
  }>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('themes')
        .select(`
          *,
          trend_data (*),
          competitor_analysis (*),
          user_alerts (*)
        `)
        .eq('id', themeId)
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data as Theme & { 
        trend_data: TrendData[]
        competitor_analysis: CompetitorAnalysis[]
        user_alerts: UserAlert[]
      })
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async createTheme(theme: Database['public']['Tables']['themes']['Insert']): Promise<APIResponse<Theme>> {
    try {
      if (!theme.title) {
        return createErrorResponse('Theme title is required')
      }

      const { data, error } = await supabase
        .from('themes')
        .insert({
          ...theme,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data, 'Theme created successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async updateTheme(themeId: string, updates: Database['public']['Tables']['themes']['Update']): Promise<APIResponse<Theme>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('themes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', themeId)
        .select()
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data, 'Theme updated successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async deleteTheme(themeId: string): Promise<APIResponse<null>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId)
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(null, 'Theme deleted successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getTrendingThemes(limit: number = 10): Promise<APIResponse<Theme[]>> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('monetization_score', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// Trend data operations
export const trendDataOperations = {
  async getTrendDataForTheme(
    themeId: string, 
    options?: {
      limit?: number
      source?: string
      startDate?: string
      endDate?: string
    }
  ): Promise<APIResponse<TrendData[]>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      let query = supabase
        .from('trend_data')
        .select('*')
        .eq('theme_id', themeId)
        .order('timestamp', { ascending: false })

      if (options?.source) {
        query = query.eq('source', options.source)
      }
      if (options?.startDate) {
        query = query.gte('timestamp', options.startDate)
      }
      if (options?.endDate) {
        query = query.lte('timestamp', options.endDate)
      }
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getLatestTrendData(options?: {
    source?: string
    limit?: number
    hours?: number
  }): Promise<APIResponse<TrendData[]>> {
    try {
      let query = supabase
        .from('trend_data')
        .select('*')
        .order('timestamp', { ascending: false })

      if (options?.source) {
        query = query.eq('source', options.source)
      }
      
      if (options?.hours) {
        const hoursAgo = new Date(Date.now() - options.hours * 60 * 60 * 1000).toISOString()
        query = query.gte('timestamp', hoursAgo)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async createTrendData(trendData: Database['public']['Tables']['trend_data']['Insert']): Promise<APIResponse<TrendData>> {
    try {
      if (!trendData.theme_id || !trendData.source) {
        return createErrorResponse('Theme ID and source are required')
      }

      const { data, error } = await supabase
        .from('trend_data')
        .insert({
          ...trendData,
          timestamp: trendData.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data, 'Trend data created successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async bulkCreateTrendData(trendDataArray: Database['public']['Tables']['trend_data']['Insert'][]): Promise<APIResponse<TrendData[]>> {
    try {
      if (!trendDataArray.length) {
        return createErrorResponse('No trend data provided')
      }

      const timestamp = new Date().toISOString()
      const dataWithTimestamps = trendDataArray.map(item => ({
        ...item,
        timestamp: item.timestamp || timestamp,
        created_at: timestamp,
      }))

      const { data, error } = await supabase
        .from('trend_data')
        .insert(dataWithTimestamps)
        .select()
      
      if (error) {
        throw handleDatabaseError(error)
      }
      
      return createSuccessResponse(data || [], `${data?.length || 0} trend data records created successfully`)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getTrendDataStats(themeId: string): Promise<APIResponse<{
    totalRecords: number
    latestUpdate: string | null
    sources: string[]
    averageGrowthRate: number
    averageSearchVolume: number
  }>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('trend_data')
        .select('source, growth_rate, search_volume, timestamp')
        .eq('theme_id', themeId)
        .order('timestamp', { ascending: false })

      if (error) {
        throw handleDatabaseError(error)
      }

      const records = data || []
      const sources = [...new Set(records.map(r => r.source))]
      const avgGrowthRate = records.length > 0 
        ? records.reduce((sum, r) => sum + (r.growth_rate || 0), 0) / records.length 
        : 0
      const avgSearchVolume = records.length > 0 
        ? records.reduce((sum, r) => sum + (r.search_volume || 0), 0) / records.length 
        : 0

      const stats = {
        totalRecords: records.length,
        latestUpdate: records.length > 0 ? records[0].timestamp : null,
        sources,
        averageGrowthRate: Math.round(avgGrowthRate * 100) / 100,
        averageSearchVolume: Math.round(avgSearchVolume),
      }

      return createSuccessResponse(stats)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// User alerts operations
export const userAlertOperations = {
  async getUserAlerts(userId: string, includeInactive: boolean = false): Promise<APIResponse<UserAlert[]>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      let query = supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async createAlert(alert: Database['public']['Tables']['user_alerts']['Insert']): Promise<APIResponse<UserAlert>> {
    try {
      if (!alert.user_id || !alert.alert_type) {
        return createErrorResponse('User ID and alert type are required')
      }

      const { data, error } = await supabase
        .from('user_alerts')
        .insert({
          ...alert,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Alert created successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async updateAlert(alertId: string, updates: Database['public']['Tables']['user_alerts']['Update']): Promise<APIResponse<UserAlert>> {
    try {
      if (!alertId) {
        return createErrorResponse('Alert ID is required')
      }

      const { data, error } = await supabase
        .from('user_alerts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Alert updated successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async deleteAlert(alertId: string): Promise<APIResponse<null>> {
    try {
      if (!alertId) {
        return createErrorResponse('Alert ID is required')
      }

      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId)

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(null, 'Alert deleted successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getAlertsForTheme(themeId: string): Promise<APIResponse<UserAlert[]>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('theme_id', themeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async toggleAlert(alertId: string): Promise<APIResponse<UserAlert>> {
    try {
      if (!alertId) {
        return createErrorResponse('Alert ID is required')
      }

      // First get the current state
      const { data: currentAlert, error: fetchError } = await supabase
        .from('user_alerts')
        .select('is_active')
        .eq('id', alertId)
        .single()

      if (fetchError) {
        throw handleDatabaseError(fetchError)
      }

      // Toggle the state
      const { data, error } = await supabase
        .from('user_alerts')
        .update({
          is_active: !currentAlert.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, `Alert ${data.is_active ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// Subscription operations
export const subscriptionOperations = {
  async getUserSubscription(userId: string): Promise<APIResponse<Subscription>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getAllUserSubscriptions(userId: string): Promise<APIResponse<Subscription[]>> {
    try {
      if (!userId) {
        return createErrorResponse('User ID is required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async createSubscription(subscription: Database['public']['Tables']['subscriptions']['Insert']): Promise<APIResponse<Subscription>> {
    try {
      if (!subscription.user_id || !subscription.plan_name || !subscription.status) {
        return createErrorResponse('User ID, plan name, and status are required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Subscription created successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async updateSubscription(subscriptionId: string, updates: Database['public']['Tables']['subscriptions']['Update']): Promise<APIResponse<Subscription>> {
    try {
      if (!subscriptionId) {
        return createErrorResponse('Subscription ID is required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Subscription updated successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Database['public']['Tables']['subscriptions']['Update']): Promise<APIResponse<Subscription>> {
    try {
      if (!stripeSubscriptionId) {
        return createErrorResponse('Stripe subscription ID is required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Subscription updated successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<APIResponse<Subscription>> {
    try {
      if (!subscriptionId) {
        return createErrorResponse('Subscription ID is required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Subscription canceled successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<APIResponse<Subscription>> {
    try {
      if (!stripeSubscriptionId) {
        return createErrorResponse('Stripe subscription ID is required')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// Competitor analysis operations
export const competitorAnalysisOperations = {
  async getCompetitorsForTheme(themeId: string): Promise<APIResponse<CompetitorAnalysis[]>> {
    try {
      if (!themeId) {
        return createErrorResponse('Theme ID is required')
      }

      const { data, error } = await supabase
        .from('competitor_analysis')
        .select('*')
        .eq('theme_id', themeId)
        .order('estimated_revenue', { ascending: false })

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data || [])
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async createCompetitorAnalysis(analysis: Database['public']['Tables']['competitor_analysis']['Insert']): Promise<APIResponse<CompetitorAnalysis>> {
    try {
      if (!analysis.theme_id || !analysis.competitor_name) {
        return createErrorResponse('Theme ID and competitor name are required')
      }

      const { data, error } = await supabase
        .from('competitor_analysis')
        .insert({
          ...analysis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Competitor analysis created successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async updateCompetitorAnalysis(analysisId: string, updates: Database['public']['Tables']['competitor_analysis']['Update']): Promise<APIResponse<CompetitorAnalysis>> {
    try {
      if (!analysisId) {
        return createErrorResponse('Analysis ID is required')
      }

      const { data, error } = await supabase
        .from('competitor_analysis')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId)
        .select()
        .single()

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(data, 'Competitor analysis updated successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async deleteCompetitorAnalysis(analysisId: string): Promise<APIResponse<null>> {
    try {
      if (!analysisId) {
        return createErrorResponse('Analysis ID is required')
      }

      const { error } = await supabase
        .from('competitor_analysis')
        .delete()
        .eq('id', analysisId)

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(null, 'Competitor analysis deleted successfully')
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// Database health check and utilities
export const databaseHealth = {
  async checkConnection(): Promise<APIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      const isConnected = !error
      return createSuccessResponse(isConnected, isConnected ? 'Database connection successful' : 'Database connection failed')
    } catch (error) {
      return createErrorResponse('Database connection failed', false)
    }
  },

  async getTableCounts(): Promise<APIResponse<Record<string, number>>> {
    try {
      const tables = ['users', 'themes', 'trend_data', 'competitor_analysis', 'user_alerts', 'subscriptions']
      const counts: Record<string, number> = {}

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          counts[table] = error ? 0 : count || 0
        } catch {
          counts[table] = 0
        }
      }

      return createSuccessResponse(counts)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async getSystemStats(): Promise<APIResponse<{
    totalUsers: number
    totalThemes: number
    totalTrendData: number
    activeSubscriptions: number
    activeAlerts: number
    lastDataUpdate: string | null
  }>> {
    try {
      const [usersCount, themesCount, trendDataCount, activeSubscriptions, activeAlerts, lastUpdate] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('themes').select('*', { count: 'exact', head: true }),
        supabase.from('trend_data').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_alerts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('trend_data').select('timestamp').order('timestamp', { ascending: false }).limit(1).single(),
      ])

      const stats = {
        totalUsers: usersCount.count || 0,
        totalThemes: themesCount.count || 0,
        totalTrendData: trendDataCount.count || 0,
        activeSubscriptions: activeSubscriptions.count || 0,
        activeAlerts: activeAlerts.count || 0,
        lastDataUpdate: lastUpdate.data?.timestamp || null,
      }

      return createSuccessResponse(stats)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}

// Real-time helpers for specific use cases
export const realtimeHelpers = {
  subscribeToThemeUpdates(callback: (theme: Theme) => void): RealtimeSubscription {
    return subscribeToTable<Theme>('themes', (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        callback(payload.new)
      }
    })
  },

  subscribeToNewTrendData(themeId: string, callback: (trendData: TrendData) => void): RealtimeSubscription {
    return subscribeToTable<TrendData>(
      'trend_data',
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          callback(payload.new)
        }
      },
      `theme_id=eq.${themeId}`
    )
  },

  subscribeToUserAlerts(userId: string, callback: (alert: UserAlert) => void): RealtimeSubscription {
    return subscribeToTable<UserAlert>(
      'user_alerts',
      (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          callback(payload.new)
        }
      },
      `user_id=eq.${userId}`
    )
  },

  subscribeToSubscriptionChanges(userId: string, callback: (subscription: Subscription) => void): RealtimeSubscription {
    return subscribeToTable<Subscription>(
      'subscriptions',
      (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          callback(payload.new)
        }
      },
      `user_id=eq.${userId}`
    )
  },
}

// Batch operations for efficiency
export const batchOperations = {
  async bulkUpdateThemes(updates: Array<{ id: string; updates: Database['public']['Tables']['themes']['Update'] }>): Promise<APIResponse<Theme[]>> {
    try {
      if (!updates.length) {
        return createErrorResponse('No updates provided')
      }

      const results: Theme[] = []
      const errors: string[] = []

      for (const { id, updates: themeUpdates } of updates) {
        const result = await themeOperations.updateTheme(id, themeUpdates)
        if (result.data) {
          results.push(result.data)
        } else if (result.error) {
          errors.push(`Theme ${id}: ${result.error}`)
        }
      }

      if (errors.length > 0) {
        return createErrorResponse(`Some updates failed: ${errors.join(', ')}`, results)
      }

      return createSuccessResponse(results, `${results.length} themes updated successfully`)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },

  async bulkDeleteAlerts(alertIds: string[]): Promise<APIResponse<null>> {
    try {
      if (!alertIds.length) {
        return createErrorResponse('No alert IDs provided')
      }

      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .in('id', alertIds)

      if (error) {
        throw handleDatabaseError(error)
      }

      return createSuccessResponse(null, `${alertIds.length} alerts deleted successfully`)
    } catch (error) {
      const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error)
      return createErrorResponse(dbError)
    }
  },
}