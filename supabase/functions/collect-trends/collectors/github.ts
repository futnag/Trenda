import { RateLimitManager } from '../utils/rate-limit-manager.ts'
import { ErrorHandler } from '../utils/error-handler.ts'

interface GitHubData {
  theme_id?: string
  source: string
  search_volume: number
  growth_rate: number
  geographic_data: any
  demographic_data: any
  timestamp: string
  repositories: any[]
  languages: string[]
  developer_metrics: any
}

interface CollectionParams {
  themes: string[]
  region: string
  forceRefresh: boolean
}

export class GitHubCollector {
  private readonly apiName = 'github'
  private readonly baseUrl = 'https://api.github.com'
  private readonly accessToken = Deno.env.get('GITHUB_ACCESS_TOKEN')

  constructor(
    private rateLimitManager: RateLimitManager,
    private errorHandler: ErrorHandler
  ) {}

  async collectData(params: CollectionParams): Promise<GitHubData[]> {
    const { themes, region } = params
    const results: GitHubData[] = []

    if (!this.accessToken) {
      this.errorHandler.logError(this.apiName, 'GitHub Access Token not configured', 'critical')
      return results
    }

    for (const theme of themes) {
      try {
        // Check rate limits
        if (!await this.rateLimitManager.checkRateLimit(this.apiName)) {
          await this.rateLimitManager.waitForRateLimit(this.apiName)
        }

        const githubData = await this.fetchGitHubDataWithRetry(theme, region)
        if (githubData) {
          results.push(githubData)
        }

        this.rateLimitManager.incrementRequestCount(this.apiName)
        
        // GitHub API allows 5000 requests per hour for authenticated requests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        this.errorHandler.logError(this.apiName, `Failed to collect GitHub data for theme: ${theme}`, 'medium')
        continue
      }
    }

    return results
  }

  private async fetchGitHubDataWithRetry(
    theme: string,
    region: string,
    maxAttempts: number = 3
  ): Promise<GitHubData | null> {
    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.fetchGitHubData(theme, region)
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
      `Failed to fetch GitHub data for ${theme} after ${maxAttempts} attempts: ${lastError?.message}`,
      'high'
    )
    
