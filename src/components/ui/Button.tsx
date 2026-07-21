import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@/lib/Slot'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', disabled, asChild = false, children, ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-bg-primary dark:focus-visible:ring-offset-bg-primary-dark',
      disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
    ].join(' ')

    const variantStyles = {
      primary: [
        'bg-accent-500 text-white',
        'hover:bg-accent-600',
        'shadow-subtle hover:shadow-medium'
      ].join(' '),
      secondary: [
        'bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark',
        'border border-text-muted/30 dark:border-text-muted-dark/30',
        'hover:bg-bg-tertiary dark:hover:bg-bg-tertiary-dark'
      ].join(' '),
      ghost: [
        'text-text-primary dark:text-text-primary-dark',
        'hover:bg-bg-tertiary dark:hover:bg-bg-tertiary-dark'
      ].join(' '),
      danger: [
        'bg-danger-500 text-white',
        'hover:bg-danger-600'
      ].join(' '),
      success: [
        'bg-success-500 text-white',
        'hover:bg-success-600'
      ].join(' '),
      warning: [
        'bg-warning-500 text-black',
        'hover:bg-warning-600'
      ].join(' '),
    }

    const sizeStyles = {
      xs: 'px-2 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
      xl: 'px-6 py-3 text-lg gap-3',
    }

    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={[baseStyles, variantStyles[variant], sizeStyles[size], className].join(' ')}
        disabled={disabled}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'
