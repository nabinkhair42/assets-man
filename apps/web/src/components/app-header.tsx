import { FolderBreadcrumbs } from '@/components'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
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
    <div className="flex items-center justify-between border-b px-4 py-2">

       <div className='flex items-center gap-2'>
       <SidebarTrigger />
       <div className='w-0.5 h-4 rounded-full bg-border'/>
       <FolderBreadcrumbs path={breadcrumbPath} onNavigate={handleNavigate} />
       </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button onClick={handleUploadClick} disabled={uploadingCount > 0}
                isLoading={uploadingCount > 0}
            loadingText=""
            >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
  )
}

export default AppHeader