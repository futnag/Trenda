import { DataProcessingClient, dataProcessingClient } from '../data-processing'

// Mock fetch
global.fetch = jest.fn()

describe('DataProcessingClient', () => {
  let client: DataProcessingClient

  beforeEach(() => {
    client = new DataProcessingClient('/api')
    jest.clearAllMocks()
  })

  describe('normalizeData', () => {
    it('should normalize raw data successfully', async () => {
      const mockResponse = {
        success: true,
        operation: 'normalize',
        result: {
          normalized: [
            {
              theme_id: 'test-theme-id',
              source: 'google-trends',
              search_volume: 1000,
              growth_rate: 15.5,
              timestamp: '2024-01-01T00:00:00Z'
            }
          ],
          errors: [],
          summary: {
            total: 1,
            processed: 1,
            skipped: 0,
            errors: 0,
            successRate: 100
          }
        },
        timestamp: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const rawData = [
        {
          source: 'google-trends',
          search_volume: 1000,
          growth_rate: 15.5,
          timestamp: '2024-01-01T00:00:00Z',
          keywords: ['test theme']
        }
      ]

      const result = await client.normalizeData(rawData)

      expect(fetch).toHaveBeenCalledWith('/api/process-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'normalize',
          data: rawData,
          options: {
            validateData: true,
            enrichData: true,
            deduplicateData: true
          }
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle normalization errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const rawData = [{ invalid: 'data' }]

      await expect(client.normalizeData(rawData)).rejects.toThrow('HTTP error! status: 500')
    })
  })

  describe('processBatchUpdates', () => {
    it('should process batch updates successfully', async () => {
      const mockResponse = {
        success: true,
        operation: 'batch_update',
        result: {
          processed: 50,
          updated: 25,
          errors: 0,
          duration: 5000,
          details: [
            {
              operation: 'trend_data_processing',
              processed: 30,
              updated: 15,
              errors: 0
            },
            {
              operation: 'monetization_scores',
              processed: 20,
              updated: 10,
              errors: 0
            }
          ]
        },
        timestamp: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.processBatchUpdates({
        batchSize: 50,
        forceUpdate: true
      })

      expect(fetch).toHaveBeenCalledWith('/api/process-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'batch_update',
          options: {
            batchSize: 50,
            forceUpdate: true,
            updateThemes: true,
            updateScores: true
          }
        })
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('syncRealtimeUpdates', () => {
    it('should sync real-time updates successfully', async () => {
      const mockResponse = {
        success: true,
        operation: 'realtime_sync',
        result: {
          updates_sent: 10,
          notifications_sent: 5,
          errors: 0,
          details: [
            {
              change_id: 'theme_update_123',
              type: 'theme_update',
              status: 'processed',
              timestamp: '2024-01-01T00:00:00Z'
            }
          ]
        },
        timestamp: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.syncRealtimeUpdates()

      expect(fetch).toHaveBeenCalledWith('/api/process-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'realtime_sync',
          options: {
            notifyUsers: true,
            broadcastChanges: true,
            updateDashboard: true,
            triggerAlerts: true
          }
        })
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('analyzeThemes', () => {
    it('should analyze themes successfully', async () => {
      const mockResponse = {
        success: true,
        operation: 'analyze_themes',
        result: {
          themes_analyzed: 25,
          themes_updated: 15,
          new_insights: 8,
          errors: 0,
          details: [
            {
              operation: 'new_theme_analysis',
              analyzed: 10,
              updated: 8,
              insights: 5,
              errors: 0
            }
          ]
        },
        timestamp: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.analyzeThemes()

      expect(fetch).toHaveBeenCalledWith('/api/process-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'analyze_themes',
          options: {
            analyzeNewThemes: true,
            updateExistingThemes: true,
            calculateCompetition: true,
            updateRecommendations: true
          }
        })
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('getProcessingStatus', () => {
    it('should get processing status successfully', async () => {
      const mockResponse = {
        jobs: [
          {
            id: 'job-1',
            job_type: 'batch_update',
            status: 'completed',
            created_at: '2024-01-01T00:00:00Z'
          }
        ],
        lastUpdate: '2024-01-01T00:00:00Z',
        timestamp: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.getProcessingStatus('batch_update')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/process-data?operation=batch_update'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('processCollectedData', () => {
    it('should process collected data end-to-end', async () => {
      const mockNormalizationResponse = {
        success: true,
        operation: 'normalize',
        result: { summary: { processed: 10 } }
      }

      const mockAnalysisResponse = {
        success: true,
        operation: 'analyze_themes',
        result: { themes_analyzed: 5 }
      }

      const mockRealtimeResponse = {
        success: true,
        operation: 'realtime_sync',
        result: { updates_sent: 3 }
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNormalizationResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAnalysisResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRealtimeResponse
        })

      const rawData = [{ test: 'data' }]
      const result = await client.processCollectedData(rawData)

      expect(result).toEqual({
        normalization: mockNormalizationResponse,
        analysis: mockAnalysisResponse,
        realtimeSync: mockRealtimeResponse
      })

      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should handle normalization failure', async () => {
      const mockNormalizationResponse = {
        success: false,
        error: 'Normalization failed'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNormalizationResponse
      })

      const rawData = [{ test: 'data' }]

      await expect(client.processCollectedData(rawData)).rejects.toThrow(
        'Data normalization failed: Normalization failed'
      )
    })
  })
})

describe('Singleton instance', () => {
  it('should export a singleton instance', () => {
    expect(dataProcessingClient).toBeInstanceOf(DataProcessingClient)
  })
})