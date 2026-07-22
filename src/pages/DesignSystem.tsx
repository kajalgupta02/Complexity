import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'

export default function DesignSystem() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })
  const { addToast } = useToast()

  // Sync with global theme state
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-primary dark:text-text-primary-dark mb-2">Design System</h1>
            <p className="text-text-tertiary dark:text-text-tertiary-dark">
              Component library for Big O Analyzer — Phase 5 Complete!
            </p>
          </div>
          <Button onClick={toggleTheme} variant="secondary">
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </div>

        <Tabs defaultValue="buttons" className="mb-12">
          <TabsList className="mb-6">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
            <TabsTrigger value="tooltips">Tooltips</TabsTrigger>
            <TabsTrigger value="toasts">Toasts</TabsTrigger>
          </TabsList>

          <TabsContent value="buttons">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Various button styles and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="warning">Warning</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Sizes</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="xs">XS</Button>
                    <Button size="sm">SM</Button>
                    <Button size="md">MD</Button>
                    <Button size="lg">LG</Button>
                    <Button size="xl">XL</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">States</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button variant="secondary" disabled>Disabled Secondary</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards">
            <Card>
              <CardHeader>
                <CardTitle>Cards</CardTitle>
                <CardDescription>Card components for displaying content</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Example Card</CardTitle>
                    <CardDescription>This is a card description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Content goes here! Cards are used to group related information.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button variant="ghost">Cancel</Button>
                    <Button>Confirm</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Simple card with only content
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Badge components for status and labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Sizes</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge size="xs">XS</Badge>
                    <Badge size="sm">SM</Badge>
                    <Badge size="md">MD</Badge>
                    <Badge size="lg">LG</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skeletons">
            <Card>
              <CardHeader>
                <CardTitle>Skeletons</CardTitle>
                <CardDescription>Skeleton loaders for pending states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Variants</h4>
                  <div className="flex flex-wrap items-center gap-6">
                    <Skeleton variant="text" />
                    <Skeleton variant="circle" />
                    <div className="space-y-2">
                      <Skeleton variant="rectangle" className="h-32" />
                      <Skeleton variant="text" className="w-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tooltips">
            <Card>
              <CardHeader>
                <CardTitle>Tooltips</CardTitle>
                <CardDescription>Tooltip components for additional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Positions</h4>
                  <div className="flex flex-wrap items-center justify-center gap-8 p-8">
                    <Tooltip content="Top tooltip" position="top">
                      <Button variant="secondary">Top</Button>
                    </Tooltip>
                    <Tooltip content="Bottom tooltip" position="bottom">
                      <Button variant="secondary">Bottom</Button>
                    </Tooltip>
                    <Tooltip content="Left tooltip" position="left">
                      <Button variant="secondary">Left</Button>
                    </Tooltip>
                    <Tooltip content="Right tooltip" position="right">
                      <Button variant="secondary">Right</Button>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="toasts">
            <Card>
              <CardHeader>
                <CardTitle>Toasts</CardTitle>
                <CardDescription>Toast notifications for user feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => addToast('default', 'This is a default toast message')}>Default</Button>
                    <Button variant="success" onClick={() => addToast('success', 'Success! Operation completed')}>Success</Button>
                    <Button variant="warning" onClick={() => addToast('warning', 'Warning! Please check your input')}>Warning</Button>
                    <Button variant="danger" onClick={() => addToast('danger', 'Error! Something went wrong')}>Danger</Button>
                    <Button onClick={() => addToast('info', 'Info: Here is some useful information')}>Info</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
