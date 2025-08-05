import { RateLimitManager } from '../utils/rate-limit-manager.ts'
import { ErrorHandler } from '../utils/error-handler.ts'

interface TwitterData {
  theme_id?: string
  source: string
  search_volume: number
  growth_rate: number
  geographic_data: any
  demographic_data: any
  timestamp: string
  hashtags: string[]
  tweet_count: number
  engagement_metrics: any
}

interface CollectionParams {
  themes: string[]
  region: string
  forceRefresh: boolean
}

export class TwitterCollector {
  private readonly apiName = 'twitter'
  private readonly baseUrl = 'https://api.twitter.com/2'
  private readonly bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN')

  constructor(
    private rateLimitManager: RateLimitManager,
    private errorHandler: ErrorHandler
  ) {}

  async collectData(params: CollectionParams): Promise<TwitterData[]> {
    const { themes, region } = params
    const results: TwitterData[] = []

    if (!this.bearerToken) {
      this.errorHandler.logError(this.apiName, 'Twitter Bearer Token not configured', 'critical')
      return results
    }

    for (const theme of themes) {
      try {
        // Check rate limits
        if (!await this.rateLimitManager.checkRateLimit(this.apiName)) {
          await this.rateLimitManager.waitForRateLimit(this.apiName)
        }

        const twitterData = await this.fetchTwitterDataWithRetry(theme, region)
        if (twitterData) {
          results.push(twitterData)
        }

        this.rateLimitManager.incrementRequestCount(this.apiName)
        
        // Twitter API v2 rate limits are per 15-minute window
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        this.errorHandler.logError(this.apiName, `Failed to collect Twitter data for theme: ${theme}`, 'medium')
        continue
      }
    }

    return results
  }

  private async fetchTwitterDataWithRetry(
    theme: string,
    region: string,
    maxAttempts: number = 3
  ): Promise<TwitterData | null> {
    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.fetchTwitterData(theme, region)
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
      `Failed to fetch Twitter data for ${theme} after ${maxAttempts} attempts: ${lastError?.message}`,
      'high'
    )
    
