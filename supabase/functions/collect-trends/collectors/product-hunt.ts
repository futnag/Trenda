import { RateLimitManager } from '../utils/rate-limit-manager.ts'
import { ErrorHandler } from '../utils/error-handler.ts'

interface ProductHuntData {
  theme_id?: string
  source: string
  search_volume: number
  growth_rate: number
  geographic_data: any
  demographic_data: any
  timestamp: string
  products: any[]
  categories: string[]
  launch_metrics: any
}

interface CollectionParams {
  themes: string[]
  region: string
  forceRefresh: boolean
}

export class ProductHuntCollector {
  private readonly apiName = 'product-hunt'
  private readonly baseUrl = 'https://api.producthunt.com/v2/api/graphql'
  private readonly accessToken = Deno.env.get('PRODUCT_HUNT_ACCESS_TOKEN')

  constructor(
    private rateLimitManager: RateLimitManager,
    private errorHandler: ErrorHandler
  ) {}

  async collectData(params: CollectionParams): Promise<ProductHuntData[]> {
    const { themes, region } = params
    const results: ProductHuntData[] = []

    if (!this.accessToken) {
      this.errorHandler.logError(this.apiName, 'Product Hunt Access Token not configured', 'critical')
      return results
    }

    for (const theme of themes) {
      try {
        // Check rate limits
        if (!await this.rateLimitManager.checkRateLimit(this.apiName)) {
          await this.rateLimitManager.waitForRateLimit(this.apiName)
        }

        const productHuntData = await this.fetchProductHuntDataWithRetry(theme, region)
        if (productHuntData) {
          results.push(productHuntData)
        }

        this.rateLimitManager.incrementRequestCount(this.apiName)
        
        // Product Hunt API allows 1000 requests per hour
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        this.errorHandler.logError(this.apiName, `Failed to collect Product Hunt data for theme: ${theme}`, 'medium')
        continue
      }
    }

    return results
  }

