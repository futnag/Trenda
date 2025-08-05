/**
 * Example usage of database operations
 * This file demonstrates how to use the database helper functions
 */

import { 
  userOperations, 
  themeOperations, 
  trendDataOperations,
  userAlertOperations,
  subscriptionOperations,
  databaseHealth 
} from '../database'

// Example: User management
export async function exampleUserOperations() {
  // Create a new user
  const newUser = await userOperations.createUser({
    email: 'developer@example.com',
    subscriptionTier: 'free'
  })

  if (newUser) {
    console.log('Created user:', newUser)

    // Update user subscription
    const updatedUser = await userOperations.updateUser(newUser.data!.id, {
      subscriptionTier: 'basic'
    })

    console.log('Updated user:', updatedUser)
  }
}

// Example: Theme discovery
export async function exampleThemeDiscovery() {
  // Get trending themes with filters
  const productivityThemes = await themeOperations.getThemes({
    category: 'productivity',
    competition_level: 'low',
    limit: 10
  })

  console.log('Productivity themes with low competition:', productivityThemes)

  // Get a specific theme with trend data
  if (productivityThemes.data && productivityThemes.data.length > 0) {
    const themeWithTrends = await themeOperations.getThemeWithTrendData(
      productivityThemes.data[0].id
    )

    console.log('Theme with trend data:', themeWithTrends)
  }
}

// Example: Setting up user alerts
export async function exampleUserAlerts(userId: string) {
  // Create an alert for high monetization score themes
  const alert = await userAlertOperations.createAlert({
    userId: userId,
    themeId: '123e4567-e89b-12d3-a456-426614174001',
    alertType: 'new_theme',
    thresholdValue: 80,
    isActive: true
  })

  if (alert) {
    console.log('Created alert:', alert)

    // Get all user alerts
    const userAlerts = await userAlertOperations.getUserAlerts(userId)
    console.log('User alerts:', userAlerts)
  }
}

// Example: Subscription management
export async function exampleSubscriptionManagement(userId: string) {
  // Create a subscription
  const subscription = await subscriptionOperations.createSubscription({
    userId: userId,
    stripeSubscriptionId: 'sub_1234567890',
    planName: 'basic',
    status: 'active',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  })

  if (subscription) {
    console.log('Created subscription:', subscription)

    // Get user's active subscription
    const activeSubscription = await subscriptionOperations.getUserSubscription(userId)
    console.log('Active subscription:', activeSubscription)
  }
}

// Example: Database health monitoring
export async function exampleHealthCheck() {
  // Check database connection
  const isConnected = await databaseHealth.checkConnection()
  console.log('Database connected:', isConnected)

  // Get table statistics
  const tableCounts = await databaseHealth.getTableCounts()
  console.log('Table counts:', tableCounts)
}

// Example: Complex query patterns
export async function exampleComplexQueries() {
  // Get themes with high monetization potential
  const highPotentialThemes = await themeOperations.getThemes({
    limit: 20
  })

  // Filter for themes with score > 70 and low competition
  const filteredThemes = highPotentialThemes.data?.filter(theme => 
    (theme.monetizationScore || 0) > 70 && 
    theme.competitionLevel === 'low'
  ) || []

  console.log('High potential, low competition themes:', filteredThemes)

  // Get recent trend data across all themes
  const recentTrends = await trendDataOperations.getLatestTrendData()
  console.log('Recent trend data points:', recentTrends.data?.length || 0)

  // Group by source
  const trendsBySource = recentTrends.data?.reduce((acc, trend) => {
    acc[trend.source] = (acc[trend.source] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  console.log('Trends by source:', trendsBySource)
}

// Example: Error handling patterns
export async function exampleErrorHandling() {
  try {
    // Attempt to get a non-existent theme
    const theme = await themeOperations.getTheme('non-existent-id')
    
    if (!theme) {
      console.log('Theme not found - this is expected')
    }

    // Attempt to create an invalid user
    const invalidUser = await userOperations.createUser({
      email: 'invalid-email', // This might fail validation
      subscriptionTier: 'invalid_tier' as any // This will fail
    })

    if (!invalidUser) {
      console.log('User creation failed - this is expected for invalid data')
    }

  } catch (error) {
    console.error('Error in database operations:', error)
  }
}

// Export all examples for easy testing
export const databaseExamples = {
  userOperations: exampleUserOperations,
  themeDiscovery: exampleThemeDiscovery,
  userAlerts: exampleUserAlerts,
  subscriptionManagement: exampleSubscriptionManagement,
  healthCheck: exampleHealthCheck,
  complexQueries: exampleComplexQueries,
  errorHandling: exampleErrorHandling
}