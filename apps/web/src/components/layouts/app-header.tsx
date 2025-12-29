import { FolderBreadcrumbs } from '@/components'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { SearchCommand } from '@/components/dialog/search-command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Folder, Asset, SortBy, SortOrder } from '@/types'
import { LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface SortConfig {
  sortBy: SortBy
  sortOrder: SortOrder
}

interface AppHeaderProps {
  breadcrumbPath: Folder[]
  handleNavigate: (folderId: string | null) => void
  viewMode: "grid" | "list"
  setViewMode: (viewMode: "grid" | "list") => void
  title?: string
  sortConfig?: SortConfig
  onSortChange?: (config: SortConfig) => void
  onPreviewAsset?: (asset: Asset) => void
}

const AppHeader = ({ breadcrumbPath, handleNavigate, viewMode, setViewMode, title, sortConfig, onSortChange, onPreviewAsset }: AppHeaderProps) => {
  // Get current folder name for mobile display
  const currentFolderName = breadcrumbPath.length > 0
    ? breadcrumbPath[breadcrumbPath.length - 1]?.name
    : "My Files";

  const handleSortByChange = (value: string) => {
    if (onSortChange && sortConfig) {
      onSortChange({ ...sortConfig, sortBy: value as SortBy })
    }
  }

  const handleSortOrderChange = (value: string) => {
    if (onSortChange && sortConfig) {
      onSortChange({ ...sortConfig, sortOrder: value as SortOrder })
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3">
      {/* Left side - Sidebar trigger and breadcrumbs */}
      <div className='flex items-center gap-2 sm:gap-3 shrink-0 min-w-0'>
        <SidebarTrigger />
        <div className='w-px h-5 bg-border/60 hidden sm:block'/>
        {/* Mobile: Show current folder name or title */}
        <span className="sm:hidden font-medium text-sm truncate max-w-[120px]">
          {title || currentFolderName}
        </span>
        {/* Desktop: Show full breadcrumbs or title */}
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
        <SearchCommand onNavigateToFolder={handleNavigate} onPreviewAsset={onPreviewAsset} />
      </div>

      {/* Right side - Sort, Theme toggle, and view toggle */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {sortConfig && onSortChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                tooltipContent="Sort options"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortConfig.sortBy} onValueChange={handleSortByChange}>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="createdAt">Date created</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="updatedAt">Date modified</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortConfig.sortOrder} onValueChange={handleSortOrderChange}>
                <DropdownMenuRadioItem value="asc">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Ascending
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Descending
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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