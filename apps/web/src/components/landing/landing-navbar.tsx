"use client";

import Link from "next/link";
import { ArrowUpRight, Moon, Star, Stone, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonGroup } from "@/components/ui/button-group";
import React, { useState } from "react";
import { useStarCount } from "@/hooks/use-star-count";

interface LandingNavbarProps {
  className?: string;
}

export function LandingNavbar({ className }: LandingNavbarProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const starCount = useStarCount("nabinkhair42/assets-man")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className={cn("relative z-50", className)}>
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Stone
            className="size-6 shrink-0 text-accent-foreground"
            fill="currentColor"
            strokeWidth={1.5}
            stroke="white"
          />
          <span className="text-lg font-semibold hidden md:flex">
            Assets Man
          </span>
        </Link>

        {/* Right side navigation */}
        <div className="flex items-center gap-3">
          <ButtonGroup className="shadow-none">
            <Button variant="outline" size="sm" asChild className="shadow-none">
              <Link
                href="https://github.com/nabinkhair42/assets-man"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                <span>Star</span>
                {starCount !== null && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-md tabular-nums">
                    {starCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shadow-none"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              disabled={!mounted}
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </ButtonGroup>
          <Button size="sm" asChild>
            <Link href="/register" className="gap-2">
              Get started
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
