import { RateLimitManager } from '../utils/rate-limit-manager.ts'
import { ErrorHandler } from '../utils/error-handler.ts'

interface RedditData {
  theme_id?: string
  source: string
  search_volume: number
  growth_rate: number
  geographic_data: any
  demographic_data: any
  timestamp: string
  subreddits: string[]
  post_count: number
  engagement_score: number
}

interface CollectionParams {
  themes: string[]
  region: string
  forceRefresh: boolean
}

export class RedditCollector {
  private readonly apiName = 'reddit'
  private readonly baseUrl = 'https://www.reddit.com/api/v1'
  private readonly clientId = Deno.env.get('REDDIT_CLIENT_ID')
  private readonly clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(
    private rateLimitManager: RateLimitManager,
    private errorHandler: ErrorHandler
  ) {}

  async collectData(params: CollectionParams): Promise<RedditData[]> {
    const { themes, region } = params
    const results: RedditData[] = []

    // Ensure we have a valid access token
    await this.ensureValidToken()

    for (const theme of themes) {
      try {
        // Check rate limits
        if (!await this.rateLimitManager.checkRateLimit(this.apiName)) {
          await this.rateLimitManager.waitForRateLimit(this.apiName)
        }

        const redditData = await this.fetchRedditDataWithRetry(theme, region)
        if (redditData) {
          results.push(redditData)
        }

        this.rateLimitManager.incrementRequestCount(this.apiName)
        
        // Reddit API recommends 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        this.errorHandler.logError(this.apiName, `Failed to collect Reddit data for theme: ${theme}`, 'medium')
        continue
      }
    }

    return results
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return // Token is still valid
    }

    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ThemeDiscoveryTool/1.0'
        },
        body: 'grant_type=client_credentials'
      })

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early
      
    } catch (error) {
      this.errorHandler.logError(this.apiName, `Failed to get access token: ${error.message}`, 'critical')
      throw error
    }
  }

  private async fetchRedditDataWithRetry(
    theme: string,
    region: string,
    maxAttempts: number = 3
  ): Promise<RedditData | null> {
    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.fetchRedditData(theme, region)
      } catch (error) {
        lastError = error
        
        // If token expired, refresh it
        if (error.status === 401) {
          this.accessToken = null
          await this.ensureValidToken()
        }
        
        const shouldRetry = await this.errorHandler.handleAPIError(this.apiName, error, attempt)
        
        if (!shouldRetry || attempt === maxAttempts - 1) {
          break
        }

        await this.rateLimitManager.exponentialBackoff(attempt, maxAttempts)
      }
    }

    this.errorHandler.logError(
      this.apiName,
      `Failed to fetch Reddit data for ${theme} after ${maxAttempts} attempts: ${lastError?.message}`,
      'high'
    )
    
    return null
  }

  private async fetchRedditData(theme: string, region: string): Promise<RedditData> {
    // Search for relevant subreddits
    const subreddits = await this.findRelevantSubreddits(theme)
    
    // Get posts and engagement data
    const postsData = await this.getPostsData(theme, subreddits)
    
    // Calculate engagement metrics
    const engagementScore = this.calculateEngagementScore(postsData)
    
    return {
      source: this.apiName,
      search_volume: postsData.totalPosts,
      growth_rate: postsData.growthRate,
      geographic_data: {
        region,
        subreddit_distribution: postsData.subredditDistribution
      },
      demographic_data: {
        user_activity: postsData.userActivity,
        time_distribution: postsData.timeDistribution
      },
      timestamp: new Date().toISOString(),
      subreddits: subreddits,
      post_count: postsData.totalPosts,
      engagement_score: engagementScore
    }
  }

  private async findRelevantSubreddits(theme: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://oauth.reddit.com/subreddits/search?q=${encodeURIComponent(theme)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'ThemeDiscoveryTool/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Subreddit search failed: ${response.status}`)
      }

      const data = await response.json()
      return data.data.children
        .map((child: any) => child.data.display_name)
        .slice(0, 5) // Limit to top 5 relevant subreddits
        
    } catch (error) {
      this.errorHandler.logError(this.apiName, `Subreddit search failed for ${theme}`, 'medium')
      
      // Fallback to common subreddits
      return ['programming', 'entrepreneur', 'startups', 'technology', 'webdev']
    }
  }

  private async getPostsData(theme: string, subreddits: string[]): Promise<any> {
    const allPosts: any[] = []
    const subredditDistribution: Record<string, number> = {}

    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(theme)}&limit=25&sort=new&t=month`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'User-Agent': 'ThemeDiscoveryTool/1.0'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const posts = data.data.children.map((child: any) => child.data)
          allPosts.push(...posts)
          subredditDistribution[subreddit] = posts.length
        }

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        this.errorHandler.logError(this.apiName, `Failed to get posts from r/${subreddit}`, 'low')
        subredditDistribution[subreddit] = 0
      }
    }

    // Calculate growth rate based on post timestamps
    const now = Date.now() / 1000
    const oneWeekAgo = now - (7 * 24 * 60 * 60)
    const twoWeeksAgo = now - (14 * 24 * 60 * 60)

    const recentPosts = allPosts.filter(post => post.created_utc > oneWeekAgo).length
    const olderPosts = allPosts.filter(post => 
      post.created_utc > twoWeeksAgo && post.created_utc <= oneWeekAgo
    ).length

    const growthRate = olderPosts > 0 ? ((recentPosts - olderPosts) / olderPosts) * 100 : 0

    return {
      totalPosts: allPosts.length,
      growthRate: Math.round(growthRate * 100) / 100,
      subredditDistribution,
      userActivity: this.analyzeUserActivity(allPosts),
      timeDistribution: this.analyzeTimeDistribution(allPosts)
    }
  }

  private analyzeUserActivity(posts: any[]): any {
    const userScores = posts.map(post => ({
      score: post.score,
      comments: post.num_comments,
      upvoteRatio: post.upvote_ratio
    }))

    const avgScore = userScores.reduce((sum, post) => sum + post.score, 0) / userScores.length || 0
    const avgComments = userScores.reduce((sum, post) => sum + post.comments, 0) / userScores.length || 0
    const avgUpvoteRatio = userScores.reduce((sum, post) => sum + post.upvoteRatio, 0) / userScores.length || 0

    return {
      average_score: Math.round(avgScore * 100) / 100,
      average_comments: Math.round(avgComments * 100) / 100,
      average_upvote_ratio: Math.round(avgUpvoteRatio * 100) / 100,
      total_engagement: Math.round((avgScore + avgComments * 2) * avgUpvoteRatio)
    }
  }

  private analyzeTimeDistribution(posts: any[]): any {
    const hourCounts = new Array(24).fill(0)
    const dayCounts = new Array(7).fill(0)

    posts.forEach(post => {
      const date = new Date(post.created_utc * 1000)
      hourCounts[date.getUTCHours()]++
      dayCounts[date.getUTCDay()]++
    })

    return {
      hourly_distribution: hourCounts,
      daily_distribution: dayCounts,
      peak_hour: hourCounts.indexOf(Math.max(...hourCounts)),
      peak_day: dayCounts.indexOf(Math.max(...dayCounts))
    }
  }

  private calculateEngagementScore(postsData: any): number {
    const { userActivity, totalPosts } = postsData
    
    if (!userActivity || totalPosts === 0) return 0

    // Weighted engagement score
    const scoreWeight = 0.3
    const commentWeight = 0.4
    const upvoteWeight = 0.3

    const normalizedScore = Math.min(userActivity.average_score / 100, 1) // Cap at 100
    const normalizedComments = Math.min(userActivity.average_comments / 50, 1) // Cap at 50
    const upvoteRatio = userActivity.average_upvote_ratio

    const engagementScore = (
      normalizedScore * scoreWeight +
      normalizedComments * commentWeight +
      upvoteRatio * upvoteWeight
    ) * 100

    return Math.round(engagementScore * 100) / 100
  }
}