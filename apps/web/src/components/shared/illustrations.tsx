/**
 * Beautiful SVG illustrations for empty states
 * Clean, minimal, and matches the app's design system
 */

import { cn } from "@/lib/utils";

interface IllustrationProps {
  className?: string;
}

export function EmptyFolderIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Folder */}
      <path
        d="M30 60 L30 150 C30 155 32 160 40 160 L160 160 C168 160 170 155 170 150 L170 80 C170 75 168 70 160 70 L100 70 L90 60 Z"
        fill="currentColor"
        className="text-muted/20"
      />
      <path
        d="M30 60 L30 150 C30 155 32 160 40 160 L160 160 C168 160 170 155 170 150 L170 80 C170 75 168 70 160 70 L100 70 L90 60 Z"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/40"
        fill="none"
      />
      {/* Tab */}
      <path
        d="M30 60 L90 60 L100 70 L170 70"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/40"
      />
      {/* Dotted lines inside folder */}
      <line x1="50" y1="95" x2="150" y2="95" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-muted-foreground/20" />
      <line x1="50" y1="115" x2="130" y2="115" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-muted-foreground/20" />
      <line x1="50" y1="135" x2="140" y2="135" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-muted-foreground/20" />
    </svg>
  );
}

export function EmptyStarredIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Large star outline */}
      <path
        d="M100 30 L115 70 L160 75 L130 105 L138 150 L100 125 L62 150 L70 105 L40 75 L85 70 Z"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted-foreground/40"
        fill="none"
      />
      {/* Small stars decoration */}
      <path d="M40 40 L43 48 L51 51 L43 54 L40 62 L37 54 L29 51 L37 48 Z" fill="currentColor" className="text-muted-foreground/20" />
      <path d="M160 45 L162 51 L168 53 L162 55 L160 61 L158 55 L152 53 L158 51 Z" fill="currentColor" className="text-muted-foreground/20" />
      <path d="M170 130 L172 135 L177 137 L172 139 L170 144 L168 139 L163 137 L168 135 Z" fill="currentColor" className="text-muted-foreground/20" />
    </svg>
  );
}

export function EmptyRecentIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Clock face */}
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/40" />
      {/* Clock hands */}
      <line x1="100" y1="100" x2="100" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/60" />
      <line x1="100" y1="100" x2="130" y2="100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/60" />
      {/* Clock center dot */}
      <circle cx="100" cy="100" r="5" fill="currentColor" className="text-muted-foreground/60" />
      {/* Clock markers */}
      <circle cx="100" cy="45" r="3" fill="currentColor" className="text-muted-foreground/30" />
      <circle cx="155" cy="100" r="3" fill="currentColor" className="text-muted-foreground/30" />
      <circle cx="100" cy="155" r="3" fill="currentColor" className="text-muted-foreground/30" />
      <circle cx="45" cy="100" r="3" fill="currentColor" className="text-muted-foreground/30" />
      {/* Decorative dots */}
      <circle cx="30" cy="30" r="4" fill="currentColor" className="text-muted-foreground/15" />
      <circle cx="170" cy="40" r="3" fill="currentColor" className="text-muted-foreground/15" />
      <circle cx="35" cy="165" r="5" fill="currentColor" className="text-muted-foreground/15" />
    </svg>
  );
}

export function EmptyTrashIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Trash can */}
      <path
        d="M60 70 L60 160 C60 165 63 170 68 170 L132 170 C137 170 140 165 140 160 L140 70"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted-foreground/40"
        fill="none"
      />
      {/* Trash lid */}
      <rect x="50" y="60" width="100" height="10" rx="2" fill="currentColor" className="text-muted-foreground/40" />
      {/* Handle */}
      <path d="M80 60 L80 55 C80 50 85 45 90 45 L110 45 C115 45 120 50 120 55 L120 60" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/40" />
      {/* Vertical lines inside */}
      <line x1="85" y1="85" x2="85" y2="145" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
      <line x1="100" y1="85" x2="100" y2="145" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
      <line x1="115" y1="85" x2="115" y2="145" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
      {/* Sparkle decoration (empty state) */}
      <path d="M35 90 L38 100 L48 103 L38 106 L35 116 L32 106 L22 103 L32 100 Z" fill="currentColor" className="text-muted-foreground/20" />
      <path d="M165 80 L167 87 L174 89 L167 91 L165 98 L163 91 L156 89 L163 87 Z" fill="currentColor" className="text-muted-foreground/20" />
    </svg>
  );
}

export function EmptySearchIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Magnifying glass circle */}
      <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/40" />
      {/* Handle */}
      <line x1="115" y1="115" x2="150" y2="150" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/40" />
      {/* Question mark inside */}
      <path
        d="M75 65 C75 60 77 55 85 55 C93 55 95 60 95 65 C95 70 90 72 85 75 L85 85"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-muted-foreground/30"
      />
      <circle cx="85" cy="95" r="2.5" fill="currentColor" className="text-muted-foreground/30" />
      {/* Decorative dots */}
      <circle cx="30" cy="40" r="3" fill="currentColor" className="text-muted-foreground/15" />
      <circle cx="160" cy="50" r="4" fill="currentColor" className="text-muted-foreground/15" />
      <circle cx="40" cy="160" r="3" fill="currentColor" className="text-muted-foreground/15" />
    </svg>
  );
}

export function EmptyUploadIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Cloud */}
      <path
        d="M60 110 C60 95 70 85 85 85 C85 70 95 60 110 60 C125 60 135 70 135 85 C150 85 160 95 160 110 C160 125 150 135 135 135 L70 135 C55 135 45 125 45 110 C45 95 55 85 70 85"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted-foreground/40"
        fill="none"
      />
      {/* Upload arrow */}
      <line x1="100" y1="105" x2="100" y2="145" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/60" />
      <path d="M100 105 L90 115 M100 105 L110 115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/60" />
      {/* Decorative plus signs */}
      <path d="M40 70 L40 80 M35 75 L45 75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/20" />
      <path d="M165 90 L165 100 M160 95 L170 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/20" />
    </svg>
  );
}

export function EmptyShareIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-48 h-48", className)}
    >
      {/* Three connected circles (sharing concept) */}
      <circle cx="100" cy="60" r="20" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/40" />
      <circle cx="60" cy="130" r="20" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/40" />
      <circle cx="140" cy="130" r="20" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/40" />
      {/* Connection lines */}
      <line x1="90" y1="70" x2="70" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
      <line x1="110" y1="70" x2="130" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
      {/* Dots in circles */}
      <circle cx="100" cy="60" r="6" fill="currentColor" className="text-muted-foreground/40" />
      <circle cx="60" cy="130" r="6" fill="currentColor" className="text-muted-foreground/40" />
      <circle cx="140" cy="130" r="6" fill="currentColor" className="text-muted-foreground/40" />
    </svg>
  );
}
