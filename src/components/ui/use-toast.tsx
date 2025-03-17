"use client"

import React, { createContext, useContext, useState } from 'react'

type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ToasterToast = ToastProps

type ToastContextType = {
  toasts: ToasterToast[]
  toast: (props: Omit<ToasterToast, 'id' | 'open' | 'onOpenChange'>) => void
  dismiss: (id?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  const toast = (props: Omit<ToasterToast, 'id' | 'open' | 'onOpenChange'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [
      ...prev,
      {
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) {
            dismiss(id)
          }
        },
        ...props,
      },
    ])
    return { id }
  }

  const dismiss = (id?: string) => {
    setToasts((prev) =>
      id
        ? prev.filter((toast) => toast.id !== id)
        : prev.map((toast) => ({ ...toast, open: false }))
    )
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 