import {
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  Folder,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileIconData {
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function getFileIconData(mimeType: string): FileIconData {
  if (mimeType?.startsWith("image/"))
    return { icon: FileImage, color: "text-pink-500", bg: "bg-pink-500/10" };
  if (mimeType?.startsWith("video/"))
    return { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-500/10" };
  if (mimeType?.startsWith("audio/"))
    return { icon: FileAudio, color: "text-orange-500", bg: "bg-orange-500/10" };
  if (mimeType?.includes("pdf") || mimeType?.includes("document") || mimeType?.includes("text"))
    return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (mimeType?.includes("zip") || mimeType?.includes("rar") || mimeType?.includes("archive"))
    return { icon: FileArchive, color: "text-amber-500", bg: "bg-amber-500/10" };
  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" };
}

export function getFolderIconData(): FileIconData {
  return { icon: Folder, color: "text-primary", bg: "bg-primary/10" };
}

interface FileIconProps {
  mimeType?: string;
  isFolder?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { container: "h-8 w-8 rounded-md", icon: "h-4 w-4" },
  md: { container: "h-10 w-10 rounded-lg", icon: "h-5 w-5" },
  lg: { container: "h-14 w-14 rounded-xl", icon: "h-7 w-7" },
};

export function FileIcon({ mimeType = "", isFolder = false, size = "sm", className }: FileIconProps) {
  const { icon: Icon, color, bg } = isFolder ? getFolderIconData() : getFileIconData(mimeType);
  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center justify-center", sizes.container, bg, className)}>
      <Icon className={cn(sizes.icon, color)} />
    </div>
  );
}
