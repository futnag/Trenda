import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { operation, data, options } = await request.json()

    // Validate operation
    const validOperations = ['normalize', 'batch_update', 'realtime_sync', 'analyze_themes']
    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation' },
        { status: 400 }
      )
    }

    // Call the Supabase Edge Function
    const { data: result, error } = await supabase.functions.invoke('process-trend-data', {
      body: {
        operation,
        data,
        options: {
          batchSize: 100,
          forceUpdate: false,
          notifyUsers: true,
          ...options
        }
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return NextResponse.json(
        { error: 'Processing failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation')

    // Get recent processing jobs
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('job_type', operation || 'batch_update')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch processing status' },
        { status: 500 }
      )
    }

    // Get overall system status
    const { data: stats, error: statsError } = await supabase
      .from('themes')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)

    const lastUpdate = stats?.[0]?.updated_at || null

    return NextResponse.json({
      jobs: jobs || [],
      lastUpdate,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}