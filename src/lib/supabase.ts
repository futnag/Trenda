import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'theme-discovery-tool',
    },
  },
})

// Server-side client for API routes (with service role key)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          subscription_tier: 'free' | 'basic' | 'pro'
          stripe_customer_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          subscription_tier?: 'free' | 'basic' | 'pro'
          stripe_customer_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscription_tier?: 'free' | 'basic' | 'pro'
          stripe_customer_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      themes: {
        Row: {
          id: string
          title: string
          description?: string
          category?: string
          monetization_score?: number
          market_size?: number
          competition_level?: 'low' | 'medium' | 'high'
          technical_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_revenue_min?: number
          estimated_revenue_max?: number
          data_sources?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          category?: string
          monetization_score?: number
          market_size?: number
          competition_level?: 'low' | 'medium' | 'high'
          technical_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_revenue_min?: number
          estimated_revenue_max?: number
          data_sources?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          monetization_score?: number
          market_size?: number
          competition_level?: 'low' | 'medium' | 'high'
          technical_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_revenue_min?: number
          estimated_revenue_max?: number
          data_sources?: any
          created_at?: string
          updated_at?: string
        }
      }
      trend_data: {
        Row: {
          id: string
          theme_id: string
          source: string
          search_volume?: number
          growth_rate?: number
          geographic_data?: any
          demographic_data?: any
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          theme_id: string
          source: string
          search_volume?: number
          growth_rate?: number
          geographic_data?: any
          demographic_data?: any
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          theme_id?: string
          source?: string
          search_volume?: number
          growth_rate?: number
          geographic_data?: any
          demographic_data?: any
          timestamp?: string
          created_at?: string
        }
      }
      competitor_analysis: {
        Row: {
          id: string
          theme_id: string
          competitor_name: string
          competitor_url?: string
          pricing_model?: string
          estimated_revenue?: number
          user_count?: number
          features?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          theme_id: string
          competitor_name: string
          competitor_url?: string
          pricing_model?: string
          estimated_revenue?: number
          user_count?: number
          features?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          theme_id?: string
          competitor_name?: string
          competitor_url?: string
          pricing_model?: string
          estimated_revenue?: number
          user_count?: number
          features?: any
          created_at?: string
          updated_at?: string
        }
      }
      user_alerts: {
        Row: {
          id: string
          user_id: string
          theme_id: string
          alert_type: string
          threshold_value?: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme_id: string
          alert_type: string
          threshold_value?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme_id?: string
          alert_type?: string
          threshold_value?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id?: string
          plan_name: string
          status: string
          current_period_start?: string
          current_period_end?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string
          plan_name: string
          status: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          plan_name?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
