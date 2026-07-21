import { forwardRef, type HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center rounded-full font-medium',
      'transition-colors duration-200'
    ].join(' ')

    const variantStyles = {
      default: 'bg-bg-tertiary dark:bg-bg-tertiary-dark text-text-secondary dark:text-text-secondary-dark',
      primary: 'bg-accent-500/15 text-accent-600 dark:text-accent-400',
      success: 'bg-success-500/15 text-success-600 dark:text-success-400',
      warning: 'bg-warning-500/15 text-warning-600 dark:text-warning-400',
      danger: 'bg-danger-500/15 text-danger-600 dark:text-danger-400',
      outline: 'border border-text-muted/30 dark:border-text-muted-dark/30 text-text-secondary dark:text-text-secondary-dark',
    }

    const sizeStyles = {
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    }

    return (
      <span
        ref={ref}
        className={[baseStyles, variantStyles[variant], sizeStyles[size], className].join(' ')}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
