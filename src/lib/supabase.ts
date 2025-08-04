import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    }
  }
}
