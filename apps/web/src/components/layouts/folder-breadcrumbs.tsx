"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Folder } from "@/types/folder";
import { Fragment } from "react";

interface FolderBreadcrumbsProps {
  path: Folder[];
  onNavigate: (folderId: string | null) => void;
}

export function FolderBreadcrumbs({ path, onNavigate }: FolderBreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {path.length === 0 ? (
            <BreadcrumbPage className="flex items-center gap-2">
              Home
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(null);
              }}
              className="flex items-center gap-1"
            >
              My Files
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {path.map((folder, index) => (
          <Fragment key={folder.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === path.length - 1 ? (
                <BreadcrumbPage>{folder.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(folder.id);
                  }}
                >
                  {folder.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
