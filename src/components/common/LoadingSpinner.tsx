interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'blue' | 'gray' | 'white'
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  color = 'blue',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const colorClasses = {
    blue: 'border-gray-300 border-t-blue-600',
    gray: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white',
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  )
}

export default LoadingSpinner
