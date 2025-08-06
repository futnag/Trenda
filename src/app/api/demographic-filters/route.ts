import { NextRequest, NextResponse } from 'next/server'
import { demographicFilterOperations } from '../../../lib/regional-database'
import { DemographicFilterRequestSchema } from '../../../types/regional'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = DemographicFilterRequestSchema.parse(body)

    const response = await demographicFilterOperations.filterThemesByDemographics(
      validatedData
    )

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: response.data,
      pagination: response.pagination,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Demographic filters API error:', error)
    
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