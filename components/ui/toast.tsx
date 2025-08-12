'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(onClose, 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(hideTimer)
  }, [duration, onClose])

  const borderColor = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  }[type]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: '#1A1B1E',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: `2px solid ${borderColor}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 9999,
        transform: isLeaving ? 'translateX(400px)' : isVisible ? 'translateX(0)' : 'translateX(400px)',
        opacity: isLeaving ? 0 : isVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        maxWidth: '400px'
      }}
    >
      <span style={{
        width: '24px',
        height: '24px',
        minWidth: '24px',
        minHeight: '24px',
        borderRadius: '50%',
        background: borderColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#1A1B1E',
        flexShrink: 0
      }}>
        {icon}
      </span>
      <span>{message}</span>
    </div>
  )
}