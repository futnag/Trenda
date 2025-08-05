import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  calculateMonetizationScore,
  calculateScoreBreakdown,
  updateThemeWithMonetizationScore,
  normalizeWeights,
  type MonetizationWeights 
} from '@/lib/monetization-score'
import { 
  saveScoreHistory, 
  analyzeThemeScoreTrend,
  getScoreStatistics 
} from '@/lib/score-history'
import { supabase } from '@/lib/supabase'
import type { Theme, TrendData, MonetizationFactors } from '@/types'

// =============================================================================
// REQUEST/RESPONSE SCHEMAS
// =============================================================================

const RecalculateScoreRequestSchema = z.object({
  weights: z.object({
    marketSize: z.number().min(0).max(1).optional(),
    paymentWillingness: z.number().min(0).max(1).optional(),
    competitionLevel: z.number().min(0).max(1).optional(),
    revenueModels: z.number().min(0).max(1).optional(),
    customerAcquisitionCost: z.number().min(0).max(1).optional(),
    customerLifetimeValue: z.number().min(0).max(1).optional(),
  }).optional(),
  saveToHistory: z.boolean().default(true),
  includeAnalysis: z.boolean().default(false),
})

const MonetizationScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.object({
    marketSize: z.number().min(0).max(100),
    paymentWillingness: z.number().min(0).max(100),
    competitionLevel: z.number().min(0).max(100),
    revenueModels: z.number().min(0).max(100),
    customerAcquisitionCost: z.number().min(0).max(100),
    customerLifetimeValue: z.number().min(0).max(100),
  }),
  breakdown: z.record(z.number()),
  analysis: z.object({
    currentScore: z.number(),
    previousScore: z.number().optional(),
    trend: z.enum(['increasing', 'decreasing', 'stable']),
    changePercentage: z.number(),
    volatility: z.number(),
    confidence: z.number(),
    factors: z.object({
      strongest: z.string(),
      weakest: z.string(),
      mostImproved: z.string().optional(),
      mostDeclined: z.string().optional(),
    }),
  }).optional(),
  statistics: z.object({
    current: z.number().nullable(),
    average: z.number(),
    min: z.number(),
    max: z.number(),
    totalEntries: z.number(),
    firstRecorded: z.string().nullable(),
    lastRecorded: z.string().nullable(),
  }).optional(),
})

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getThemeWithTrendData(themeId: string): Promise<{
  theme: Theme | null
  trendData: TrendData[]
}> {
  try {
    // Get theme data
    const { data: themeData, error: themeError } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .single()

    if (themeError || !themeData) {
      return { theme: null, trendData: [] }
    }

    // Get recent trend data
    const { data: trendData, error: trendError } = await supabase
      .from('trend_data')
      .select('*')
      .eq('theme_id', themeId)
      .order('timestamp', { ascending: false })
      .limit(10)

    return {
      theme: themeData as Theme,
      trendData: trendError ? [] : (trendData as TrendData[]),
    }
  } catch (error) {
    console.error('Error fetching theme and trend data:', error)
    return { theme: null, trendData: [] }
  }
}

