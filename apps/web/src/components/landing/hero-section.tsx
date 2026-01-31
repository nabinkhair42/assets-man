"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons/github-icon";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn("relative py-20 md:py-32 overflow-hidden", className)}>
      {/* Dot grid background */}

      <div className="relative z-10 mx-auto max-w-6xl flex flex-col items-center text-center px-4">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="https://github.com/nabinkhair42/assets-man"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:border-border hover:text-foreground mb-8"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span>Open source and free forever</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl font-[family-name:var(--font-serif-display)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Your files,{" "}
          <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            your cloud
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Self-hosted file management with your own S3-compatible storage.
          Open source, privacy-first, and completely under your control.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mt-10 flex flex-col gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button size="lg" asChild>
            <Link href="/register" className="gap-2">
              Get started
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link
              href="https://github.com/nabinkhair42/assets-man"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <GithubIcon className="h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </motion.div>

        {/* App screenshot */}
        <motion.div
          className="mt-20 w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div
            className="relative rounded-xl border p-2"
          >
            <div className="relative overflow-hidden rounded-lg border aspect-video">
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
        </motion.div>
      </div>
    </section>
  );
}
