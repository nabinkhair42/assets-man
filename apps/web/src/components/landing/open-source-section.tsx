"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons/github-icon";
import { cn } from "@/lib/utils";
import { useStarCount } from "@/hooks/use-star-count";
import { motion } from "framer-motion";

interface OpenSourceSectionProps {
  className?: string;
}

export function OpenSourceSection({ className }: OpenSourceSectionProps) {
  const starCount = useStarCount("nabinkhair42/assets-man");

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <motion.div
        className="mx-auto max-w-6xl px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <GithubIcon className="h-10 w-10 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-[family-name:var(--font-serif-display)]">
            Open source and free forever
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Assets Man is fully open source under the MIT license. Inspect the code,
            contribute features, or self-host your own instance. Your data stays yours.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="outline" size="lg" asChild>
              <Link
                href="https://github.com/nabinkhair42/assets-man"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                Star on GitHub
                {starCount !== null && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-muted rounded-md tabular-nums">
                    {starCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link
                href="https://github.com/nabinkhair42/assets-man"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <GithubIcon className="h-4 w-4" />
                View repository
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
