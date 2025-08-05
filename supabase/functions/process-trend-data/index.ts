import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import data processors
import { DataNormalizer } from './processors/data-normalizer.ts'
import { BatchProcessor } from './processors/batch-processor.ts'
import { RealtimeUpdater } from './processors/realtime-updater.ts'
import { ThemeAnalyzer } from './processors/theme-analyzer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingRequest {
  operation: 'normalize' | 'batch_update' | 'realtime_sync' | 'analyze_themes'
  data?: any
  options?: {
    batchSize?: number
    forceUpdate?: boolean
    notifyUsers?: boolean
  }
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

    // Verify user authentication for user-initiated requests
    const authHeader = req.headers.get('Authorization')
    let user = null
    
    if (authHeader) {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      user = authUser
    }

    const { operation, data, options = {} }: ProcessingRequest = await req.json()

    // Initialize processors
    const dataNormalizer = new DataNormalizer(supabaseClient)
    const batchProcessor = new BatchProcessor(supabaseClient)
    const realtimeUpdater = new RealtimeUpdater(supabaseClient)
    const themeAnalyzer = new ThemeAnalyzer(supabaseClient)

    let result: any

    switch (operation) {
      case 'normalize':
        console.log('Starting data normalization process')
        result = await dataNormalizer.normalizeCollectedData(data, options)
        break

      case 'batch_update':
        console.log('Starting batch update process')
        result = await batchProcessor.processBatchUpdates(options)
        break

      case 'realtime_sync':
        console.log('Starting realtime synchronization')
        result = await realtimeUpdater.syncRealtimeUpdates(options)
        break

      case 'analyze_themes':
        console.log('Starting theme analysis')
        result = await themeAnalyzer.analyzeAndUpdateThemes(options)
        break

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Data processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Data processing failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})