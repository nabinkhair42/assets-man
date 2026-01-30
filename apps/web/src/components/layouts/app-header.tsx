import { FolderBreadcrumbs } from '@/components'
import { SearchCommand } from '@/components/dialog/search-command'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Asset, Folder, SortBy, SortOrder } from '@/types'
import { ArrowDown, ArrowUp, ArrowUpDown, LayoutGrid, List, RefreshCw } from 'lucide-react'

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
  onRefresh?: () => void
  isRefreshing?: boolean
}

const AppHeader = ({
  breadcrumbPath,
  handleNavigate,
  viewMode,
  setViewMode,
  title,
  sortConfig,
  onSortChange,
  onPreviewAsset,
  onRefresh,
  isRefreshing,
}: AppHeaderProps) => {
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
    <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center h-14 px-4">
        {/* Left section - Sidebar trigger and title/breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <SidebarTrigger className="h-8 w-8" />

          {/* Mobile: Show current folder name or title */}
          <span className="sm:hidden font-semibold text-sm truncate max-w-25">
            {title || currentFolderName}
          </span>

          {/* Desktop: Show full breadcrumbs or title */}
          <div className="hidden sm:flex items-center">
            {title ? (
              <h1 className="text-base font-semibold">{title}</h1>
            ) : (
              <FolderBreadcrumbs path={breadcrumbPath} onNavigate={handleNavigate} />
            )}
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 flex justify-center px-4">
          <SearchCommand onNavigateToFolder={handleNavigate} onPreviewAsset={onPreviewAsset} />
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Sort dropdown */}
          {sortConfig && onSortChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  tooltipContent='Sorting'
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortConfig.sortBy} onValueChange={handleSortByChange}>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="createdAt">Date created</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="updatedAt">Date modified</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortConfig.sortOrder} onValueChange={handleSortOrderChange}>
                  <DropdownMenuRadioItem value="asc">
                    <ArrowUp className="mr-2 h-3.5 w-3.5" />
                    Ascending
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">
                    <ArrowDown className="mr-2 h-3.5 w-3.5" />
                    Descending
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onRefresh}
              disabled={isRefreshing}
              tooltipContent='Refresh'
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}


          {/* View mode toggle */}
          <div className="hidden sm:flex items-center ml-1 p-0.5 rounded-lg bg-muted/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              tooltipContent='List View'
              className={`h-7 w-7 rounded-md ${viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              tooltipContent='Grid View'
              className={`h-7 w-7 rounded-md ${viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile view toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
      </div>
      </div>
    </header>
  )
}

export default AppHeader
