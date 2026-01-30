import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons/github-icon";
import { cn } from "@/lib/utils";
import Image from "next/image";

const crosshatchStyle = {
  backgroundImage: `repeating-linear-gradient(
    -45deg,
    var(--muted),
    var(--muted) 1px,
    transparent 1px,
    transparent 8px
  )`,
};

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn("relative py-16 md:py-24", className)}>
      <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center text-center px-4">
        {/* Badge */}
        <Link
          href="https://github.com/nabinkhair42/assets-man"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:border-border hover:text-foreground mb-8"
        >
          <GithubIcon className="h-3 w-3" />
          <span>Star us on GitHub</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>

        {/* Headline */}
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Your files, <span className="text-primary">your cloud</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
          Self-hosted file management with your own S3-compatible storage. Open
          source, privacy-first, and completely under your control.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-3">
          <Button size="lg" asChild>
            <Link href="/register" className="gap-2">
              Get started
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* App screenshot */}
        <div className="mt-16 w-full">
          <div
            className="relative rounded-xl border p-2"
            style={crosshatchStyle}
          >
            <div className="relative overflow-hidden rounded-lg aspect-video">
              {/* Light mode image */}
              <Image
                src="/marketing/files-light.webp"
                alt="Assets Manager - File browser interface"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
                className="object-cover dark:hidden"
              />
              {/* Dark mode image */}
              <Image
                src="/marketing/files-dark.webp"
                alt="Assets Manager - File browser interface"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
                className="object-cover hidden dark:block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
