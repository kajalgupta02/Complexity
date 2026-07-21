import { cloneElement, forwardRef, isValidElement, type ReactElement } from 'react'

interface SlotProps {
  children: React.ReactNode
}

export const Slot = forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement, {
      ...props,
      ref,
      ...(children as ReactElement).props,
    })
  }
  return null
})

Slot.displayName = 'Slot'
