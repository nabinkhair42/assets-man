import { FolderBreadcrumbs } from '@/components'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchCommand } from '@/components/search-command'
import { Folder } from '@/types'
import { FolderPlus, LayoutGrid, List, Upload } from 'lucide-react'

interface AppHeaderProps {
  breadcrumbPath: Folder[]
  handleNavigate: (folderId: string | null) => void
  viewMode: "grid" | "list"
  setViewMode: (viewMode: "grid" | "list") => void
  setCreateFolderOpen: (createFolderOpen: boolean) => void
  handleUploadClick: () => void
  uploadingCount: number
}

const AppHeader = ({ breadcrumbPath, handleNavigate, viewMode, setViewMode, setCreateFolderOpen, handleUploadClick, uploadingCount }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3">
      <div className='flex items-center gap-3'>
        <SidebarTrigger />
        <div className='w-px h-5 bg-border/60'/>
        <FolderBreadcrumbs path={breadcrumbPath} onNavigate={handleNavigate} />
      </div>
      <div className="flex items-center gap-2">
        <SearchCommand onNavigateToFolder={handleNavigate} />
        <div className='w-px h-5 bg-border/60'/>
        <ThemeToggle />
        <div className='w-px h-5 bg-border/60'/>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="text-muted-foreground hover:text-foreground"
          tooltipContent={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
        >
          {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateFolderOpen(true)}
          tooltipContent="Create a new folder"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
        <Button
          size="sm"
          onClick={handleUploadClick}
          disabled={uploadingCount > 0}
          isLoading={uploadingCount > 0}
          loadingText="Uploading..."
          tooltipContent="Upload files"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </header>
  )
}

export default AppHeader