  private async fetchProductHuntDataWithRetry(
    theme: string,
    region: string,
    maxAttempts: number = 3
  ): Promise<ProductHuntData | null> {
    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.fetchProductHuntData(theme, region)
      } catch (error) {
        lastError = error
        
        const shouldRetry = await this.errorHandler.handleAPIError(this.apiName, error, attempt)
        
        if (!shouldRetry || attempt === maxAttempts - 1) {
          break
        }

        await this.rateLimitManager.exponentialBackoff(attempt, maxAttempts)
      }
    }

    this.errorHandler.logError(
      this.apiName,
      `Failed to fetch Product Hunt data for ${theme} after ${maxAttempts} attempts: ${lastError?.message}`,
      'high'
    )
    
    return null
  }

  private async fetchProductHuntData(theme: string, region: string): Promise<ProductHuntData> {
    // Search for products related to the theme
    const products = await this.searchProducts(theme)
    
    // Get category information
    const categories = await this.getRelatedCategories(theme)
    
    // Analyze launch metrics
    const launchMetrics = this.analyzeLaunchMetrics(products)
    
    // Calculate growth rate based on recent launches
    const growthRate = this.calculateGrowthRate(products)

    return {
      source: this.apiName,
      search_volume: products.length,
      growth_rate: growthRate,
      geographic_data: {
        region,
        maker_locations: this.analyzeMakerLocations(products)
      },
      demographic_data: {
        maker_metrics: this.analyzeMakerMetrics(products),
        launch_patterns: this.analyzeLaunchPatterns(products)
      },
      timestamp: new Date().toISOString(),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        votes: p.votesCount,
        comments: p.commentsCount,
        launch_date: p.featuredAt
      })),
      categories: categories,
      launch_metrics: launchMetrics
    }
  }

  private async searchProducts(theme: string): Promise<any[]> {
    const query = `
      query SearchProducts($query: String!, $first: Int!) {
        posts(query: $query, first: $first, order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              description
              votesCount
              commentsCount
              featuredAt
              url
              website
              makers {
                id
                name
                headline
                profileImage
                twitterUsername
              }
              topics {
                edges {
                  node {
                    name
                    slug
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            query: theme,
            first: 50
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Product Hunt API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      return data.data?.posts?.edges?.map((edge: any) => edge.node) || []

    } catch (error) {
      throw new Error(`Product search failed: ${error.message}`)
    }
  }

  private async getRelatedCategories(theme: string): Promise<string[]> {
    const query = `
      query GetTopics($query: String!) {
        topics(query: $query, first: 10) {
          edges {
            node {
              name
              slug
              postsCount
            }
          }
        }
      }
    `

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            query: theme
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Categories search failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        console.warn('GraphQL errors in categories:', data.errors)
        return []
      }

      return data.data?.topics?.edges?.map((edge: any) => edge.node.name) || []

    } catch (error) {
      this.errorHandler.logError(this.apiName, `Failed to get categories for ${theme}`, 'low')
      return []
    }
  }

  private analyzeMakerLocations(products: any[]): any {
    const locationCounts: Record<string, number> = {}

    products.forEach(product => {
      product.makers?.forEach((maker: any) => {
        // Product Hunt doesn't provide location data directly
        // We'll use a placeholder analysis
        const location = 'Unknown'
        locationCounts[location] = (locationCounts[location] || 0) + 1
      })
    })

    return locationCounts
  }

  private analyzeMakerMetrics(products: any[]): any {
    const allMakers = products.flatMap(product => product.makers || [])
    
    if (allMakers.length === 0) {
      return {
        total_makers: 0,
        average_products_per_maker: 0,
        makers_with_twitter: 0,
        twitter_percentage: 0
      }
    }

    const uniqueMakers = new Map()
    allMakers.forEach(maker => {
      uniqueMakers.set(maker.id, maker)
    })

    const makersWithTwitter = Array.from(uniqueMakers.values())
      .filter((maker: any) => maker.twitterUsername).length

    return {
      total_makers: uniqueMakers.size,
      average_products_per_maker: Math.round((allMakers.length / uniqueMakers.size) * 100) / 100,
      makers_with_twitter: makersWithTwitter,
      twitter_percentage: Math.round((makersWithTwitter / uniqueMakers.size) * 100 * 100) / 100
    }
  }

  private analyzeLaunchPatterns(products: any[]): any {
    if (products.length === 0) {
      return {
        launch_days: {},
        launch_months: {},
        average_votes: 0,
        average_comments: 0
      }
    }

    const launchDays: Record<string, number> = {}
    const launchMonths: Record<string, number> = {}
    let totalVotes = 0
    let totalComments = 0

    products.forEach(product => {
      if (product.featuredAt) {
        const date = new Date(product.featuredAt)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        const monthName = date.toLocaleDateString('en-US', { month: 'long' })
        
        launchDays[dayName] = (launchDays[dayName] || 0) + 1
        launchMonths[monthName] = (launchMonths[monthName] || 0) + 1
      }
      
      totalVotes += product.votesCount || 0
      totalComments += product.commentsCount || 0
    })

    return {
      launch_days: launchDays,
      launch_months: launchMonths,
      average_votes: Math.round(totalVotes / products.length * 100) / 100,
      average_comments: Math.round(totalComments / products.length * 100) / 100
    }
  }

  private analyzeLaunchMetrics(products: any[]): any {
    if (products.length === 0) {
      return {
        total_products: 0,
        total_votes: 0,
        total_comments: 0,
        top_product: null,
        success_rate: 0
      }
    }

    const totalVotes = products.reduce((sum, product) => sum + (product.votesCount || 0), 0)
    const totalComments = products.reduce((sum, product) => sum + (product.commentsCount || 0), 0)
    
    const topProduct = products.reduce((top, product) => 
      (product.votesCount || 0) > (top.votesCount || 0) ? product : top
    )

    // Consider products with >100 votes as "successful"
    const successfulProducts = products.filter(product => (product.votesCount || 0) > 100)
    const successRate = (successfulProducts.length / products.length) * 100

    return {
      total_products: products.length,
      total_votes: totalVotes,
      total_comments: totalComments,
      top_product: {
        name: topProduct.name,
        votes: topProduct.votesCount,
        tagline: topProduct.tagline
      },
      success_rate: Math.round(successRate * 100) / 100,
      successful_products: successfulProducts.length
    }
  }

  private calculateGrowthRate(products: any[]): number {
    if (products.length === 0) return 0

    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentProducts = products.filter(product => 
      product.featuredAt && new Date(product.featuredAt) > oneMonthAgo
    ).length

    const olderProducts = products.filter(product => {
      if (!product.featuredAt) return false
      const launchDate = new Date(product.featuredAt)
      return launchDate > twoMonthsAgo && launchDate <= oneMonthAgo
    }).length

    if (olderProducts === 0) return recentProducts > 0 ? 100 : 0

    const growthRate = ((recentProducts - olderProducts) / olderProducts) * 100
    return Math.round(growthRate * 100) / 100
  }
}