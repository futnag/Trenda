import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RealtimeOptions {
  notifyUsers?: boolean
  broadcastChanges?: boolean
  updateDashboard?: boolean
  triggerAlerts?: boolean
}

interface RealtimeUpdate {
  type: 'theme_update' | 'trend_data' | 'score_change' | 'new_theme'
  data: any
  timestamp: string
  affected_users?: string[]
}

export class RealtimeUpdater {
  constructor(private supabaseClient: SupabaseClient) {}

  async syncRealtimeUpdates(options: RealtimeOptions = {}): Promise<{
    updates_sent: number
    notifications_sent: number
    errors: number
    details: any[]
  }> {
    const {
      notifyUsers = true,
      broadcastChanges = true,
      updateDashboard = true,
      triggerAlerts = true
    } = options

    let updatesSent = 0
    let notificationsSent = 0
    let errors = 0
    const details: any[] = []

    console.log('Starting realtime synchronization with options:', options)

    try {
      // Step 1: Get recent changes that need to be broadcast
      const recentChanges = await this.getRecentChanges()
      
      if (recentChanges.length === 0) {
        console.log('No recent changes to broadcast')
        return { updates_sent: 0, notifications_sent: 0, errors: 0, details: [] }
      }

      console.log(`Found ${recentChanges.length} recent changes to process`)

      // Step 2: Process each change
      for (const change of recentChanges) {
        try {
          // Broadcast change via Supabase Realtime
          if (broadcastChanges) {
            await this.broadcastChange(change)
            updatesSent++
          }

          // Send user notifications if needed
          if (notifyUsers && change.affected_users && change.affected_users.length > 0) {
            const notificationResult = await this.sendUserNotifications(change)
            notificationsSent += notificationResult.sent
            errors += notificationResult.errors
          }

          // Trigger alerts if configured
          if (triggerAlerts) {
            await this.checkAndTriggerAlerts(change)
          }

          details.push({
            change_id: change.id,
            type: change.type,
            status: 'processed',
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          console.error('Error processing change:', error)
          errors++
          details.push({
            change_id: change.id,
            type: change.type,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }
      }

      // Step 3: Update dashboard cache if needed
      if (updateDashboard) {
        await this.updateDashboardCache()
      }

      console.log(`Realtime sync completed: ${updatesSent} updates, ${notificationsSent} notifications, ${errors} errors`)

      return {
        updates_sent: updatesSent,
        notifications_sent: notificationsSent,
        errors,
        details
      }

    } catch (error) {
      console.error('Realtime synchronization failed:', error)
      throw error
    }
  }

  private async getRecentChanges(): Promise<RealtimeUpdate[]> {
    const changes: RealtimeUpdate[] = []
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    try {
      // Get recently updated themes
      const { data: updatedThemes, error: themesError } = await this.supabaseClient
        .from('themes')
        .select(`
          id,
          title,
          monetization_score,
          market_size,
          updated_at,
          created_at
        `)
        .gte('updated_at', fiveMinutesAgo)
        .order('updated_at', { ascending: false })

      if (themesError) {
        console.error('Error fetching updated themes:', themesError)
      } else if (updatedThemes && updatedThemes.length > 0) {
        for (const theme of updatedThemes) {
          const isNewTheme = new Date(theme.created_at) > new Date(fiveMinutesAgo)
          
          changes.push({
            type: isNewTheme ? 'new_theme' : 'theme_update',
            data: {
              id: theme.id,
              title: theme.title,
              monetization_score: theme.monetization_score,
              market_size: theme.market_size,
              is_new: isNewTheme
            },
            timestamp: theme.updated_at,
            affected_users: await this.getInterestedUsers(theme)
          })
        }
      }

      // Get recent trend data updates
      const { data: recentTrendData, error: trendError } = await this.supabaseClient
        .from('trend_data')
        .select(`
          id,
          theme_id,
          source,
          search_volume,
          growth_rate,
          timestamp,
          themes (
            id,
            title
          )
        `)
        .gte('timestamp', fiveMinutesAgo)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (trendError) {
        console.error('Error fetching recent trend data:', trendError)
      } else if (recentTrendData && recentTrendData.length > 0) {
        // Group trend data by theme
        const trendByTheme = recentTrendData.reduce((acc: any, trend: any) => {
          if (!acc[trend.theme_id]) {
            acc[trend.theme_id] = {
              theme: trend.themes,
              trends: []
            }
          }
          acc[trend.theme_id].trends.push(trend)
          return acc
        }, {})

        for (const [themeId, data] of Object.entries(trendByTheme)) {
          const themeData = data as any
          changes.push({
            type: 'trend_data',
            data: {
              theme_id: themeId,
              theme_title: themeData.theme?.title,
              trend_count: themeData.trends.length,
              latest_trends: themeData.trends.slice(0, 3),
              sources: [...new Set(themeData.trends.map((t: any) => t.source))]
            },
            timestamp: new Date().toISOString(),
            affected_users: await this.getInterestedUsers({ id: themeId })
          })
        }
      }

      console.log(`Found ${changes.length} recent changes`)
      return changes

    } catch (error) {
      console.error('Error getting recent changes:', error)
      return []
    }
  }

  private async getInterestedUsers(theme: any): Promise<string[]> {
    try {
      // Get users who have alerts for this theme
      const { data: alertUsers, error: alertError } = await this.supabaseClient
        .from('user_alerts')
        .select('user_id')
        .eq('theme_id', theme.id)
        .eq('is_active', true)

      if (alertError) {
        console.error('Error fetching alert users:', alertError)
        return []
      }

      // Get users who might be interested based on preferences
      // This is a simplified version - in production you might have more sophisticated matching
      const { data: interestedUsers, error: usersError } = await this.supabaseClient
        .from('users')
        .select('id')
        .neq('subscription_tier', 'free') // Only notify paid users for now
        .limit(100)

      if (usersError) {
        console.error('Error fetching interested users:', usersError)
        return []
      }

      const alertUserIds = (alertUsers || []).map((alert: any) => alert.user_id)
      const interestedUserIds = (interestedUsers || []).map((user: any) => user.id)

      // Combine and deduplicate
      return [...new Set([...alertUserIds, ...interestedUserIds])]

    } catch (error) {
      console.error('Error getting interested users:', error)
      return []
    }
  }

  private async broadcastChange(change: RealtimeUpdate): Promise<void> {
    try {
      // Use Supabase Realtime to broadcast the change
      const channel = this.supabaseClient.channel('theme-updates')
      
      await channel.send({
        type: 'broadcast',
        event: change.type,
        payload: {
          ...change.data,
          timestamp: change.timestamp,
          change_id: `${change.type}_${Date.now()}`
        }
      })

      console.log(`Broadcasted ${change.type} change:`, change.data)

    } catch (error) {
      console.error('Error broadcasting change:', error)
      throw error
    }
  }

  private async sendUserNotifications(change: RealtimeUpdate): Promise<{
    sent: number
    errors: number
  }> {
    let sent = 0
    let errors = 0

    if (!change.affected_users || change.affected_users.length === 0) {
      return { sent: 0, errors: 0 }
    }

    try {
      // Create notification records for affected users
      const notifications = change.affected_users.map(userId => ({
        user_id: userId,
        type: change.type,
        title: this.getNotificationTitle(change),
        message: this.getNotificationMessage(change),
        data: change.data,
        is_read: false,
        created_at: new Date().toISOString()
      }))

      // Insert notifications in batches
      const batchSize = 50
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        
        try {
          const { error } = await this.supabaseClient
            .from('user_notifications')
            .insert(batch)

          if (error) {
            console.error('Error inserting notification batch:', error)
            errors += batch.length
          } else {
            sent += batch.length
          }
        } catch (batchError) {
          console.error('Error processing notification batch:', batchError)
          errors += batch.length
        }
      }

      // Send real-time notifications to online users
      for (const userId of change.affected_users) {
        try {
          const userChannel = this.supabaseClient.channel(`user-${userId}`)
          await userChannel.send({
            type: 'broadcast',
            event: 'notification',
            payload: {
              type: change.type,
              title: this.getNotificationTitle(change),
              message: this.getNotificationMessage(change),
              data: change.data,
              timestamp: change.timestamp
            }
          })
        } catch (notificationError) {
          console.error(`Error sending realtime notification to user ${userId}:`, notificationError)
          // Don't increment errors here as the database notification was successful
        }
      }

    } catch (error) {
      console.error('Error sending user notifications:', error)
      errors += change.affected_users.length
    }

    return { sent, errors }
  }

  private getNotificationTitle(change: RealtimeUpdate): string {
    switch (change.type) {
      case 'new_theme':
        return 'New Theme Discovered'
      case 'theme_update':
        return 'Theme Updated'
      case 'trend_data':
        return 'New Trend Data Available'
      case 'score_change':
        return 'Monetization Score Changed'
      default:
        return 'Update Available'
    }
  }

  private getNotificationMessage(change: RealtimeUpdate): string {
    switch (change.type) {
      case 'new_theme':
        return `A new theme "${change.data.title}" has been discovered with a monetization score of ${change.data.monetization_score}`
      case 'theme_update':
        return `Theme "${change.data.title}" has been updated`
      case 'trend_data':
        return `New trend data is available for "${change.data.theme_title}" from ${change.data.sources.join(', ')}`
      case 'score_change':
        return `Monetization score for "${change.data.title}" has changed to ${change.data.monetization_score}`
      default:
        return 'New update available'
    }
  }

  private async checkAndTriggerAlerts(change: RealtimeUpdate): Promise<void> {
    try {
      // Get active alerts that might be triggered by this change
      const { data: alerts, error: alertsError } = await this.supabaseClient
        .from('user_alerts')
        .select(`
          id,
          user_id,
          alert_type,
          threshold_value,
          conditions,
          users (
            id,
            email,
            subscription_tier
          )
        `)
        .eq('is_active', true)

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError)
        return
      }

      if (!alerts || alerts.length === 0) {
        return
      }

      // Check each alert against the change
      for (const alert of alerts) {
        try {
          const shouldTrigger = this.shouldTriggerAlert(alert, change)
          
          if (shouldTrigger) {
            await this.triggerAlert(alert, change)
          }
        } catch (alertError) {
          console.error(`Error processing alert ${alert.id}:`, alertError)
        }
      }

    } catch (error) {
      console.error('Error checking and triggering alerts:', error)
    }
  }

  private shouldTriggerAlert(alert: any, change: RealtimeUpdate): boolean {
    switch (alert.alert_type) {
      case 'new_theme':
        return change.type === 'new_theme'
      
      case 'score_change':
        if (change.type === 'theme_update' && change.data.monetization_score !== undefined) {
          const threshold = alert.threshold_value || 0
          return change.data.monetization_score >= threshold
        }
        return false
      
      case 'competition_change':
        // This would require more complex logic based on competitor analysis
        return false
      
      case 'market_opportunity':
        if (change.type === 'new_theme' || change.type === 'theme_update') {
          const score = change.data.monetization_score || 0
          const marketSize = change.data.market_size || 0
          const threshold = alert.threshold_value || 70
          
          return score >= threshold && marketSize > 1000
        }
        return false
      
      default:
        return false
    }
  }

  private async triggerAlert(alert: any, change: RealtimeUpdate): Promise<void> {
    try {
      // Log the alert trigger
      console.log(`Triggering alert ${alert.id} for user ${alert.user_id}`)

      // Create alert notification
      const { error: notificationError } = await this.supabaseClient
        .from('user_notifications')
        .insert({
          user_id: alert.user_id,
          type: 'alert',
          title: `Alert: ${alert.alert_type}`,
          message: this.getAlertMessage(alert, change),
          data: {
            alert_id: alert.id,
            alert_type: alert.alert_type,
            change_data: change.data
          },
          is_read: false,
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('Error creating alert notification:', notificationError)
      }

      // Send real-time alert to user
      const userChannel = this.supabaseClient.channel(`user-${alert.user_id}`)
      await userChannel.send({
        type: 'broadcast',
        event: 'alert',
        payload: {
          alert_id: alert.id,
          alert_type: alert.alert_type,
          title: `Alert: ${alert.alert_type}`,
          message: this.getAlertMessage(alert, change),
          data: change.data,
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Error triggering alert:', error)
    }
  }

  private getAlertMessage(alert: any, change: RealtimeUpdate): string {
    switch (alert.alert_type) {
      case 'new_theme':
        return `New theme discovered: "${change.data.title}" with monetization score ${change.data.monetization_score}`
      case 'score_change':
        return `Theme "${change.data.title}" now has a monetization score of ${change.data.monetization_score}`
      case 'market_opportunity':
        return `High-potential opportunity: "${change.data.title}" (Score: ${change.data.monetization_score}, Market: ${change.data.market_size})`
      default:
        return `Alert triggered for ${alert.alert_type}`
    }
  }

  private async updateDashboardCache(): Promise<void> {
    try {
      // Update cached dashboard data for faster loading
      // This could involve updating a Redis cache or a dedicated cache table
      
      // For now, we'll just log that we would update the cache
      console.log('Dashboard cache update would be performed here')
      
      // In a real implementation, you might:
      // 1. Calculate trending themes
      // 2. Update category statistics
      // 3. Cache popular searches
      // 4. Update user-specific recommendations

    } catch (error) {
      console.error('Error updating dashboard cache:', error)
    }
  }
}