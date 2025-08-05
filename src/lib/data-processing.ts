interface ProcessingOptions {
  batchSize?: number
  forceUpdate?: boolean
  notifyUsers?: boolean
  validateData?: boolean
  enrichData?: boolean
  deduplicateData?: boolean
}

interface ProcessingResult {
  success: boolean
  operation: string
  result: any
  timestamp: string
  error?: string
}

export class DataProcessingClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Normalize collected raw data
   */
  async normalizeData(rawData: any[], options: ProcessingOptions = {}): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/process-data`, {
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
            deduplicateData: true,
            ...options
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error normalizing data:', error)
      throw error
    }
  }

  /**
   * Trigger batch processing of themes and trend data
   */
  async processBatchUpdates(options: ProcessingOptions = {}): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/process-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'batch_update',
          options: {
            batchSize: 100,
            forceUpdate: false,
            updateThemes: true,
            updateScores: true,
            ...options
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error processing batch updates:', error)
      throw error
    }
  }

  /**
   * Sync real-time updates
   */
  async syncRealtimeUpdates(options: ProcessingOptions = {}): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/process-data`, {
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
            triggerAlerts: true,
            ...options
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error syncing real-time updates:', error)
      throw error
    }
  }

  /**
   * Analyze and update themes
   */
  async analyzeThemes(options: ProcessingOptions = {}): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/process-data`, {
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
            updateRecommendations: true,
            ...options
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error analyzing themes:', error)
      throw error
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(operation?: string): Promise<{
    jobs: any[]
    lastUpdate: string | null
    timestamp: string
  }> {
    try {
      const url = new URL(`${this.baseUrl}/process-data`, window.location.origin)
      if (operation) {
        url.searchParams.set('operation', operation)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting processing status:', error)
      throw error
    }
  }

  /**
   * Process collected data end-to-end
   */
  async processCollectedData(rawData: any[], options: ProcessingOptions = {}): Promise<{
    normalization: ProcessingResult
    analysis: ProcessingResult
    realtimeSync: ProcessingResult
  }> {
    console.log(`Processing ${rawData.length} collected data records`)

    // Step 1: Normalize the data
    const normalization = await this.normalizeData(rawData, options)
    
    if (!normalization.success) {
      throw new Error(`Data normalization failed: ${normalization.error}`)
    }

    console.log('Data normalization completed:', normalization.result.summary)

    // Step 2: Analyze themes
    const analysis = await this.analyzeThemes(options)
    
    if (!analysis.success) {
      console.warn('Theme analysis failed:', analysis.error)
    } else {
      console.log('Theme analysis completed:', analysis.result)
    }

    // Step 3: Sync real-time updates
    const realtimeSync = await this.syncRealtimeUpdates(options)
    
    if (!realtimeSync.success) {
      console.warn('Real-time sync failed:', realtimeSync.error)
    } else {
      console.log('Real-time sync completed:', realtimeSync.result)
    }

    return {
      normalization,
      analysis,
      realtimeSync
    }
  }
}

// Create a singleton instance
export const dataProcessingClient = new DataProcessingClient()

// Utility functions for common operations
export async function triggerDataProcessing(options: ProcessingOptions = {}) {
  return await dataProcessingClient.processBatchUpdates(options)
}

export async function processNewTrendData(rawData: any[], options: ProcessingOptions = {}) {
  return await dataProcessingClient.processCollectedData(rawData, options)
}

export async function syncDashboardUpdates(options: ProcessingOptions = {}) {
  return await dataProcessingClient.syncRealtimeUpdates(options)
}

// Hook for automatic data processing
export function useDataProcessing() {
  const processData = async (rawData: any[], options: ProcessingOptions = {}) => {
    try {
      const result = await dataProcessingClient.processCollectedData(rawData, options)
      return result
    } catch (error) {
      console.error('Data processing failed:', error)
      throw error
    }
  }

  const triggerBatchUpdate = async (options: ProcessingOptions = {}) => {
    try {
      const result = await dataProcessingClient.processBatchUpdates(options)
      return result
    } catch (error) {
      console.error('Batch update failed:', error)
      throw error
    }
  }

  const getStatus = async (operation?: string) => {
    try {
      const status = await dataProcessingClient.getProcessingStatus(operation)
      return status
    } catch (error) {
      console.error('Failed to get processing status:', error)
      throw error
    }
  }

  return {
    processData,
    triggerBatchUpdate,
    getStatus,
    client: dataProcessingClient
  }
}

// Scheduled processing utilities
export class ScheduledProcessor {
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Start automatic batch processing at regular intervals
   */
  startBatchProcessing(intervalMinutes: number = 30) {
    const intervalId = setInterval(async () => {
      try {
        console.log('Starting scheduled batch processing...')
        await dataProcessingClient.processBatchUpdates({
          batchSize: 50,
          forceUpdate: false,
          notifyUsers: true
        })
        console.log('Scheduled batch processing completed')
      } catch (error) {
        console.error('Scheduled batch processing failed:', error)
      }
    }, intervalMinutes * 60 * 1000)

    this.intervals.set('batch_processing', intervalId)
    console.log(`Started batch processing every ${intervalMinutes} minutes`)
  }

  /**
   * Start automatic real-time sync at regular intervals
   */
  startRealtimeSync(intervalMinutes: number = 5) {
    const intervalId = setInterval(async () => {
      try {
        await dataProcessingClient.syncRealtimeUpdates({
          notifyUsers: true,
          broadcastChanges: true
        })
      } catch (error) {
        console.error('Scheduled real-time sync failed:', error)
      }
    }, intervalMinutes * 60 * 1000)

    this.intervals.set('realtime_sync', intervalId)
    console.log(`Started real-time sync every ${intervalMinutes} minutes`)
  }

  /**
   * Stop scheduled processing
   */
  stop(processName?: string) {
    if (processName) {
      const intervalId = this.intervals.get(processName)
      if (intervalId) {
        clearInterval(intervalId)
        this.intervals.delete(processName)
        console.log(`Stopped scheduled ${processName}`)
      }
    } else {
      // Stop all scheduled processes
      for (const [name, intervalId] of this.intervals) {
        clearInterval(intervalId)
        console.log(`Stopped scheduled ${name}`)
      }
      this.intervals.clear()
    }
  }
}

export const scheduledProcessor = new ScheduledProcessor()