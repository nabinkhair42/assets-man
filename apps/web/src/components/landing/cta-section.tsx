"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { GithubIcon } from "@/components/icons/github-icon";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface CTASectionProps {
  className?: string;
}

export function CTASection({ className }: CTASectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <motion.div
        className="mx-auto max-w-6xl px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card/50 p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-[family-name:var(--font-serif-display)]">
            Ready to take control?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Deploy your own instance in minutes. Free, open source, forever.
          </p>

          <div className="mt-8 flex justify-center">
            <ButtonGroup>
              <Button size="lg" asChild>
                <Link href="/register" className="gap-2">
                  Get started
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <ButtonGroupSeparator />
              <Button size="lg" variant="outline" asChild>
                <Link
                  href="https://github.com/nabinkhair42/assets-man"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <GithubIcon className="h-4 w-4" />
                  View source
                </Link>
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
