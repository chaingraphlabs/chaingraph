import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

export function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="space-y-6">
        {/* Appearance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium leading-none">Appearance</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>

        <Separator />

      </div>
    </ScrollArea>
  )
}
