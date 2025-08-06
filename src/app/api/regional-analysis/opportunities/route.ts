import { NextRequest, NextResponse } from 'next/server'
import { regionalAnalysisOperations } from '../../../../lib/regional-database'
import { CountryCodeSchema } from '../../../../types/regional'
import { z } from 'zod'

const GetOpportunitiesSchema = z.object({
  region: CountryCodeSchema,
  themeIds: z.array(z.string().uuid()).optional(),
  minMarketGap: z.number().min(0).max(100).optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  limit: z.number().min(1).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const themeIdsParam = searchParams.get('themeIds')
    const minMarketGap = searchParams.get('minMarketGap')
    const minConfidence = searchParams.get('minConfidence')
    const limit = searchParams.get('limit')

    if (!region) {
      return NextResponse.json(
        { error: 'Region parameter is required' },
        { status: 400 }
      )
    }

    const requestData = {
      region,
      themeIds: themeIdsParam ? themeIdsParam.split(',') : undefined,
      minMarketGap: minMarketGap ? parseInt(minMarketGap) : undefined,
      minConfidence: minConfidence ? parseInt(minConfidence) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    }

    const validatedData = GetOpportunitiesSchema.parse(requestData)

    const response = await regionalAnalysisOperations.getLocalizedOpportunities(
      validatedData.region,
      {
        themeIds: validatedData.themeIds,
        minMarketGap: validatedData.minMarketGap,
        minConfidence: validatedData.minConfidence,
        limit: validatedData.limit,
      }
    )

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: response.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Localized opportunities API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}