"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Feature {
  icon: string;
  title: string;
  description: string;
  image: {
    light: string;
    dark: string;
  };
}

const features: Feature[] = [
  {
    icon: "/icons/search.png",
    title: "Instant search",
    description:
      "Find any file in milliseconds. Full-text search across file names and metadata, with smart filters to narrow down results.",
    image: {
      light: "/marketing/search-light.webp",
      dark: "/marketing/search-dark.webp",
    },
  },
  {
    icon: "/icons/preview.png",
    title: "Rich previews",
    description:
      "Preview documents, images, PDFs, and code files directly in your browser. Syntax highlighting for 100+ languages.",
    image: {
      light: "/marketing/pdf-preview-light.webp",
      dark: "/marketing/pdf-preview-dark.webp",
    },
  },
  {
    icon: "/icons/secure.png",
    title: "Secure sharing",
    description:
      "Share files and folders with customizable permissions. Set expiration dates, password protection, and track downloads.",
    image: {
      light: "/marketing/share-assets-light.webp",
      dark: "/marketing/share-assets-dark.webp",
    },
  },
];

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      {/* Section header */}
      <motion.div
        className="mx-auto max-w-6xl px-4 text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-[family-name:var(--font-serif-display)]">
          Everything you need
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          A complete file management solution with the features you&apos;d expect from the best cloud storage services.
        </p>
      </motion.div>

      {/* Main features */}
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          className="py-12 md:py-16 mx-auto max-w-6xl px-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={cn(
              "flex flex-col gap-8 md:gap-12 lg:items-center",
              index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse",
            )}
          >
            {/* Text content */}
            <div className="flex flex-col lg:max-w-md gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted border">
                <Image src={feature.icon} alt="" width={28} height={28} className="size-7" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl font-[family-name:var(--font-serif-display)]">
                {feature.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Image */}
            <div className="flex-1 rounded-xl border p-1.5">
              <div className="overflow-hidden rounded-lg border">
                <Image
                  src={feature.image.light}
                  alt={feature.title}
                  width={800}
                  height={600}
                  className="w-full h-auto dark:hidden"
                />
                <Image
                  src={feature.image.dark}
                  alt={feature.title}
                  width={800}
                  height={600}
                  className="w-full h-auto hidden dark:block"
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
