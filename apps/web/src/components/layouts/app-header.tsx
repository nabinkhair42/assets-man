import { FolderBreadcrumbs } from '@/components'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { SearchCommand } from '@/components/dialog/search-command'
import { Folder } from '@/types'
import { LayoutGrid, List } from 'lucide-react'

interface AppHeaderProps {
  breadcrumbPath: Folder[]
  handleNavigate: (folderId: string | null) => void
  viewMode: "grid" | "list"
  setViewMode: (viewMode: "grid" | "list") => void
  title?: string
}

const AppHeader = ({ breadcrumbPath, handleNavigate, viewMode, setViewMode, title }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3">
      {/* Left side - Sidebar trigger and breadcrumbs */}
      <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0'>
        <SidebarTrigger />
        <div className='w-px h-5 bg-border/60 hidden sm:block'/>
        <div className="hidden sm:block">
          {title ? (
            <span className="text-lg font-semibold">{title}</span>
          ) : (
            <FolderBreadcrumbs path={breadcrumbPath} onNavigate={handleNavigate} />
          )}
        </div>
      </div>

      {/* Center - Search (responsive) */}
      <div className="flex-1 flex justify-center min-w-0">
        <SearchCommand onNavigateToFolder={handleNavigate} />
      </div>

      {/* Right side - Theme toggle and view toggle */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <ThemeToggle />
        <div className='w-px h-5 bg-border/60 hidden sm:block'/>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="text-muted-foreground hover:text-foreground"
          tooltipContent={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
        >
          {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}

export default AppHeader