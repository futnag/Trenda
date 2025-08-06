import { NextRequest, NextResponse } from 'next/server'
import { regionalAnalysisOperations } from '../../../../lib/regional-database'
import { CountryCodeSchema } from '../../../../types/regional'
import { z } from 'zod'

const GetRegionalTrendsSchema = z.object({
  regions: z.array(CountryCodeSchema).min(1).max(10),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionsParam = searchParams.get('regions')

    if (!regionsParam) {
      return NextResponse.json(
        { error: 'Regions parameter is required' },
        { status: 400 }
      )
    }

    const regions = regionsParam.split(',')
    const validatedData = GetRegionalTrendsSchema.parse({ regions })

    const response = await regionalAnalysisOperations.getRegionalTrends(
      validatedData.regions
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
    console.error('Regional trends API error:', error)
    
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