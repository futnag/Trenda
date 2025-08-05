import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  calculateBatchMonetizationScores,
  recalculateScoresWithNewWeights,
  type MonetizationWeights 
} from '@/lib/monetization-score'
import { 
  saveBatchScoreHistory,
  getBatchScoreHistory,
  getThemesWithSignificantChanges,
  getTopPerformingThemes 
} from '@/lib/score-history'
import { supabase } from '@/lib/supabase'
import type { Theme, TrendData } from '@/types'

// =============================================================================
// REQUEST/RESPONSE SCHEMAS
// =============================================================================

const BatchRecalculateRequestSchema = z.object({
  themeIds: z.array(z.string().uuid()).min(1).max(100),
  weights: z.object({
    marketSize: z.number().min(0).max(1).optional(),
    paymentWillingness: z.number().min(0).max(1).optional(),
    competitionLevel: z.number().min(0).max(1).optional(),
    revenueModels: z.number().min(0).max(1).optional(),
    customerAcquisitionCost: z.number().min(0).max(1).optional(),
    customerLifetimeValue: z.number().min(0).max(1).optional(),
  }).optional(),
  saveToHistory: z.boolean().default(true),
  updateDatabase: z.boolean().default(true),
})

const BatchAnalysisRequestSchema = z.object({
  operation: z.enum(['significant_changes', 'top_performing']),
  thresholdPercentage: z.number().min(0).max(100).default(10),
  days: z.number().min(1).max(365).default(7),
  limit: z.number().min(1).max(100).default(10),
})

const BatchScoreResponseSchema = z.object({
  results: z.array(z.object({
    themeId: z.string().uuid(),
    score: z.number().min(0).max(100),
    factors: z.object({
      marketSize: z.number().min(0).max(100),
      paymentWillingness: z.number().min(0).max(100),
      competitionLevel: z.number().min(0).max(100),
      revenueModels: z.number().min(0).max(100),
      customerAcquisitionCost: z.number().min(0).max(100),
      customerLifetimeValue: z.number().min(0).max(100),
    }),
    success: z.boolean(),
    error: z.string().optional(),
  })),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
    averageScore: z.number(),
    processingTimeMs: z.number(),
  }),
})

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getThemesWithTrendData(themeIds: string[]): Promise<{
  themes: Theme[]
  trendDataMap: Map<string, TrendData[]>
}> {
  try {
    // Get themes
    const { data: themesData, error: themesError } = await supabase
      .from('themes')
      .select('*')
      .in('id', themeIds)

    if (themesError) {
      console.error('Error fetching themes:', themesError)
      return { themes: [], trendDataMap: new Map() }
    }

    // Get trend data for all themes
    const { data: trendData, error: trendError } = await supabase
      .from('trend_data')
      .select('*')
      .in('theme_id', themeIds)
      .order('timestamp', { ascending: false })

    const trendDataMap = new Map<string, TrendData[]>()
    
    if (!trendError && trendData) {
      trendData.forEach((trend: TrendData) => {
        if (!trendDataMap.has(trend.themeId)) {
          trendDataMap.set(trend.themeId, [])
        }
        trendDataMap.get(trend.themeId)!.push(trend)
      })
    }

    return {
      themes: themesData as Theme[],
      trendDataMap,
    }
  } catch (error) {
    console.error('Error fetching themes and trend data:', error)
    return { themes: [], trendDataMap: new Map() }
  }
}

