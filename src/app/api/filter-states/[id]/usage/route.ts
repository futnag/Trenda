import { NextRequest, NextResponse } from 'next/server'
import { filterStateOperations } from '../../../../../lib/regional-database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filterId = params.id

    if (!filterId) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      )
    }

    const response = await filterStateOperations.incrementFilterUsage(filterId)

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
    console.error('Increment filter usage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}