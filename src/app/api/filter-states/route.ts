import { NextRequest, NextResponse } from 'next/server'
import { filterStateOperations } from '../../../lib/regional-database'
import { SaveFilterStateRequestSchema } from '../../../types/regional'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const includePublic = searchParams.get('includePublic') !== 'false'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const response = await filterStateOperations.getUserFilterStates(
      userId,
      includePublic
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
    console.error('Get filter states API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...filterData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const validatedData = SaveFilterStateRequestSchema.parse(filterData)

    const response = await filterStateOperations.saveFilterState(
      userId,
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
      message: response.message,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Save filter state API error:', error)
    
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const filterId = searchParams.get('filterId')

    if (!userId || !filterId) {
      return NextResponse.json(
        { error: 'User ID and Filter ID are required' },
        { status: 400 }
      )
    }

    const response = await filterStateOperations.deleteFilterState(
      userId,
      filterId
    )

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: response.message,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete filter state API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}