async function updateThemesInDatabase(themes: Theme[]): Promise<{
  successful: number
  failed: number
  errors: string[]
}> {
  let successful = 0
  let failed = 0
  const errors: string[] = []

  for (const theme of themes) {
    try {
      const { error } = await supabase
        .from('themes')
        .update({
          monetization_score: theme.monetizationScore,
          monetization_factors: theme.monetizationFactors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', theme.id)

      if (error) {
        failed++
        errors.push(`Theme ${theme.id}: ${error.message}`)
      } else {
        successful++
      }
    } catch (error) {
      failed++
      errors.push(`Theme ${theme.id}: ${error}`)
    }
  }

  return { successful, failed, errors }
}

function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      error: {
        code: 'BATCH_MONETIZATION_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

// =============================================================================
// POST ENDPOINT - Batch recalculate monetization scores
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const validatedRequest = BatchRecalculateRequestSchema.parse(body)

    const { themes, trendDataMap } = await getThemesWithTrendData(validatedRequest.themeIds)

    if (themes.length === 0) {
      return createErrorResponse('No themes found for the provided IDs', 404)
    }

    // Calculate scores
    const updatedThemes = calculateBatchMonetizationScores(
      themes,
      trendDataMap,
      { weights: validatedRequest.weights }
    )

    const results = []
    const scoreHistoryEntries = []
    let totalScore = 0
    let successful = 0
    let failed = 0

    for (const theme of updatedThemes) {
      try {
        results.push({
          themeId: theme.id,
          score: theme.monetizationScore,
          factors: theme.monetizationFactors!,
          success: true,
        })

        if (validatedRequest.saveToHistory) {
          scoreHistoryEntries.push({
            themeId: theme.id,
            score: theme.monetizationScore,
            factors: theme.monetizationFactors!,
            metadata: {
              batchUpdate: true,
              customWeights: validatedRequest.weights,
              timestamp: new Date().toISOString(),
            },
          })
        }

        totalScore += theme.monetizationScore
        successful++
      } catch (error) {
        results.push({
          themeId: theme.id,
          score: 0,
          factors: theme.monetizationFactors || {
            marketSize: 0,
            paymentWillingness: 0,
            competitionLevel: 0,
            revenueModels: 0,
            customerAcquisitionCost: 0,
            customerLifetimeValue: 0,
          },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failed++
      }
    }

    // Save to history
    if (validatedRequest.saveToHistory && scoreHistoryEntries.length > 0) {
      await saveBatchScoreHistory(scoreHistoryEntries)
    }

    // Update database
    if (validatedRequest.updateDatabase) {
      await updateThemesInDatabase(updatedThemes)
    }

    const processingTime = Date.now() - startTime
    const averageScore = successful > 0 ? totalScore / successful : 0

    return NextResponse.json({
      results,
      summary: {
        total: themes.length,
        successful,
        failed,
        averageScore: Math.round(averageScore * 100) / 100,
        processingTimeMs: processingTime,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    console.error('Error in POST /api/themes/batch-monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// =============================================================================
// PUT ENDPOINT - Recalculate all themes with new weights
// =============================================================================

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    const requestSchema = z.object({
      weights: z.object({
        marketSize: z.number().min(0).max(1).optional(),
        paymentWillingness: z.number().min(0).max(1).optional(),
        competitionLevel: z.number().min(0).max(1).optional(),
        revenueModels: z.number().min(0).max(1).optional(),
        customerAcquisitionCost: z.number().min(0).max(1).optional(),
        customerLifetimeValue: z.number().min(0).max(1).optional(),
      }),
      limit: z.number().min(1).max(1000).default(100),
      saveToHistory: z.boolean().default(true),
    })

    const validatedRequest = requestSchema.parse(body)

    // Get themes with existing monetization factors
    const { data: themes, error } = await supabase
      .from('themes')
      .select('*')
      .not('monetization_factors', 'is', null)
      .limit(validatedRequest.limit)

    if (error) {
      throw error
    }

    if (!themes || themes.length === 0) {
      return createErrorResponse('No themes with monetization factors found', 404)
    }

    // Recalculate scores with new weights
    const updatedThemes = recalculateScoresWithNewWeights(
      themes as Theme[],
      validatedRequest.weights
    )

    const results = []
    const scoreHistoryEntries = []
    let totalScore = 0
    let successful = 0

    for (const theme of updatedThemes) {
      results.push({
        themeId: theme.id,
        score: theme.monetizationScore,
        factors: theme.monetizationFactors!,
        success: true,
      })

      if (validatedRequest.saveToHistory) {
        scoreHistoryEntries.push({
          themeId: theme.id,
          score: theme.monetizationScore,
          factors: theme.monetizationFactors!,
          metadata: {
            weightUpdate: true,
            newWeights: validatedRequest.weights,
            timestamp: new Date().toISOString(),
          },
        })
      }

      totalScore += theme.monetizationScore
      successful++
    }

    // Save to history
    if (validatedRequest.saveToHistory && scoreHistoryEntries.length > 0) {
      await saveBatchScoreHistory(scoreHistoryEntries)
    }

    // Update database
    await updateThemesInDatabase(updatedThemes)

    const processingTime = Date.now() - startTime
    const averageScore = successful > 0 ? totalScore / successful : 0

    return NextResponse.json({
      results,
      summary: {
        total: themes.length,
        successful,
        failed: 0,
        averageScore: Math.round(averageScore * 100) / 100,
        processingTimeMs: processingTime,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    console.error('Error in PUT /api/themes/batch-monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// =============================================================================
// GET ENDPOINT - Batch analysis operations
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation') as 'significant_changes' | 'top_performing' | null
    const thresholdPercentage = Number(searchParams.get('thresholdPercentage')) || 10
    const days = Number(searchParams.get('days')) || 7
    const limit = Number(searchParams.get('limit')) || 10

    if (!operation) {
      return createErrorResponse('Operation parameter is required', 400)
    }

    const validatedRequest = BatchAnalysisRequestSchema.parse({
      operation,
      thresholdPercentage,
      days,
      limit,
    })

    let results: any[] = []

    switch (validatedRequest.operation) {
      case 'significant_changes':
        results = await getThemesWithSignificantChanges(
          validatedRequest.thresholdPercentage,
          validatedRequest.days
        )
        break

      case 'top_performing':
        results = await getTopPerformingThemes(
          validatedRequest.limit,
          validatedRequest.days
        )
        break

      default:
        return createErrorResponse('Invalid operation', 400)
    }

    return NextResponse.json({
      operation: validatedRequest.operation,
      parameters: {
        thresholdPercentage: validatedRequest.thresholdPercentage,
        days: validatedRequest.days,
        limit: validatedRequest.limit,
      },
      results,
      count: results.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    console.error('Error in GET /api/themes/batch-monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// =============================================================================
// DELETE ENDPOINT - Cleanup old score history
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const retentionDays = Number(searchParams.get('retentionDays')) || 365

    if (retentionDays < 30) {
      return createErrorResponse('Retention days must be at least 30', 400)
    }

    // This would typically be restricted to admin users
    // Add authentication check here

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const { data, error } = await supabase
      .from('score_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw error
    }

    const deletedCount = data?.length || 0

    return NextResponse.json({
      message: `Cleaned up old score history`,
      deletedCount,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error('Error in DELETE /api/themes/batch-monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}