    return null
  }

  private async fetchGitHubData(theme: string, region: string): Promise<GitHubData> {
    // Search for repositories related to the theme
    const repositories = await this.searchRepositories(theme)
    
    // Get trending repositories
    const trendingRepos = await this.getTrendingRepositories(theme)
    
    // Combine and deduplicate repositories
    const allRepos = this.deduplicateRepositories([...repositories, ...trendingRepos])
    
    // Analyze languages used
    const languages = this.analyzeLanguages(allRepos)
    
    // Get developer metrics
    const developerMetrics = await this.analyzeDeveloperMetrics(allRepos)
    
    // Calculate growth rate
    const growthRate = this.calculateGrowthRate(allRepos)

    return {
      source: this.apiName,
      search_volume: allRepos.length,
      growth_rate: growthRate,
      geographic_data: {
        region,
        developer_locations: developerMetrics.locations
      },
      demographic_data: {
        developer_metrics: developerMetrics,
        repository_metrics: this.analyzeRepositoryMetrics(allRepos)
      },
      timestamp: new Date().toISOString(),
      repositories: allRepos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        created_at: repo.created_at,
        updated_at: repo.updated_at
      })),
      languages: languages,
      developer_metrics: developerMetrics
    }
  }

  private async searchRepositories(theme: string): Promise<any[]> {
    const query = `${theme} in:name,description,readme sort:stars-desc`
    const url = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=50&sort=stars&order=desc`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ThemeDiscoveryTool/1.0'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      const data = await response.json()
      return data.items || []

    } catch (error) {
      throw new Error(`Repository search failed: ${error.message}`)
    }
  }

  private async getTrendingRepositories(theme: string): Promise<any[]> {
    // GitHub doesn't have a direct trending API, so we'll search for recently created popular repos
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const query = `${theme} created:>${oneMonthAgo} sort:stars-desc`
    const url = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=25&sort=stars&order=desc`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ThemeDiscoveryTool/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Trending repositories search failed: ${response.status}`)
      }

      const data = await response.json()
      return data.items || []

    } catch (error) {
      this.errorHandler.logError(this.apiName, `Failed to get trending repositories for ${theme}`, 'low')
      return []
    }
  }

  private deduplicateRepositories(repositories: any[]): any[] {
    const seen = new Set()
    return repositories.filter(repo => {
      if (seen.has(repo.id)) {
        return false
      }
      seen.add(repo.id)
      return true
    })
  }

  private analyzeLanguages(repositories: any[]): string[] {
    const languageCounts: Record<string, number> = {}

    repositories.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
      }
    })

    // Return languages sorted by frequency
    return Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([language]) => language)
      .slice(0, 10) // Top 10 languages
  }

  private async analyzeDeveloperMetrics(repositories: any[]): Promise<any> {
    const ownerIds = new Set(repositories.map(repo => repo.owner.id))
    const locations: Record<string, number> = {}
    let totalPublicRepos = 0
    let totalFollowers = 0
    let totalFollowing = 0
    let processedOwners = 0

    // Sample a subset of owners to avoid hitting rate limits
    const sampleOwners = Array.from(ownerIds).slice(0, 10)

    for (const ownerId of sampleOwners) {
      try {
        const owner = repositories.find(repo => repo.owner.id === ownerId)?.owner
        if (!owner) continue

        const response = await fetch(`${this.baseUrl}/users/${owner.login}`, {
          headers: {
            'Authorization': `token ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ThemeDiscoveryTool/1.0'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          
          if (userData.location) {
            locations[userData.location] = (locations[userData.location] || 0) + 1
          }
          
          totalPublicRepos += userData.public_repos || 0
          totalFollowers += userData.followers || 0
          totalFollowing += userData.following || 0
          processedOwners++
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        this.errorHandler.logError(this.apiName, `Failed to get user data for owner ${ownerId}`, 'low')
      }
    }

    return {
      total_unique_developers: ownerIds.size,
      sampled_developers: processedOwners,
      locations,
      average_public_repos: processedOwners > 0 ? Math.round(totalPublicRepos / processedOwners) : 0,
      average_followers: processedOwners > 0 ? Math.round(totalFollowers / processedOwners) : 0,
      average_following: processedOwners > 0 ? Math.round(totalFollowing / processedOwners) : 0
    }
  }

  private analyzeRepositoryMetrics(repositories: any[]): any {
    if (repositories.length === 0) {
      return {
        total_repositories: 0,
        total_stars: 0,
        total_forks: 0,
        average_stars: 0,
        average_forks: 0,
        top_repository: null
      }
    }

    const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
    const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
    
    const topRepository = repositories.reduce((top, repo) => 
      (repo.stargazers_count || 0) > (top.stargazers_count || 0) ? repo : top
    )

    return {
      total_repositories: repositories.length,
      total_stars: totalStars,
      total_forks: totalForks,
      average_stars: Math.round(totalStars / repositories.length * 100) / 100,
      average_forks: Math.round(totalForks / repositories.length * 100) / 100,
      top_repository: {
        name: topRepository.name,
        full_name: topRepository.full_name,
        stars: topRepository.stargazers_count,
        description: topRepository.description
      }
    }
  }

  private calculateGrowthRate(repositories: any[]): number {
    if (repositories.length === 0) return 0

    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentRepos = repositories.filter(repo => 
      repo.created_at && new Date(repo.created_at) > oneMonthAgo
    ).length

    const olderRepos = repositories.filter(repo => {
      if (!repo.created_at) return false
      const createdDate = new Date(repo.created_at)
      return createdDate > twoMonthsAgo && createdDate <= oneMonthAgo
    }).length

    if (olderRepos === 0) return recentRepos > 0 ? 100 : 0

    const growthRate = ((recentRepos - olderRepos) / olderRepos) * 100
    return Math.round(growthRate * 100) / 100
  }
}