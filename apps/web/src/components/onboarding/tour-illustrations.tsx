import { cn } from "@/lib/utils";

interface IllustrationProps {
  className?: string;
}

export function UploadIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Cloud base */}
      <path
        d="M70 95 C70 85 78 77 88 77 C88 67 98 59 110 59 C122 59 132 67 132 77 C142 77 150 85 150 95 C150 105 142 113 132 113 L88 113 C78 113 70 105 70 95 Z"
        fill="currentColor"
        className="text-primary/10"
      />
      <path
        d="M70 95 C70 85 78 77 88 77 C88 67 98 59 110 59 C122 59 132 67 132 77 C142 77 150 85 150 95 C150 105 142 113 132 113 L88 113 C78 113 70 105 70 95 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-primary"
      />
      
      {/* Upload arrow - thicker and more prominent */}
      <g className="animate-pulse" style={{ animationDuration: "2s" }}>
        <path
          d="M110 85 L110 110"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M110 85 L102 93 M110 85 L118 93"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
      </g>
      
      {/* Files/documents below cloud */}
      <g className="text-muted-foreground/40">
        {/* File 1 */}
        <rect x="55" y="125" width="30" height="40" rx="3" fill="currentColor" className="text-muted/30" />
        <rect x="55" y="125" width="30" height="40" rx="3" stroke="currentColor" strokeWidth="2" />
        <line x1="60" y1="135" x2="80" y2="135" stroke="currentColor" strokeWidth="1.5" />
        <line x1="60" y1="142" x2="75" y2="142" stroke="currentColor" strokeWidth="1.5" />
        <line x1="60" y1="149" x2="80" y2="149" stroke="currentColor" strokeWidth="1.5" />
        
        {/* File 2 */}
        <rect x="95" y="130" width="30" height="40" rx="3" fill="currentColor" className="text-muted/30" />
        <rect x="95" y="130" width="30" height="40" rx="3" stroke="currentColor" strokeWidth="2" />
        <line x1="100" y1="140" x2="120" y2="140" stroke="currentColor" strokeWidth="1.5" />
        <line x1="100" y1="147" x2="115" y2="147" stroke="currentColor" strokeWidth="1.5" />
        <line x1="100" y1="154" x2="120" y2="154" stroke="currentColor" strokeWidth="1.5" />
        
        {/* File 3 */}
        <rect x="135" y="127" width="30" height="40" rx="3" fill="currentColor" className="text-muted/30" />
        <rect x="135" y="127" width="30" height="40" rx="3" stroke="currentColor" strokeWidth="2" />
        <line x1="140" y1="137" x2="160" y2="137" stroke="currentColor" strokeWidth="1.5" />
        <line x1="140" y1="144" x2="155" y2="144" stroke="currentColor" strokeWidth="1.5" />
        <line x1="140" y1="151" x2="160" y2="151" stroke="currentColor" strokeWidth="1.5" />
      </g>
      
      {/* Floating sparkles */}
      <circle cx="45" cy="70" r="3" fill="currentColor" className="text-primary/30 animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1.5s" }} />
      <circle cx="175" cy="80" r="2.5" fill="currentColor" className="text-primary/30 animate-pulse" style={{ animationDelay: "500ms", animationDuration: "1.5s" }} />
      <circle cx="60" cy="110" r="2" fill="currentColor" className="text-primary/30 animate-pulse" style={{ animationDelay: "1000ms", animationDuration: "1.5s" }} />
      <path d="M170 100 L171 105 L176 106 L171 107 L170 112 L169 107 L164 106 L169 105 Z" fill="currentColor" className="text-primary/20" />
    </svg>
  );
}

export function OrganizeIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Folder 1 */}
      <path
        d="M40 60 L40 110 C40 113 42 115 45 115 L105 115 C108 115 110 113 110 110 L110 75 C110 72 108 70 105 70 L75 70 L70 65 L45 65 C42 65 40 67 40 70 Z"
        fill="currentColor"
        className="text-muted/20"
      />
      <path
        d="M40 60 L40 110 C40 113 42 115 45 115 L105 115 C108 115 110 113 110 110 L110 75 C110 72 108 70 105 70 L75 70 L70 65 L45 65 C42 65 40 67 40 70 Z"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
      
      {/* Folder 2 */}
      <path
        d="M130 80 L130 130 C130 133 132 135 135 135 L195 135 C198 135 200 133 200 130 L200 95 C200 92 198 90 195 90 L165 90 L160 85 L135 85 C132 85 130 87 130 90 Z"
        fill="currentColor"
        className="text-muted/20"
      />
      <path
        d="M130 80 L130 130 C130 133 132 135 135 135 L195 135 C198 135 200 133 200 130 L200 95 C200 92 198 90 195 90 L165 90 L160 85 L135 85 C132 85 130 87 130 90 Z"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/40"
      />
      
      {/* Connection lines */}
      <path
        d="M75 115 L75 125 L165 125 L165 135"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
        className="text-primary/50"
      />
      
      {/* Sparkles */}
      <path d="M55 50 L57 56 L63 58 L57 60 L55 66 L53 60 L47 58 L53 56 Z" fill="currentColor" className="text-primary/30" />
      <path d="M180 70 L181 74 L185 75 L181 76 L180 80 L179 76 L175 75 L179 74 Z" fill="currentColor" className="text-primary/30" />
    </svg>
  );
}

export function ShareIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Center user */}
      <circle cx="120" cy="70" r="25" fill="currentColor" className="text-primary/20" />
      <circle cx="120" cy="70" r="25" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <circle cx="120" cy="70" r="10" fill="currentColor" className="text-primary" />
      
      {/* Left user */}
      <circle cx="60" cy="120" r="20" fill="currentColor" className="text-muted/20" />
      <circle cx="60" cy="120" r="20" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
      <circle cx="60" cy="120" r="8" fill="currentColor" className="text-muted-foreground/40" />
      
      {/* Right user */}
      <circle cx="180" cy="120" r="20" fill="currentColor" className="text-muted/20" />
      <circle cx="180" cy="120" r="20" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
      <circle cx="180" cy="120" r="8" fill="currentColor" className="text-muted-foreground/40" />
      
      {/* Connection lines with arrows */}
      <path
        d="M105 85 L70 110"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary/60"
      />
      <path
        d="M70 110 L73 105 M70 110 L75 112"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/60"
      />
      
      <path
        d="M135 85 L170 110"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary/60"
      />
      <path
        d="M170 110 L165 112 M170 110 L167 105"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/60"
      />
      
      {/* Share icon in center */}
      <path
        d="M120 60 L125 55 L120 50 M120 60 L115 55 L120 50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-background"
      />
      
      {/* Decorative elements */}
      <circle cx="120" cy="30" r="3" fill="currentColor" className="text-primary/20 animate-pulse" />
      <circle cx="40" cy="90" r="4" fill="currentColor" className="text-primary/20 animate-pulse" style={{ animationDelay: "200ms" }} />
      <circle cx="200" cy="90" r="4" fill="currentColor" className="text-primary/20 animate-pulse" style={{ animationDelay: "400ms" }} />
    </svg>
  );
}
