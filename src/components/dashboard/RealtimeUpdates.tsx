'use client'

import { useState, useEffect } from 'react'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

interface RealtimeUpdatesProps {
  onThemeUpdate?: (theme: any) => void
  className?: string
}

export function RealtimeUpdates({ onThemeUpdate, className = '' }: RealtimeUpdatesProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  const {
    isConnected,
    lastUpdate,
    updateCount,
    errors,
    notifications,
    unreadNotifications,
    requestNotificationPermission,
    clearErrors,
    markNotificationAsRead,
    clearAllNotifications
  } = useRealtimeUpdates({
    enableThemeUpdates: true,
    enableTrendUpdates: true,
    enableNotifications: true,
    onUpdate: (update) => {
      console.log('Real-time update received:', update)
      if (update.type === 'theme_update' || update.type === 'new_theme') {
        onThemeUpdate?.(update.data)
      }
    },
    onError: (error) => {
      console.error('Real-time update error:', error)
    }
  })

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'new_theme':
        return '🆕'
      case 'theme_update':
        return '🔄'
      case 'trend_data':
        return '📈'
      case 'score_change':
        return '💰'
      default:
        return '📢'
    }
  }

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'new_theme':
        return 'text-green-600'
      case 'theme_update':
        return 'text-blue-600'
      case 'trend_data':
        return 'text-purple-600'
      case 'score_change':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {updateCount > 0 && (
              <span className="text-xs text-gray-500">
                ({updateCount} updates)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Permission */}
            {notificationPermission === 'default' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestPermission}
              >
                Enable Notifications
              </Button>
            )}

            {/* Notifications Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              🔔
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="mt-2 text-xs text-gray-500">
            Last update: {getUpdateIcon(lastUpdate.type)} {formatTimestamp(lastUpdate.timestamp)}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">
                {errors.length} error{errors.length > 1 ? 's' : ''}
              </span>
              <Button size="sm" variant="outline" onClick={clearErrors}>
                Clear
              </Button>
            </div>
            <div className="mt-1 text-xs text-red-500">
              {errors[errors.length - 1]?.message}
            </div>
          </div>
        )}
      </Card>

      {/* Notifications Panel */}
      {showNotifications && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllNotifications}
              >
                Clear All
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No notifications</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`p-3 border rounded-lg ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  } ${notification.isAlert ? 'border-red-300 bg-red-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {getUpdateIcon(notification.type)}
                        </span>
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        {notification.isAlert && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            Alert
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(notification.timestamp || notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && notification.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="ml-2"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recent Updates Summary */}
      {lastUpdate && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Latest Update</h3>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{getUpdateIcon(lastUpdate.type)}</span>
            <div className="flex-1">
              <h4 className={`font-medium ${getUpdateColor(lastUpdate.type)}`}>
                {lastUpdate.type.replace('_', ' ').toUpperCase()}
              </h4>
              <div className="text-sm text-gray-600 mt-1">
                {lastUpdate.type === 'new_theme' && (
                  <p>New theme discovered: <strong>{lastUpdate.data.title}</strong></p>
                )}
                {lastUpdate.type === 'theme_update' && (
                  <p>Theme updated: <strong>{lastUpdate.data.title}</strong></p>
                )}
                {lastUpdate.type === 'score_change' && (
                  <p>
                    Monetization score changed to <strong>{lastUpdate.data.monetization_score}</strong>
                  </p>
                )}
                {lastUpdate.type === 'trend_data' && (
                  <p>
                    New trend data for <strong>{lastUpdate.data.theme_title}</strong> 
                    from {lastUpdate.data.sources?.join(', ')}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {formatTimestamp(lastUpdate.timestamp)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// Component for showing update indicators on theme cards
export function UpdateIndicator({ 
  theme, 
  className = '' 
}: { 
  theme: any
  className?: string 
}) {
  const [isNew, setIsNew] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)

  useEffect(() => {
    const now = new Date()
    const createdAt = new Date(theme.created_at)
    const updatedAt = new Date(theme.updated_at)

    // Show "new" indicator for themes created in the last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    setIsNew(createdAt > oneHourAgo)

    // Show "updated" indicator for themes updated in the last 30 minutes
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    setIsUpdated(updatedAt > thirtyMinutesAgo && !isNew)
  }, [theme.created_at, theme.updated_at])

  if (!isNew && !isUpdated) {
    return null
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isNew && (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          🆕 New
        </span>
      )}
      {isUpdated && (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          🔄 Updated
        </span>
      )}
    </div>
  )
}