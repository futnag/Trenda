import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'sm'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 
        ${paddingClasses[padding]} 
        ${shadowClasses[shadow]} 
        ${className}
      `}
    >
      {children}
    </div>
  )
}