import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import data collectors
import { GoogleTrendsCollector } from './collectors/google-trends.ts'
import { RedditCollector } from './collectors/reddit.ts'
import { TwitterCollector } from './collectors/twitter.ts'
import { ProductHuntCollector } from './collectors/product-hunt.ts'
import { GitHubCollector } from './collectors/github.ts'
import { RateLimitManager } from './utils/rate-limit-manager.ts'
import { ErrorHandler } from './utils/error-handler.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CollectionRequest {
  themes?: string[]
  sources?: string[]
  region?: string
  forceRefresh?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { themes = [], sources = ['all'], region = 'US', forceRefresh = false }: CollectionRequest = 
      await req.json()

    // Initialize collectors and rate limit manager
    const rateLimitManager = new RateLimitManager()
    const errorHandler = new ErrorHandler()

    const collectors = {
      'google-trends': new GoogleTrendsCollector(rateLimitManager, errorHandler),
      'reddit': new RedditCollector(rateLimitManager, errorHandler),
      'twitter': new TwitterCollector(rateLimitManager, errorHandler),
      'product-hunt': new ProductHuntCollector(rateLimitManager, errorHandler),
      'github': new GitHubCollector(rateLimitManager, errorHandler),
    }

    const results = []
    const enabledSources = sources.includes('all') ? Object.keys(collectors) : sources

    // Collect data from each enabled source
    for (const source of enabledSources) {
      if (collectors[source as keyof typeof collectors]) {
        try {
          console.log(`Starting data collection from ${source}`)
          
          const collector = collectors[source as keyof typeof collectors]
          const data = await collector.collectData({
            themes,
            region,
            forceRefresh
          })

          // Store collected data in database
          if (data && data.length > 0) {
            const { error: insertError } = await supabaseClient
              .from('trend_data')
              .upsert(data, { 
                onConflict: 'theme_id,source,timestamp',
                ignoreDuplicates: false 
              })

            if (insertError) {
              console.error(`Error storing ${source} data:`, insertError)
              errorHandler.logError(`Database insert failed for ${source}`, insertError)
            } else {
              console.log(`Successfully stored ${data.length} records from ${source}`)
            }
          }

          results.push({
            source,
            status: 'success',
            recordCount: data?.length || 0,
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          console.error(`Error collecting from ${source}:`, error)
          errorHandler.logError(`Collection failed for ${source}`, error)
          
          results.push({
            source,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // Update collection metadata
    await supabaseClient
      .from('collection_runs')
      .insert({
        user_id: user.id,
        sources: enabledSources,
        results,
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalSources: enabledSources.length,
          successfulSources: results.filter(r => r.status === 'success').length,
          totalRecords: results.reduce((sum, r) => sum + (r.recordCount || 0), 0)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})