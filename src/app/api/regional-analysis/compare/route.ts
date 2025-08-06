import { NextRequest, NextResponse } from 'next/server'
import { regionalAnalysisOperations } from '../../../../lib/regional-database'
import { CountryCodeSchema } from '../../../../types/regional'
import { z } from 'zod'

const CompareRegionsSchema = z.object({
  regions: z.array(CountryCodeSchema).min(2).max(5),
  themeIds: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string()).optional(),
  includeOpportunities: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CompareRegionsSchema.parse(body)

    const response = await regionalAnalysisOperations.compareRegions(
      validatedData.regions,
      {
        themeIds: validatedData.themeIds,
        categories: validatedData.categories,
        includeOpportunities: validatedData.includeOpportunities,
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
    console.error('Regional comparison API error:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionsParam = searchParams.get('regions')
    const themeIdsParam = searchParams.get('themeIds')
    const categoriesParam = searchParams.get('categories')
    const includeOpportunities = searchParams.get('includeOpportunities')

    if (!regionsParam) {
      return NextResponse.json(
        { error: 'Regions parameter is required' },
        { status: 400 }
      )
    }

    const requestData = {
      regions: regionsParam.split(','),
      themeIds: themeIdsParam ? themeIdsParam.split(',') : undefined,
      categories: categoriesParam ? categoriesParam.split(',') : undefined,
      includeOpportunities: includeOpportunities === 'true',
    }

    const validatedData = CompareRegionsSchema.parse(requestData)

    const response = await regionalAnalysisOperations.compareRegions(
      validatedData.regions,
      {
        themeIds: validatedData.themeIds,
        categories: validatedData.categories,
        includeOpportunities: validatedData.includeOpportunities,
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
    console.error('Regional comparison API error:', error)
    
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