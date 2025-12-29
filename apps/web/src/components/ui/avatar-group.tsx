"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AvatarUser {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
}

interface AvatarGroupProps {
  users: AvatarUser[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

const overlapClasses = {
  xs: "-ml-1.5",
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-4",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  // Simple hash function to pick a consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "bg-primary";
}

export function AvatarGroup({ users, max = 3, size = "sm", className }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;
  const sizeClass = sizeClasses[size];
  const overlapClass = overlapClasses[size];

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center", className)}>
      {displayUsers.map((user, index) => (
        <Tooltip key={user.id}>
          <TooltipTrigger asChild>
            <Avatar
              className={cn(
                sizeClass,
                "ring-2 ring-background cursor-pointer",
                index > 0 && overlapClass
              )}
            >
              {user.imageUrl && <AvatarImage src={user.imageUrl} alt={user.name} />}
              <AvatarFallback className={cn(getAvatarColor(user.name), "text-white font-medium")}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-medium">{user.name}</p>
            {user.email && <p className="text-muted-foreground">{user.email}</p>}
          </TooltipContent>
        </Tooltip>
      ))}

      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                sizeClass,
                overlapClass,
                "flex items-center justify-center rounded-full bg-muted ring-2 ring-background font-medium text-muted-foreground cursor-pointer"
              )}
            >
              +{remainingCount}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{remainingCount} more {remainingCount === 1 ? "person" : "people"}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// Single avatar variant for simpler use cases
interface SingleAvatarProps {
  user: AvatarUser;
  size?: "xs" | "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function SingleAvatar({ user, size = "sm", showTooltip = true, className }: SingleAvatarProps) {
  const sizeClass = sizeClasses[size];

  const avatar = (
    <Avatar className={cn(sizeClass, className)}>
      {user.imageUrl && <AvatarImage src={user.imageUrl} alt={user.name} />}
      <AvatarFallback className={cn(getAvatarColor(user.name), "text-white font-medium")}>
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );

  if (!showTooltip) {
    return avatar;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {avatar}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p className="font-medium">{user.name}</p>
        {user.email && <p className="text-muted-foreground">{user.email}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
