import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Theme, TrendData } from '@/types'

interface RealtimeUpdate {
  type: 'theme_update' | 'trend_data' | 'score_change' | 'new_theme'
  data: any
  timestamp: string
}

interface UseRealtimeUpdatesOptions {
  enableThemeUpdates?: boolean
  enableTrendUpdates?: boolean
  enableNotifications?: boolean
  onUpdate?: (update: RealtimeUpdate) => void
  onError?: (error: Error) => void
}

interface RealtimeState {
  isConnected: boolean
  lastUpdate: RealtimeUpdate | null
  updateCount: number
  errors: Error[]
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    enableThemeUpdates = true,
    enableTrendUpdates = true,
    enableNotifications = true,
    onUpdate,
    onError
  } = options

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    lastUpdate: null,
    updateCount: 0,
    errors: []
  })

  const [themes, setThemes] = useState<Theme[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  // Handle incoming updates
  const handleUpdate = useCallback((update: RealtimeUpdate) => {
    setState(prev => ({
      ...prev,
      lastUpdate: update,
      updateCount: prev.updateCount + 1
    }))

    // Update local state based on update type
    switch (update.type) {
      case 'new_theme':
        setThemes(prev => [update.data, ...prev])
        break
      
      case 'theme_update':
        setThemes(prev => prev.map(theme => 
          theme.id === update.data.id 
            ? { ...theme, ...update.data }
            : theme
        ))
        break
      
      case 'score_change':
        setThemes(prev => prev.map(theme => 
          theme.id === update.data.id 
            ? { ...theme, monetizationScore: update.data.monetization_score }
            : theme
        ))
        break
    }

    // Call user-provided callback
    onUpdate?.(update)
  }, [onUpdate])

  // Handle errors
  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }))
    onError?.(error)
  }, [onError])

  // Subscribe to theme updates
  useEffect(() => {
    if (!enableThemeUpdates) return

    const channel = supabase
      .channel('theme-updates')
      .on('broadcast', { event: 'theme_update' }, (payload) => {
        handleUpdate({
          type: 'theme_update',
          data: payload.payload,
          timestamp: payload.payload.timestamp || new Date().toISOString()
        })
      })
      .on('broadcast', { event: 'new_theme' }, (payload) => {
        handleUpdate({
          type: 'new_theme',
          data: payload.payload,
          timestamp: payload.payload.timestamp || new Date().toISOString()
        })
      })
      .on('broadcast', { event: 'score_change' }, (payload) => {
        handleUpdate({
          type: 'score_change',
          data: payload.payload,
          timestamp: payload.payload.timestamp || new Date().toISOString()
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, isConnected: true }))
          console.log('Connected to theme updates channel')
        } else if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Failed to connect to theme updates channel'))
        }
      })

    return () => {
      channel.unsubscribe()
      setState(prev => ({ ...prev, isConnected: false }))
    }
  }, [enableThemeUpdates, handleUpdate, handleError])

  // Subscribe to trend data updates
  useEffect(() => {
    if (!enableTrendUpdates) return

    const channel = supabase
      .channel('trend-updates')
      .on('broadcast', { event: 'trend_data' }, (payload) => {
        handleUpdate({
          type: 'trend_data',
          data: payload.payload,
          timestamp: payload.payload.timestamp || new Date().toISOString()
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to trend updates channel')
        } else if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Failed to connect to trend updates channel'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [enableTrendUpdates, handleUpdate, handleError])

  // Subscribe to user notifications
  useEffect(() => {
    if (!enableNotifications) return

    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id
    }

    getUserId().then(userId => {
      if (!userId) return

      const channel = supabase
        .channel(`user-${userId}`)
        .on('broadcast', { event: 'notification' }, (payload) => {
          const notification = payload.payload
          setNotifications(prev => [notification, ...prev])
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.type
            })
          }
        })
        .on('broadcast', { event: 'alert' }, (payload) => {
          const alert = payload.payload
          setNotifications(prev => [{ ...alert, isAlert: true }, ...prev])
          
          // Show browser notification for alerts
          if (Notification.permission === 'granted') {
            new Notification(alert.title, {
              body: alert.message,
              icon: '/favicon.ico',
              tag: 'alert',
              requireInteraction: true // Keep notification visible
            })
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to user notifications channel')
          } else if (status === 'CHANNEL_ERROR') {
            handleError(new Error('Failed to connect to notifications channel'))
          }
        })

      return () => {
        channel.unsubscribe()
      }
    })
  }, [enableNotifications, handleError])

  // Subscribe to database changes using Supabase Realtime
  useEffect(() => {
    if (!enableThemeUpdates) return

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'themes'
        },
        (payload) => {
          handleUpdate({
            type: 'new_theme',
            data: payload.new,
            timestamp: new Date().toISOString()
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'themes'
        },
        (payload) => {
          handleUpdate({
            type: 'theme_update',
            data: payload.new,
            timestamp: new Date().toISOString()
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trend_data'
        },
        (payload) => {
          handleUpdate({
            type: 'trend_data',
            data: payload.new,
            timestamp: new Date().toISOString()
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [enableThemeUpdates, enableTrendUpdates, handleUpdate])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  // Clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }))
  }, [])

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) {
        handleError(new Error(`Failed to mark notification as read: ${error.message}`))
      } else {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        )
      }
    } catch (error) {
      handleError(error as Error)
    }
  }, [handleError])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    // Connection state
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,
    updateCount: state.updateCount,
    errors: state.errors,

    // Data
    themes,
    notifications,
    unreadNotifications: notifications.filter(n => !n.is_read),

    // Actions
    requestNotificationPermission,
    clearErrors,
    markNotificationAsRead,
    clearAllNotifications,

    // Setters for external updates
    setThemes,
    setNotifications
  }
}

// Hook for theme-specific real-time updates
export function useThemeRealtimeUpdates(themeId: string) {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!themeId) return

    // Initial data fetch
    const fetchThemeData = async () => {
      try {
        setIsLoading(true)
        
        const { data: themeData, error: themeError } = await supabase
          .from('themes')
          .select('*')
          .eq('id', themeId)
          .single()

        if (themeError) throw themeError

        const { data: trendsData, error: trendsError } = await supabase
          .from('trend_data')
          .select('*')
          .eq('theme_id', themeId)
          .order('timestamp', { ascending: false })
          .limit(50)

        if (trendsError) throw trendsError

        setTheme(themeData)
        setTrendData(trendsData || [])
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchThemeData()

    // Subscribe to real-time updates for this specific theme
    const channel = supabase
      .channel(`theme-${themeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'themes',
          filter: `id=eq.${themeId}`
        },
        (payload) => {
          setTheme(payload.new as Theme)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trend_data',
          filter: `theme_id=eq.${themeId}`
        },
        (payload) => {
          setTrendData(prev => [payload.new as TrendData, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [themeId])

  return {
    theme,
    trendData,
    isLoading,
    error,
    refetch: () => {
      // Trigger refetch by updating the effect dependency
      setIsLoading(true)
    }
  }
}