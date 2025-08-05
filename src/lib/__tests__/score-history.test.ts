import {
  saveScoreHistory,
  getScoreHistory,
  getRecentScoreHistoryFromDB,
  analyzeThemeScoreTrend,
  getScoreStatistics,
  cleanupOldScoreHistory,
  saveBatchScoreHistory,
  getBatchScoreHistory,
  getThemesWithSignificantChanges,
  getTopPerformingThemes,
} from '../score-history'
import type { MonetizationFactors } from '@/types'
import { supabase } from '../supabase'

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
            gte: jest.fn(() => ({
              order: jest.fn(),
            })),
          })),
          gte: jest.fn(() => ({
            order: jest.fn(),
          })),
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(),
            })),
          })),
          lt: jest.fn(() => ({
            select: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        lt: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
    })),
  },
}))

// =============================================================================
// TEST DATA
// =============================================================================

const mockFactors: MonetizationFactors = {
  marketSize: 80,
  paymentWillingness: 70,
  competitionLevel: 30,
  revenueModels: 60,
  customerAcquisitionCost: 40,
  customerLifetimeValue: 75,
}

const mockThemeId = '123e4567-e89b-12d3-a456-426614174000'

const mockScoreHistoryRecord = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  theme_id: mockThemeId,
  score: 75,
  factors: mockFactors,
  metadata: { source: 'test' },
  created_at: '2024-01-01T00:00:00Z',
}

const mockScoreHistoryRecords = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    theme_id: mockThemeId,
    score: 75,
    factors: mockFactors,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    theme_id: mockThemeId,
    score: 70,
    factors: mockFactors,
    metadata: null,
    created_at: '2023-12-31T00:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    theme_id: mockThemeId,
    score: 65,
    factors: mockFactors,
    metadata: null,
    created_at: '2023-12-30T00:00:00Z',
  },
]

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks()
})

// =============================================================================
// SAVE SCORE HISTORY TESTS
// =============================================================================

describe('saveScoreHistory', () => {
  test('saves score history successfully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockScoreHistoryRecord,
            error: null,
          }),
        }),
      }),
    })

    const result = await saveScoreHistory(mockThemeId, 75, mockFactors, { source: 'test' })

    expect(result).toEqual({
      score: 75,
      factors: mockFactors,
      timestamp: '2024-01-01T00:00:00Z',
      metadata: { source: 'test' },
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('handles database error gracefully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    })

    const result = await saveScoreHistory(mockThemeId, 75, mockFactors)

    expect(result).toBeNull()
  })

  test('handles metadata correctly', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockScoreHistoryRecord, metadata: null },
            error: null,
          }),
        }),
      }),
    })

    const result = await saveScoreHistory(mockThemeId, 75, mockFactors)

    expect(result?.metadata).toBeUndefined()
  })
})

// =============================================================================
// GET SCORE HISTORY TESTS
// =============================================================================

describe('getScoreHistory', () => {
  test('retrieves score history successfully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockScoreHistoryRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    const result = await getScoreHistory(mockThemeId, 100)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      score: 75,
      factors: mockFactors,
      timestamp: '2024-01-01T00:00:00Z',
      metadata: undefined,
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('handles database error gracefully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    })

    const result = await getScoreHistory(mockThemeId)

    expect(result).toEqual([])
  })

  test('uses default limit when not specified', async () => {
    const mockSupabase = supabase as any
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null })
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    })

    await getScoreHistory(mockThemeId)

    expect(mockLimit).toHaveBeenCalledWith(100)
  })
})

// =============================================================================
// RECENT SCORE HISTORY TESTS
// =============================================================================

describe('getRecentScoreHistoryFromDB', () => {
  test('retrieves recent score history with date filter', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockScoreHistoryRecords.slice(0, 2),
              error: null,
            }),
          }),
        }),
      }),
    })

    const result = await getRecentScoreHistoryFromDB(mockThemeId, 30)

    expect(result).toHaveLength(2)
    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('uses default days when not specified', async () => {
    const mockSupabase = supabase as any
    const mockGte = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: mockGte,
        }),
      }),
    })

    await getRecentScoreHistoryFromDB(mockThemeId)

    // Should be called with a date 30 days ago
    expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String))
  })
})

// =============================================================================
// SCORE TREND ANALYSIS TESTS
// =============================================================================

describe('analyzeThemeScoreTrend', () => {
  test('analyzes score trend successfully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockScoreHistoryRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    const result = await analyzeThemeScoreTrend(mockThemeId, 80, mockFactors)

    expect(result).toBeDefined()
    expect(result?.currentScore).toBe(80)
    expect(result?.trend).toMatch(/increasing|decreasing|stable/)
  })

  test('handles database error gracefully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    })

    const result = await analyzeThemeScoreTrend(mockThemeId, 80, mockFactors)

    // Should still return analysis with empty history, not null
    expect(result).toBeDefined()
    expect(result?.currentScore).toBe(80)
  })
})

// =============================================================================
// SCORE STATISTICS TESTS
// =============================================================================