function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      error: {
        code: 'MONETIZATION_SCORE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

// =============================================================================
// GET ENDPOINT - Retrieve current monetization score and analysis
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAnalysis = searchParams.get('includeAnalysis') === 'true'
    const includeStatistics = searchParams.get('includeStatistics') === 'true'

    const { theme, trendData } = await getThemeWithTrendData(params.id)

    if (!theme) {
      return createErrorResponse('Theme not found', 404)
    }

    // If theme doesn't have monetization factors, calculate them
    let factors = theme.monetizationFactors
    let score = theme.monetizationScore

    if (!factors) {
      const updatedTheme = updateThemeWithMonetizationScore(theme, trendData)
      factors = updatedTheme.monetizationFactors!
      score = updatedTheme.monetizationScore

      // Update the theme in database
      await supabase
        .from('themes')
        .update({
          monetization_score: score,
          monetization_factors: factors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
    }

    const breakdown = calculateScoreBreakdown(factors)

    const response: any = {
      score,
      factors,
      breakdown,
    }

    // Add trend analysis if requested
    if (includeAnalysis) {
      const analysis = await analyzeThemeScoreTrend(params.id, score, factors)
      if (analysis) {
        response.analysis = analysis
      }
    }

    // Add statistics if requested
    if (includeStatistics) {
      const statistics = await getScoreStatistics(params.id)
      if (statistics) {
        response.statistics = statistics
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/themes/[id]/monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// =============================================================================
// POST ENDPOINT - Recalculate monetization score with custom weights
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedRequest = RecalculateScoreRequestSchema.parse(body)

    const { theme, trendData } = await getThemeWithTrendData(params.id)

    if (!theme) {
      return createErrorResponse('Theme not found', 404)
    }

    // Calculate new score with custom weights
    const updatedTheme = updateThemeWithMonetizationScore(
      theme, 
      trendData, 
      { weights: validatedRequest.weights }
    )

    const factors = updatedTheme.monetizationFactors!
    const score = updatedTheme.monetizationScore
    const breakdown = calculateScoreBreakdown(factors, validatedRequest.weights)

    // Save to history if requested
    if (validatedRequest.saveToHistory) {
      await saveScoreHistory(params.id, score, factors, {
        customWeights: validatedRequest.weights,
        recalculated: true,
        timestamp: new Date().toISOString(),
      })
    }

    // Update theme in database
    await supabase
      .from('themes')
      .update({
        monetization_score: score,
        monetization_factors: factors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    const response: any = {
      score,
      factors,
      breakdown,
    }

    // Add analysis if requested
    if (validatedRequest.includeAnalysis) {
      const analysis = await analyzeThemeScoreTrend(params.id, score, factors)
      if (analysis) {
        response.analysis = analysis
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    console.error('Error in POST /api/themes/[id]/monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// =============================================================================
// PUT ENDPOINT - Update monetization factors manually
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate factors
    const factorsSchema = z.object({
      marketSize: z.number().min(0).max(100),
      paymentWillingness: z.number().min(0).max(100),
      competitionLevel: z.number().min(0).max(100),
      revenueModels: z.number().min(0).max(100),
      customerAcquisitionCost: z.number().min(0).max(100),
      customerLifetimeValue: z.number().min(0).max(100),
    })

    const factors = factorsSchema.parse(body.factors)
    const weights = body.weights as Partial<MonetizationWeights> | undefined

    // Calculate new score
    const score = calculateMonetizationScore(factors, weights)
    const breakdown = calculateScoreBreakdown(factors, weights)

    // Save to history
    await saveScoreHistory(params.id, score, factors, {
      manualUpdate: true,
      customWeights: weights,
      timestamp: new Date().toISOString(),
    })

    // Update theme in database
    const { error } = await supabase
      .from('themes')
      .update({
        monetization_score: score,
        monetization_factors: factors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      score,
      factors,
      breakdown,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    console.error('Error in PUT /api/themes/[id]/monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// =============================================================================
// DELETE ENDPOINT - Reset monetization score to auto-calculated value
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { theme, trendData } = await getThemeWithTrendData(params.id)

    if (!theme) {
      return createErrorResponse('Theme not found', 404)
    }

    // Recalculate with default algorithm
    const updatedTheme = updateThemeWithMonetizationScore(theme, trendData)
    const factors = updatedTheme.monetizationFactors!
    const score = updatedTheme.monetizationScore

    // Save to history
    await saveScoreHistory(params.id, score, factors, {
      reset: true,
      timestamp: new Date().toISOString(),
    })

    // Update theme in database
    const { error } = await supabase
      .from('themes')
      .update({
        monetization_score: score,
        monetization_factors: factors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      score,
      factors,
      breakdown: calculateScoreBreakdown(factors),
      message: 'Monetization score reset to auto-calculated value',
    })
  } catch (error) {
    console.error('Error in DELETE /api/themes/[id]/monetization-score:', error)
    return createErrorResponse('Internal server error', 500)
  }
}