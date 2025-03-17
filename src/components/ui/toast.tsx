"use client"

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  open,
  onOpenChange,
}) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md rounded-md border p-4 shadow-md transition-all ${
        variant === 'destructive' ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-900 dark:text-red-50' : 'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          {title && <div className="font-medium">{title}</div>}
          {description && <div className="text-sm mt-1">{description}</div>}
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const ToastViewport: React.FC = () => {
  return null
}

export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="font-medium">{children}</div>
}

export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="text-sm mt-1">{children}</div>
}

export const ToastClose: React.FC = () => {
  return null
}

export const ToastAction: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mt-2">{children}</div>
}

export type ToastActionElement = React.ReactElement<typeof ToastAction> 