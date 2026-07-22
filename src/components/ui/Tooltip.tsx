import { useState, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={[
            'absolute z-50 px-3 py-1.5 text-xs font-medium text-text-primary dark:text-text-primary-dark',
            'bg-bg-elevated dark:bg-bg-elevated-dark rounded-lg shadow-medium border border-text-muted/20 dark:border-text-muted-dark/20',
            'animate-fade-in',
            positionStyles[position],
          ].join(' ')}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}
