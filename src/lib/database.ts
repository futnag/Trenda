import { supabase } from './supabase'
import type { Database } from './supabase'

// Type aliases for easier use
export type User = Database['public']['Tables']['users']['Row']
export type Theme = Database['public']['Tables']['themes']['Row']
export type TrendData = Database['public']['Tables']['trend_data']['Row']
export type CompetitorAnalysis = Database['public']['Tables']['competitor_analysis']['Row']
export type UserAlert = Database['public']['Tables']['user_alerts']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

// User operations
export const userOperations = {
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user:', error)
      return null
    }
    
    return data
  },

  async createUser(user: Database['public']['Tables']['users']['Insert']): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
      return null
    }
    
    return data
  },

  async updateUser(userId: string, updates: Database['public']['Tables']['users']['Update']): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      return null
    }
    
    return data
  }
}

// Theme operations
export const themeOperations = {
  async getThemes(filters?: {
    category?: string
    competition_level?: string
    technical_difficulty?: string
    limit?: number
    offset?: number
  }): Promise<Theme[]> {
    let query = supabase
      .from('themes')
      .select('*')
      .order('monetization_score', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.competition_level) {
      query = query.eq('competition_level', filters.competition_level)
    }
    if (filters?.technical_difficulty) {
      query = query.eq('technical_difficulty', filters.technical_difficulty)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching themes:', error)
      return []
    }

    return data || []
  },

  async getTheme(themeId: string): Promise<Theme | null> {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .single()
    
    if (error) {
      console.error('Error fetching theme:', error)
      return null
    }
    
    return data
  },

  async getThemeWithTrendData(themeId: string): Promise<(Theme & { trend_data: TrendData[] }) | null> {
    const { data, error } = await supabase
      .from('themes')
      .select(`
        *,
        trend_data (*)
      `)
      .eq('id', themeId)
      .single()
    
    if (error) {
      console.error('Error fetching theme with trend data:', error)
      return null
    }
    
    return data as Theme & { trend_data: TrendData[] }
  },

  async getThemeWithCompetitors(themeId: string): Promise<(Theme & { competitor_analysis: CompetitorAnalysis[] }) | null> {
    const { data, error } = await supabase
      .from('themes')
      .select(`
        *,
        competitor_analysis (*)
      `)
      .eq('id', themeId)
      .single()
    
    if (error) {
      console.error('Error fetching theme with competitors:', error)
      return null
    }
    
    return data as Theme & { competitor_analysis: CompetitorAnalysis[] }
  }
}

// Trend data operations
export const trendDataOperations = {
  async getTrendDataForTheme(themeId: string, limit = 30): Promise<TrendData[]> {
    const { data, error } = await supabase
      .from('trend_data')
      .select('*')
      .eq('theme_id', themeId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching trend data:', error)
      return []
    }

    return data || []
  },

  async getLatestTrendData(source?: string): Promise<TrendData[]> {
    let query = supabase
      .from('trend_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching latest trend data:', error)
      return []
    }

    return data || []
  }
}

// User alerts operations
export const userAlertOperations = {
  async getUserAlerts(userId: string): Promise<UserAlert[]> {
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user alerts:', error)
      return []
    }

    return data || []
  },

  async createAlert(alert: Database['public']['Tables']['user_alerts']['Insert']): Promise<UserAlert | null> {
    const { data, error } = await supabase
      .from('user_alerts')
      .insert(alert)
      .select()
      .single()

    if (error) {
      console.error('Error creating alert:', error)
      return null
    }

    return data
  },

  async updateAlert(alertId: string, updates: Database['public']['Tables']['user_alerts']['Update']): Promise<UserAlert | null> {
    const { data, error } = await supabase
      .from('user_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      console.error('Error updating alert:', error)
      return null
    }

    return data
  },

  async deleteAlert(alertId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_alerts')
      .delete()
      .eq('id', alertId)

    if (error) {
      console.error('Error deleting alert:', error)
      return false
    }

    return true
  }
}

// Subscription operations
export const subscriptionOperations = {
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching user subscription:', error)
      return null
    }

    return data
  },

  async createSubscription(subscription: Database['public']['Tables']['subscriptions']['Insert']): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return null
    }

    return data
  },

  async updateSubscription(subscriptionId: string, updates: Database['public']['Tables']['subscriptions']['Update']): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return null
    }

    return data
  }
}

// Database health check
export const databaseHealth = {
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      return !error
    } catch {
      return false
    }
  },

  async getTableCounts(): Promise<Record<string, number>> {
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

    return counts
  }
}