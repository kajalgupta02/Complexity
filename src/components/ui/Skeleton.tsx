import { forwardRef, type HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle'
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', variant = 'rectangle', ...props }, ref) => {
    const baseStyles = 'skeleton rounded-md'
    const variantStyles = {
      text: 'h-4 w-3/4',
      circle: 'h-10 w-10 rounded-full',
      rectangle: 'h-24 w-full',
    }

    return (
      <div
        ref={ref}
        className={[baseStyles, variantStyles[variant], className].join(' ')}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'
