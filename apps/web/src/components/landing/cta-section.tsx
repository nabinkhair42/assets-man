import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { GithubIcon } from "@/components/icons/github-icon";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface CTASectionProps {
  className?: string;
}

export function CTASection({ className }: CTASectionProps) {
  return (
    <section className={cn("relative py-16 md:py-24", className)}>
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Ready to take control?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Deploy your own instance in minutes. Free, open source, forever.
          </p>

          <div className="mt-10 flex justify-center">
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
      </div>
    </section>
  );
}