describe('getScoreStatistics', () => {
  test('calculates score statistics correctly', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockScoreHistoryRecords.map(record => ({
              score: record.score,
              created_at: record.created_at,
            })),
            error: null,
          }),
        }),
      }),
    })

    const result = await getScoreStatistics(mockThemeId)

    expect(result).toBeDefined()
    expect(result?.current).toBe(75) // Most recent score
    expect(result?.average).toBeCloseTo(70, 1) // (75 + 70 + 65) / 3
    expect(result?.min).toBe(65)
    expect(result?.max).toBe(75)
    expect(result?.totalEntries).toBe(3)
    expect(result?.firstRecorded).toBe('2023-12-30T00:00:00Z')
    expect(result?.lastRecorded).toBe('2024-01-01T00:00:00Z')
  })

  test('handles empty data correctly', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    const result = await getScoreStatistics(mockThemeId)

    expect(result).toEqual({
      current: null,
      average: 0,
      min: 0,
      max: 0,
      totalEntries: 0,
      firstRecorded: null,
      lastRecorded: null,
    })
  })
})

// =============================================================================
// CLEANUP TESTS
// =============================================================================

describe('cleanupOldScoreHistory', () => {
  test('cleans up old records successfully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: '1' }, { id: '2' }],
            error: null,
          }),
        }),
      }),
    })

    const result = await cleanupOldScoreHistory(365)

    expect(result).toBe(2)
    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('uses default retention days when not specified', async () => {
    const mockSupabase = supabase as any
    const mockLt = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    
    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        lt: mockLt,
      }),
    })

    await cleanupOldScoreHistory()

    expect(mockLt).toHaveBeenCalledWith('created_at', expect.any(String))
  })

  test('handles database error gracefully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    })

    const result = await cleanupOldScoreHistory()

    expect(result).toBe(0)
  })
})

// =============================================================================
// BATCH OPERATIONS TESTS
// =============================================================================

describe('saveBatchScoreHistory', () => {
  test('saves multiple score history entries', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockScoreHistoryRecords,
          error: null,
        }),
      }),
    })

    const entries = [
      { themeId: mockThemeId, score: 75, factors: mockFactors },
      { themeId: 'another-theme', score: 80, factors: mockFactors },
    ]

    const result = await saveBatchScoreHistory(entries)

    expect(result).toHaveLength(3)
    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('handles database error gracefully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    })

    const entries = [
      { themeId: mockThemeId, score: 75, factors: mockFactors },
    ]

    const result = await saveBatchScoreHistory(entries)

    expect(result).toEqual([])
  })
})

describe('getBatchScoreHistory', () => {
  test('retrieves score history for multiple themes', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockScoreHistoryRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    const themeIds = [mockThemeId, 'another-theme']
    const result = await getBatchScoreHistory(themeIds, 50)

    expect(result).toBeInstanceOf(Map)
    expect(result.has(mockThemeId)).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('handles empty theme IDs array', async () => {
    const result = await getBatchScoreHistory([], 50)

    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })
})

// =============================================================================
// TREND ANALYSIS FUNCTIONS TESTS
// =============================================================================

describe('getThemesWithSignificantChanges', () => {
  test('identifies themes with significant score changes', async () => {
    const mockData = [
      { theme_id: mockThemeId, score: 80, created_at: '2024-01-01T00:00:00Z' },
      { theme_id: mockThemeId, score: 60, created_at: '2023-12-31T00:00:00Z' },
      { theme_id: 'another-theme', score: 70, created_at: '2024-01-01T00:00:00Z' },
      { theme_id: 'another-theme', score: 65, created_at: '2023-12-31T00:00:00Z' },
    ]

    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    })

    const result = await getThemesWithSignificantChanges(10, 7)

    expect(result).toBeInstanceOf(Array)
    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('uses default parameters when not specified', async () => {
    const mockSupabase = supabase as any
    const mockGte = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: mockGte,
      }),
    })

    await getThemesWithSignificantChanges()

    expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String))
  })
})

describe('getTopPerformingThemes', () => {
  test('retrieves top performing themes', async () => {
    const mockData = [
      { theme_id: mockThemeId, score: 80, created_at: '2024-01-01T00:00:00Z' },
      { theme_id: mockThemeId, score: 75, created_at: '2023-12-31T00:00:00Z' },
      { theme_id: 'another-theme', score: 70, created_at: '2024-01-01T00:00:00Z' },
    ]

    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    })

    const result = await getTopPerformingThemes(10, 30)

    expect(result).toBeInstanceOf(Array)
    expect(mockSupabase.from).toHaveBeenCalledWith('score_history')
  })

  test('uses default parameters when not specified', async () => {
    const mockSupabase = supabase as any
    const mockGte = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: mockGte,
      }),
    })

    await getTopPerformingThemes()

    expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String))
  })

  test('handles database error gracefully', async () => {
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    })

    const result = await getTopPerformingThemes()

    expect(result).toEqual([])
  })
})