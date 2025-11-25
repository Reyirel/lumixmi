'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: Notification = { id, type, title, message, duration }
    
    setNotifications(prev => [...prev, notification])
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

const NotificationToast: React.FC<{
  notification: Notification
  onClose: () => void
}> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500 border-green-600'
      case 'error':
        return 'bg-red-500 border-red-600'
      case 'warning':
        return 'bg-yellow-500 border-yellow-600'
      case 'info':
        return 'bg-blue-500 border-blue-600'
      default:
        return 'bg-gray-500 border-gray-600'
    }
  }

  return (
    <div
      className={`
        ${getColors()} 
        text-white p-4 rounded-lg shadow-lg border-l-4 min-w-80 max-w-96
        transform transition-all duration-300 ease-in-out
        animate-slide-in-right
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {notification.message && (
              <p className="text-xs mt-1 opacity-90">{notification.message}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 ml-2 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  )
}
