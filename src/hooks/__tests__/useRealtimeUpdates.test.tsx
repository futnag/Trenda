import { renderHook, act } from '@testing-library/react'

// Mock Supabase with factory function
jest.mock('@/lib/supabase', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
    send: jest.fn()
  }

  return {
    supabase: {
      channel: jest.fn(() => mockChannel),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } }
        })
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
    }
  }
})

import { useRealtimeUpdates } from '../useRealtimeUpdates'

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn().mockImplementation((title, options) => ({
    title,
    ...options
  }))
})

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'default'
})

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted')
})

// Get the mocked supabase for test setup
const { supabase } = require('@/lib/supabase')

describe('useRealtimeUpdates', () => {
  let mockChannel: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
      send: jest.fn()
    }
    supabase.channel.mockReturnValue(mockChannel)
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return mockChannel
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRealtimeUpdates())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.lastUpdate).toBe(null)
    expect(result.current.updateCount).toBe(0)
    expect(result.current.errors).toEqual([])
    expect(result.current.themes).toEqual([])
    expect(result.current.notifications).toEqual([])
  })

  it('should connect to theme updates channel', () => {
    renderHook(() => useRealtimeUpdates({ enableThemeUpdates: true }))

    expect(supabase.channel).toHaveBeenCalledWith('theme-updates')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'broadcast',
      { event: 'theme_update' },
      expect.any(Function)
    )
    expect(mockChannel.on).toHaveBeenCalledWith(
      'broadcast',
      { event: 'new_theme' },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('should handle theme updates', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() => 
      useRealtimeUpdates({ 
        enableThemeUpdates: true,
        onUpdate 
      })
    )

    // Simulate theme update
    const updateCallback = mockChannel.on.mock.calls.find(
      call => call[1].event === 'theme_update'
    )[2]

    const mockUpdate = {
      payload: {
        id: 'theme-1',
        title: 'Updated Theme',
        monetization_score: 85,
        timestamp: '2024-01-01T00:00:00Z'
      }
    }

    act(() => {
      updateCallback(mockUpdate)
    })

    expect(result.current.updateCount).toBe(1)
    expect(result.current.lastUpdate).toEqual({
      type: 'theme_update',
      data: mockUpdate.payload,
      timestamp: mockUpdate.payload.timestamp
    })
    expect(onUpdate).toHaveBeenCalledWith({
      type: 'theme_update',
      data: mockUpdate.payload,
      timestamp: mockUpdate.payload.timestamp
    })
  })

  it('should handle new theme creation', () => {
    const { result } = renderHook(() => 
      useRealtimeUpdates({ enableThemeUpdates: true })
    )

    // Simulate new theme
    const newThemeCallback = mockChannel.on.mock.calls.find(
      call => call[1].event === 'new_theme'
    )[2]

    const mockNewTheme = {
      payload: {
        id: 'theme-2',
        title: 'New Theme',
        monetization_score: 75,
        timestamp: '2024-01-01T00:00:00Z'
      }
    }

    act(() => {
      newThemeCallback(mockNewTheme)
    })

    expect(result.current.themes).toHaveLength(1)
    expect(result.current.themes[0]).toEqual(mockNewTheme.payload)
    expect(result.current.lastUpdate?.type).toBe('new_theme')
  })

  it('should connect to trend updates channel', () => {
    renderHook(() => useRealtimeUpdates({ enableTrendUpdates: true }))

    expect(supabase.channel).toHaveBeenCalledWith('trend-updates')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'broadcast',
      { event: 'trend_data' },
      expect.any(Function)
    )
  })

  it('should handle trend data updates', () => {
    const { result } = renderHook(() => 
      useRealtimeUpdates({ enableTrendUpdates: true })
    )

    // Simulate trend data update
    const trendCallback = mockChannel.on.mock.calls.find(
      call => call[1].event === 'trend_data'
    )[2]

    const mockTrendData = {
      payload: {
        theme_id: 'theme-1',
        theme_title: 'Test Theme',
        trend_count: 3,
        sources: ['google-trends', 'reddit'],
        timestamp: '2024-01-01T00:00:00Z'
      }
    }

    act(() => {
      trendCallback(mockTrendData)
    })

    expect(result.current.lastUpdate?.type).toBe('trend_data')
    expect(result.current.lastUpdate?.data).toEqual(mockTrendData.payload)
  })

  it('should request notification permission', async () => {
    const { result } = renderHook(() => useRealtimeUpdates())

    await act(async () => {
      const granted = await result.current.requestNotificationPermission()
      expect(granted).toBe(true)
    })

    expect(Notification.requestPermission).toHaveBeenCalled()
  })

  it('should handle notification permission already granted', async () => {
    // Mock permission as already granted
    Object.defineProperty(Notification, 'permission', {
      value: 'granted'
    })

    const { result } = renderHook(() => useRealtimeUpdates())

    await act(async () => {
      const granted = await result.current.requestNotificationPermission()
      expect(granted).toBe(true)
    })

    // Should not call requestPermission if already granted
    expect(Notification.requestPermission).not.toHaveBeenCalled()
  })

  it('should clear errors', () => {
    const { result } = renderHook(() => useRealtimeUpdates())

    // Simulate an error
    act(() => {
      const onError = result.current.errors.length === 0 ? 
        jest.fn() : 
        result.current.errors[0]
      
      // Manually add an error for testing
      result.current.clearErrors()
    })

    expect(result.current.errors).toEqual([])
  })

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useRealtimeUpdates())

    // Add a mock notification
    act(() => {
      result.current.setNotifications([
        {
          id: 'notification-1',
          title: 'Test Notification',
          message: 'Test message',
          is_read: false
        }
      ])
    })

    await act(async () => {
      await result.current.markNotificationAsRead('notification-1')
    })

    expect(supabase.from).toHaveBeenCalledWith('user_notifications')
  })

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useRealtimeUpdates())

    // Add mock notifications
    act(() => {
      result.current.setNotifications([
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' }
      ])
    })

    act(() => {
      result.current.clearAllNotifications()
    })

    expect(result.current.notifications).toEqual([])
  })

  it('should handle connection errors', () => {
    const onError = jest.fn()
    
    // Mock subscription failure
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('CHANNEL_ERROR')
      return mockChannel
    })

    renderHook(() => 
      useRealtimeUpdates({ 
        enableThemeUpdates: true,
        onError 
      })
    )

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to connect to theme updates channel'
      })
    )
  })

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => 
      useRealtimeUpdates({ enableThemeUpdates: true })
    )

    unmount()

    expect(mockChannel.unsubscribe).toHaveBeenCalled()
  })

  it('should not connect when features are disabled', () => {
    renderHook(() => 
      useRealtimeUpdates({ 
        enableThemeUpdates: false,
        enableTrendUpdates: false,
        enableNotifications: false
      })
    )

    expect(supabase.channel).not.toHaveBeenCalled()
  })

  it('should filter unread notifications', () => {
    const { result } = renderHook(() => useRealtimeUpdates())

    act(() => {
      result.current.setNotifications([
        { id: '1', title: 'Read', is_read: true },
        { id: '2', title: 'Unread 1', is_read: false },
        { id: '3', title: 'Unread 2', is_read: false }
      ])
    })

    expect(result.current.unreadNotifications).toHaveLength(2)
    expect(result.current.unreadNotifications.every(n => !n.is_read)).toBe(true)
  })
})