import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastType = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const typeStyles = {
    default: 'bg-bg-elevated dark:bg-bg-elevated-dark border-text-muted/20 dark:border-text-muted-dark/20',
    success: 'bg-success-500/15 border-success-500/30 text-success-600 dark:text-success-400',
    warning: 'bg-warning-500/15 border-warning-500/30 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-500/15 border-danger-500/30 text-danger-600 dark:text-danger-400',
    info: 'bg-accent-500/15 border-accent-500/30 text-accent-600 dark:text-accent-400',
  }

  return (
    <div
      className={[
        'px-4 py-3 rounded-lg shadow-medium border animate-slide-up',
        typeStyles[toast.type],
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}
