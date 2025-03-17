"use client"

import React from 'react'
import { Toast } from './toast'
import { useToast } from './use-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(({ id, title, description, variant, open, onOpenChange }) => (
        <Toast
          key={id}
          id={id}
          title={title}
          description={description}
          variant={variant}
          open={open}
          onOpenChange={onOpenChange}
        />
      ))}
    </>
  )
} 