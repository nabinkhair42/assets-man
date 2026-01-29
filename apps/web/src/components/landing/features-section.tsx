import { cn } from "@/lib/utils";

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

const crosshatchStyle = {
  backgroundImage: `repeating-linear-gradient(
    -45deg,
    var(--muted),
    var(--muted) 1px,
    transparent 1px,
    transparent 8px
  )`,
};

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <div className={cn("py-16 md:py-24", className)}>
      {features.map((feature, index) => (
        <div
          key={feature.title}
          className="py-12 md:py-16 mx-auto max-w-5xl px-4"
        >
          <div
            className={cn(
              "flex flex-col gap-8 md:gap-12 lg:items-center",
              index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse",
            )}
          >
            {/* Text content */}
            <div className="flex flex-col lg:max-w-md gap-4">
              {/* icon */}
              <div className="p-1 border w-fit rounded bg-muted">
                <img src={feature.icon} className="size-12" />
              </div>
              <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">
                {feature.title}
              </h3>
              <p className="text-lg text-muted-foreground">
                {feature.description}
              </p>
            </div>

            {/* Image */}
            <div
              className="flex-1 p-1 rounded-xl border"
              style={crosshatchStyle}
            >
              <div className="overflow-hidden rounded-xl">
                {/* Light mode image */}
                <img
                  src={feature.image.light}
                  alt={feature.title}
                  className="w-full h-auto dark:hidden"
                />
                {/* Dark mode image */}
                <img
                  src={feature.image.dark}
                  alt={feature.title}
                  className="w-full h-auto hidden dark:block"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
