import { createContext, useContext, useState, type ReactNode } from 'react'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
}

export const Tabs = ({ defaultValue, children, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export const TabsList = ({ children, className = '' }: TabsListProps) => {
  return (
    <div
      className={[
        'inline-flex items-center justify-center rounded-lg bg-bg-tertiary dark:bg-bg-tertiary-dark p-1',
        className
      ].join(' ')}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export const TabsTrigger = ({ value, children, className = '' }: TabsTriggerProps) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used inside Tabs')
  const { activeTab, setActiveTab } = context

  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={[
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-bg-tertiary dark:focus-visible:ring-offset-bg-tertiary-dark',
        isActive
          ? 'bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark shadow-subtle'
          : 'text-text-tertiary dark:text-text-tertiary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark',
        className
      ].join(' ')}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export const TabsContent = ({ value, children, className = '' }: TabsContentProps) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used inside Tabs')
  const { activeTab } = context

  if (activeTab !== value) return null

  return <div className={className}>{children}</div>
}