    return null
  }

  private async fetchTwitterData(theme: string, region: string): Promise<TwitterData> {
    // Search for tweets about the theme
    const searchResults = await this.searchTweets(theme)
    
    // Get trending hashtags related to the theme
    const hashtags = await this.getRelatedHashtags(theme, region)
    
    // Calculate engagement metrics
    const engagementMetrics = this.calculateEngagementMetrics(searchResults.tweets)
    
    // Calculate growth rate
    const growthRate = this.calculateGrowthRate(searchResults.tweets)

    return {
      source: this.apiName,
      search_volume: searchResults.tweet_count,
      growth_rate: growthRate,
      geographic_data: {
        region,
        location_distribution: searchResults.locationData
      },
      demographic_data: {
        user_metrics: searchResults.userMetrics,
        language_distribution: searchResults.languageData
      },
      timestamp: new Date().toISOString(),
      hashtags: hashtags,
      tweet_count: searchResults.tweet_count,
      engagement_metrics: engagementMetrics
    }
  }

  private async searchTweets(theme: string): Promise<any> {
    const query = `${theme} -is:retweet lang:en`
    const url = `${this.baseUrl}/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=100&tweet.fields=created_at,author_id,public_metrics,geo,lang&user.fields=public_metrics,location`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Twitter API error: ${response.status} - ${errorData.detail || response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.data) {
        return {
          tweets: [],
          tweet_count: 0,
          locationData: {},
          userMetrics: {},
          languageData: {}
        }
      }

      const tweets = data.data
      const users = data.includes?.users || []

      return {
        tweets,
        tweet_count: tweets.length,
        locationData: this.analyzeLocationData(tweets, users),
        userMetrics: this.analyzeUserMetrics(users),
        languageData: this.analyzeLanguageData(tweets)
      }

    } catch (error) {
      throw new Error(`Twitter search failed: ${error.message}`)
    }
  }

  private async getRelatedHashtags(theme: string, region: string): Promise<string[]> {
    // Twitter API v2 doesn't have a direct trending hashtags endpoint for free tier
    // We'll extract hashtags from the search results instead
    
    try {
      const hashtagQuery = `#${theme.replace(/\s+/g, '')} OR #${theme.replace(/\s+/g, 'App')} OR #${theme.replace(/\s+/g, 'Tool')}`
      const url = `${this.baseUrl}/tweets/search/recent?query=${encodeURIComponent(hashtagQuery)}&max_results=50&tweet.fields=entities`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Hashtag search failed: ${response.status}`)
      }

      const data = await response.json()
      const hashtags = new Set<string>()

      if (data.data) {
        data.data.forEach((tweet: any) => {
          if (tweet.entities?.hashtags) {
            tweet.entities.hashtags.forEach((hashtag: any) => {
              hashtags.add(hashtag.tag.toLowerCase())
            })
          }
        })
      }

      return Array.from(hashtags).slice(0, 10) // Return top 10 hashtags

    } catch (error) {
      this.errorHandler.logError(this.apiName, `Failed to get hashtags for ${theme}`, 'low')
      
      // Return fallback hashtags
      return [
        theme.replace(/\s+/g, '').toLowerCase(),
        `${theme.replace(/\s+/g, '')}app`.toLowerCase(),
        `${theme.replace(/\s+/g, '')}tool`.toLowerCase()
      ]
    }
  }

  private analyzeLocationData(tweets: any[], users: any[]): any {
    const locationCounts: Record<string, number> = {}
    const userLocationMap = new Map()

    // Map users to their locations
    users.forEach(user => {
      if (user.location) {
        userLocationMap.set(user.id, user.location)
      }
    })

    // Count tweets by location
    tweets.forEach(tweet => {
      const location = userLocationMap.get(tweet.author_id) || 'Unknown'
      locationCounts[location] = (locationCounts[location] || 0) + 1
    })

    return locationCounts
  }

  private analyzeUserMetrics(users: any[]): any {
    if (users.length === 0) {
      return {
        average_followers: 0,
        average_following: 0,
        average_tweets: 0,
        verified_percentage: 0
      }
    }

    const totalFollowers = users.reduce((sum, user) => sum + (user.public_metrics?.followers_count || 0), 0)
    const totalFollowing = users.reduce((sum, user) => sum + (user.public_metrics?.following_count || 0), 0)
    const totalTweets = users.reduce((sum, user) => sum + (user.public_metrics?.tweet_count || 0), 0)
    const verifiedCount = users.filter(user => user.verified).length

    return {
      average_followers: Math.round(totalFollowers / users.length),
      average_following: Math.round(totalFollowing / users.length),
      average_tweets: Math.round(totalTweets / users.length),
      verified_percentage: Math.round((verifiedCount / users.length) * 100 * 100) / 100
    }
  }

  private analyzeLanguageData(tweets: any[]): any {
    const languageCounts: Record<string, number> = {}

    tweets.forEach(tweet => {
      const lang = tweet.lang || 'unknown'
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    })

    return languageCounts
  }

  private calculateEngagementMetrics(tweets: any[]): any {
    if (tweets.length === 0) {
      return {
        average_likes: 0,
        average_retweets: 0,
        average_replies: 0,
        total_engagement: 0,
        engagement_rate: 0
      }
    }

    const totalLikes = tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.like_count || 0), 0)
    const totalRetweets = tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.retweet_count || 0), 0)
    const totalReplies = tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.reply_count || 0), 0)
    const totalQuotes = tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.quote_count || 0), 0)

    const totalEngagement = totalLikes + totalRetweets + totalReplies + totalQuotes
    const averageEngagement = totalEngagement / tweets.length

    return {
      average_likes: Math.round(totalLikes / tweets.length * 100) / 100,
      average_retweets: Math.round(totalRetweets / tweets.length * 100) / 100,
      average_replies: Math.round(totalReplies / tweets.length * 100) / 100,
      average_quotes: Math.round(totalQuotes / tweets.length * 100) / 100,
      total_engagement: totalEngagement,
      engagement_rate: Math.round(averageEngagement * 100) / 100
    }
  }

  private calculateGrowthRate(tweets: any[]): number {
    if (tweets.length === 0) return 0

    // Sort tweets by creation date
    const sortedTweets = tweets.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const recentTweets = sortedTweets.filter(tweet => 
      new Date(tweet.created_at) > oneDayAgo
    ).length

    const olderTweets = sortedTweets.filter(tweet => {
      const tweetDate = new Date(tweet.created_at)
      return tweetDate > twoDaysAgo && tweetDate <= oneDayAgo
    }).length

    if (olderTweets === 0) return recentTweets > 0 ? 100 : 0

    const growthRate = ((recentTweets - olderTweets) / olderTweets) * 100
    return Math.round(growthRate * 100) / 100
  }
}