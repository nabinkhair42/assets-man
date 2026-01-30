"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  LoaderIcon,
  OctagonXIcon,
  TriangleAlertIcon
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      visibleToasts={4}
      gap={8}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <LoaderIcon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group-[.toaster]:!rounded-xl group-[.toaster]:!border group-[.toaster]:!shadow-lg group-[.toaster]:!ring-1 group-[.toaster]:!ring-black/[0.03] group-[.toaster]:dark:!ring-white/[0.03] group-[.toaster]:!px-4 group-[.toaster]:!py-3",
          title: "group-[.toaster]:!text-sm group-[.toaster]:!font-medium",
          description:
            "group-[.toaster]:!text-xs group-[.toaster]:!text-muted-foreground",
          actionButton:
            "group-[.toaster]:!rounded-lg group-[.toaster]:!text-xs group-[.toaster]:!font-medium group-[.toaster]:!px-3 group-[.toaster]:!h-7",
          cancelButton:
            "group-[.toaster]:!rounded-lg group-[.toaster]:!text-xs group-[.toaster]:!font-medium group-[.toaster]:!px-3 group-[.toaster]:!h-7",
          success:
            "group-[.toaster]:!border-emerald-200 group-[.toaster]:dark:!border-emerald-800/40 group-[.toaster]:!bg-emerald-50 group-[.toaster]:dark:!bg-emerald-950/30 group-[.toaster]:!text-emerald-900 group-[.toaster]:dark:!text-emerald-100 group-[.toaster]:![&_[data-icon]]:text-emerald-500",
          error:
            "group-[.toaster]:!border-red-200 group-[.toaster]:dark:!border-red-800/40 group-[.toaster]:!bg-red-50 group-[.toaster]:dark:!bg-red-950/30 group-[.toaster]:!text-red-900 group-[.toaster]:dark:!text-red-100 group-[.toaster]:![&_[data-icon]]:text-red-500",
          warning:
            "group-[.toaster]:!border-amber-200 group-[.toaster]:dark:!border-amber-800/40 group-[.toaster]:!bg-amber-50 group-[.toaster]:dark:!bg-amber-950/30 group-[.toaster]:!text-amber-900 group-[.toaster]:dark:!text-amber-100 group-[.toaster]:![&_[data-icon]]:text-amber-500",
          info: "group-[.toaster]:!border-blue-200 group-[.toaster]:dark:!border-blue-800/40 group-[.toaster]:!bg-blue-50 group-[.toaster]:dark:!bg-blue-950/30 group-[.toaster]:!text-blue-900 group-[.toaster]:dark:!text-blue-100 group-[.toaster]:![&_[data-icon]]:text-blue-500",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
